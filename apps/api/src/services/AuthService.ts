import { User, IUserDocument } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

export class AuthService {
  async register(data: any) {
    // 1. Check if user already exists (Fast check)
    const existingUser = await User.exists({ email: data.email });
    if (existingUser) {
        throw new ApiError('Email already registered', 409);
    }

    // 2. Hash password directly
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Find default 'Civilian' role
    const civilianRole = await Role.findOne({ name: 'Civilian' }).lean();
    const roles = civilianRole ? [civilianRole._id] : [];

    // 4. Create User
    const user = await User.create({
      ...data,
      password: hashedPassword,
      roles: roles
    });

    return { 
        id: user._id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
    };
  }

  async login(email: string, password: string) {
    console.log(`[Auth] 🔐 Login attempt for: ${email}`);
    
    // 1. Fetch user with password and flattened permissions in one go if possible
    // Note: Deep populate is heavy. Ensure indexes are used on email.
    // Use .lean() for better performance (returns POJO instead of Mongoose Document)
    const user = await User.findOne({ email }).select('+password').populate({
      path: 'roles',
      populate: { path: 'permissions' }
    }).lean() as any; // Cast to any to handle .lean() return type dynamically

    if (!user) {
        console.warn(`[Auth] ❌ User not found: ${email}`);
        throw new ApiError('Invalid credentials', 401);
    }

    // Guard against missing password (e.g. OAuth users or bad seed data)
    if (!user.password) {
        console.warn(`[Auth] ❌ User ${email} has no password set.`);
        throw new ApiError('Invalid credentials', 401);
    }

    // 2. Async Compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       console.warn(`[Auth] ❌ Password mismatch for: ${email}`);
       throw new ApiError('Invalid credentials', 401);
    }
    
    console.log(`[Auth] ✅ Password verified for: ${email}`);

    // 3. Flatten scopes efficiently

    // 3. Flatten scopes efficiently
    const scopes = new Set<string>();
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles as any[]) {
         if (role?.permissions && Array.isArray(role.permissions)) {
            for (const permission of role.permissions) {
                if (permission && permission.scope) scopes.add(permission.scope);
            }
         }
      }
    }

    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        scopes: Array.from(scopes) 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: '7d' }
    );

    return { accessToken: token, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
      
      const user = await User.findById(decoded.id).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      }).lean() as any;

      if (!user) {
         throw new ApiError('Invalid refresh token', 401);
      }

      const scopes = new Set<string>();
      if (user.roles && Array.isArray(user.roles)) {
        for (const role of user.roles as any[]) {
           if (role?.permissions && Array.isArray(role.permissions)) {
              for (const permission of role.permissions) {
                  if (permission && permission.scope) scopes.add(permission.scope);
              }
           }
        }
      }

      const newAccessToken = jwt.sign(
        { 
            id: user._id.toString(), 
            email: user.email, 
            scopes: Array.from(scopes) 
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
       console.error('[Auth] Refresh Token Failed:', error);
       throw new ApiError('Invalid refresh token', 401);
    }
  }
}

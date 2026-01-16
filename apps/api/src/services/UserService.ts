import { User, IUserDocument } from '../models/User';
import { Role } from '../models/Role';

export class UserService {
  async getAllUsers(): Promise<IUserDocument[]> {
    return User.find().populate('roles').select('-password');
  }

  async getUserById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).populate('roles').select('-password');
  }

  async updateProfile(userId: string, data: Partial<IUserDocument>) {
     // Allow updating fields except roles, password, email (email update usually requires re-verification)
     const { roles, password, email, ...safeData } = data as any;
     
     return User.findByIdAndUpdate(
         userId,
         { $set: safeData },
         { new: true }
     ).populate('roles').select('-password');
  }

  // Admin only: Update user's roles
  async updateUserRoles(userId: string, roleNames: string[]) {
    // Convert role names to IDs
    const roles = await Role.find({ name: { $in: roleNames } });
    const roleIds = roles.map(r => r._id);
    
    return User.findByIdAndUpdate(
      userId, 
      { roles: roleIds },
      { new: true }
    ).populate('roles').select('-password');
  }
}

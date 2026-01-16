import { Controller, Get, Patch, Route, Security, Body, Tags, Path, Request } from 'tsoa';
import { IUser } from '@repo/types';
import { UserService } from '../services/UserService';

@Route('users')
@Tags('Users')
export class UserController extends Controller {
  private service: UserService;

  constructor() {
    super();
    this.service = new UserService();
  }

  /**
   * Get all users. Requires 'user:read' permission.
   */
  @Get()
  @Security('jwt', ['user:read'])
  public async getAllUsers(): Promise<IUser[]> {
    const users = await this.service.getAllUsers();
    // Transform to IUser to match interface strictly if needed, usually Mongoose docs suffice if getters match
    // But to be safe with Tsoa:
    return users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
      roles: u.roles as any // Depending on population
    }));
  }

  /**
   * Update current user profile.
   */
  @Patch('me')
  @Security('jwt')
  public async updateProfile(
    @Body() requestBody: Partial<IUser>,
    @Request() request: any
  ): Promise<IUser> {
    const userId = request.user.id;
    const u = await this.service.updateProfile(userId, requestBody as any);
    if (!u) {
      this.setStatus(404);
      throw new Error('User not found');
    }
    return {
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
      phone: u.phone,
      preferences: u.preferences,
      roles: u.roles as any
    };
  }

  /**
   * Update user roles. Requires 'admin:access' permission.
   */
  @Patch('{userId}/roles')
  @Security('jwt', ['admin:access'])
  public async updateUserRoles(
    @Path() userId: string,
    @Body() requestBody: { roles: string[] }
  ): Promise<IUser> {
    const u = await this.service.updateUserRoles(userId, requestBody.roles);
    if (!u) {
      this.setStatus(404);
      throw new Error('User not found');
    }
    return {
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
      roles: u.roles as any
    };
  }
}

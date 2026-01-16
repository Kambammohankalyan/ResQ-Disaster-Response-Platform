import 'dotenv/config'; // Load env vars first
import mongoose from 'mongoose';
import { Permission } from './models/Permission';
import { Role } from './models/Role';
import { User } from './models/User';
import bcrypt from 'bcryptjs';

// Force direct connection when running locally to avoid "mongo" hostname resolution issues from RS config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing Auth Data
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    console.log('🗑️ Cleared existing auth data');

    // 2. Create Permissions
    const permissions = [
      // Incident Scopes
      { scope: 'incident:create', description: 'Report new incidents', module: 'Incident' },
      { scope: 'incident:read:own', description: 'View own reports', module: 'Incident' },
      { scope: 'incident:read:all', description: 'View all incidents', module: 'Incident' },
      { scope: 'incident:update', description: 'Update incident status', module: 'Incident' },
      { scope: 'incident:delete', description: 'Delete incidents', module: 'Incident' },
      { scope: 'incident:verify', description: 'Verify reported incidents', module: 'Incident' },
      
      // Task Scopes
      { scope: 'task:accept', description: 'Accept tasks/incidents', module: 'Task' },
      { scope: 'task:update', description: 'Update task progress', module: 'Task' },
      
      // User Scopes
      { scope: 'user:read', description: 'View users', module: 'Auth' },
      { scope: 'user:verify', description: 'Verify volunteer signups', module: 'Auth' },
      { scope: 'profile:update', description: 'Update own profile', module: 'Auth' },
      
      // Admin/System Scopes
      { scope: 'admin:access', description: 'Access admin panels', module: 'Admin' },
      { scope: 'system:monitor', description: 'Monitor system health', module: 'Admin' },
      { scope: 'role:manage', description: 'Manage roles and permissions', module: 'Admin' },
      { scope: 'alert:broadcast', description: 'Broadcast emergency alerts', module: 'Communication' },
    ];

    const createdPermissions = await Permission.insertMany(permissions);
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // Helper to get ID by scope
    const getP = (scope: string) => createdPermissions.find(p => p.scope === scope)?._id;

    // 3. Create Roles
    const civilianPerms = [
      getP('incident:create'), 
      getP('incident:read:own'),
      getP('profile:update')
    ].filter(Boolean);

    const volunteerPerms = [
      ...civilianPerms,
      getP('incident:read:all'),
      getP('task:accept'),
      getP('task:update'),
    ].filter(Boolean);

    const dispatcherPerms = [
      ...volunteerPerms,
      getP('incident:update'),
      getP('incident:delete'),
      getP('incident:verify'),
      getP('user:verify'),
      getP('alert:broadcast'),
      getP('user:read')
    ].filter(Boolean);

    const adminPerms = createdPermissions.map(p => p._id);

    const roles = await Role.create([
      { name: 'Admin', description: 'Incident Commander', permissions: adminPerms, isSystem: true },
      { name: 'Dispatcher', description: 'Operations Chief', permissions: dispatcherPerms, isSystem: true },
      { name: 'Volunteer', description: 'Field Responder', permissions: volunteerPerms, isSystem: true },
      { name: 'Civilian', description: 'Public Reporter', permissions: civilianPerms, isSystem: true },
    ]);

    console.log(`✅ Created ${roles.length} roles`);

    // 4. Create Users
    const hash = async (pwd: string) => await bcrypt.hash(pwd, 10);
    const getRole = (name: string) => roles.find(r => r.name === name)?._id;

    await User.create([
      {
        email: 'admin@resq.local',
        password: await hash('Admin123!'),
        firstName: 'System',
        lastName: 'Admin',
        roles: [getRole('Admin')],
        isActive: true
      },
      {
        email: 'dispatch@resq.local',
        password: await hash('Dispatch123!'),
        firstName: 'Sarah',
        lastName: 'Connor',
        roles: [getRole('Dispatcher')],
        isActive: true
      },
      {
        email: 'volunteer@resq.local',
        password: await hash('Volunteer123!'),
        firstName: 'John',
        lastName: 'Rambo',
        roles: [getRole('Volunteer')],
        isActive: true
      },
      {
        email: 'civilian@resq.local',
        password: await hash('Help123!'),
        firstName: 'Jane',
        lastName: 'Doe',
        roles: [getRole('Civilian')],
        isActive: true
      }
    ]);

    console.log(`✅ Created 4 System Users`);


    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed', err);
    process.exit(1);
  }
};

seed();

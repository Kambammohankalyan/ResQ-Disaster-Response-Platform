import mongoose from 'mongoose';
import { User } from './src/models/User';
import { Role } from './src/models/Role';
import { Permission } from './src/models/Permission';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const PERMISSIONS = [
    { scope: 'incident:create', description: 'Create new incidents', module: 'incidents' },
    { scope: 'incident:read', description: 'Read incidents', module: 'incidents' },
    { scope: 'incident:read:own', description: 'Read own incidents', module: 'incidents' },
    { scope: 'incident:read:all', description: 'Read all incidents', module: 'incidents' },
    { scope: 'incident:update', description: 'Update incidents', module: 'incidents' },
    { scope: 'incident:delete', description: 'Delete incidents', module: 'incidents' },
    { scope: 'incident:verify', description: 'Verify incidents', module: 'incidents' },
    { scope: 'task:accept', description: 'Accept tasks', module: 'tasks' },
    { scope: 'task:update', description: 'Update tasks', module: 'tasks' },
    { scope: 'user:read', description: 'Read users', module: 'users' },
    { scope: 'user:verify', description: 'Verify users', module: 'users' },
    { scope: 'admin:access', description: 'Full admin access', module: 'admin' },
    { scope: 'system:monitor', description: 'Monitor system', module: 'system' },
    { scope: 'role:manage', description: 'Manage roles', module: 'roles' },
    { scope: 'alert:broadcast', description: 'Broadcast alerts', module: 'alerts' }
];

const ROLES = {
    Civilian: ['incident:create', 'incident:read:own'],
    Volunteer: ['incident:read', 'incident:read:all', 'task:accept', 'task:update'],
    Dispatcher: ['incident:read', 'incident:read:all', 'incident:update', 'incident:verify', 'user:read', 'task:update', 'alert:broadcast'],
    Admin: PERMISSIONS.map(p => p.scope) // All permissions
};

const USERS = [
    { email: 'admin@resq.local', password: 'Help123!', firstName: 'Super', lastName: 'Admin', role: 'Admin' },
    { email: 'dispatcher@resq.local', password: 'Help123!', firstName: 'Chief', lastName: 'Dispatcher', role: 'Dispatcher' },
    { email: 'volunteer@resq.local', password: 'Help123!', firstName: 'John', lastName: 'Volunteer', role: 'Volunteer' },
    { email: 'civilian@resq.local', password: 'Help123!', firstName: 'Jane', lastName: 'Citizen', role: 'Civilian' },
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connected to MongoDB');

        // 1. Clear existing data
        await User.deleteMany({});
        await Role.deleteMany({});
        await Permission.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // 2. Create Permissions
        const createdPermissions = await Permission.insertMany(PERMISSIONS);
        const permissionMap = new Map(createdPermissions.map(p => [p.scope, p._id]));
        console.log(`✅ Created ${createdPermissions.length} permissions`);

        // 3. Create Roles
        const roleMap = new Map();
        for (const [roleName, scopes] of Object.entries(ROLES)) {
            const rolePermissions = scopes.map(scope => permissionMap.get(scope)).filter(Boolean);
            const role = await Role.create({
                name: roleName,
                description: `Default ${roleName} role`,
                permissions: rolePermissions,
                isSystem: true
            });
            roleMap.set(roleName, role._id);
            console.log(`✅ Created Role: ${roleName}`);
        }

        // 4. Create Users
        for (const user of USERS) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({
                email: user.email,
                password: hashedPassword,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [roleMap.get(user.role)],
                isActive: true
            });
            console.log(`👤 Created User: ${user.email} (${user.role})`);
        }

        console.log('\n🎉 Seeding Complete! Credentials:');
        USERS.forEach(u => {
            console.log(`   ${u.role}: ${u.email} / ${u.password}`);
        });

    } catch (e) {
        console.error('Errors:', e);
    } finally {
        await mongoose.disconnect();
    }
};

seed();

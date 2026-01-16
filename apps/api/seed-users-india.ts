import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';
import { Role } from './src/models/Role';
import { Permission } from './src/models/Permission';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

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

const INDIAN_USERS = [
    { email: 'admin@resq.in', password: 'Help123!', firstName: 'Rajesh', lastName: 'Kumar', role: 'Admin', phone: '+919876543210' },
    { email: 'dispatcher@resq.in', password: 'Help123!', firstName: 'Anita', lastName: 'Desai', role: 'Dispatcher', phone: '+919876543211' },
    { email: 'volunteer@resq.in', password: 'Help123!', firstName: 'Vikram', lastName: 'Singh', role: 'Volunteer', phone: '+919876543212' },
    { email: 'priya@resq.in', password: 'Help123!', firstName: 'Priya', lastName: 'Sharma', role: 'Civilian', phone: '+919876543213' },
    { email: 'rahul@resq.in', password: 'Help123!', firstName: 'Rahul', lastName: 'Verma', role: 'Civilian', phone: '+919876543214' },
    { email: 'suresh@resq.in', password: 'Help123!', firstName: 'Suresh', lastName: 'Patel', role: 'Civilian', phone: '+919876543215' }
];

const seedIndia = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear existing data
        await User.deleteMany({});
        await Role.deleteMany({});
        await Permission.deleteMany({});
        console.log('🗑️ Cleared existing Users, Roles, and Permissions');

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
        for (const user of INDIAN_USERS) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({
                email: user.email,
                password: hashedPassword,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [roleMap.get(user.role)],
                isActive: true,
                phone: user.phone
            });
            console.log(`👤 Created User: ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
        }

        console.log('\n🎉 Seeding Complete! New Credentials:');
        INDIAN_USERS.forEach(u => {
            console.log(`   ${u.role}: ${u.email} / ${u.password}`);
        });

    } catch (e) {
        console.error('Errors:', e);
    } finally {
        await mongoose.disconnect();
    }
};

seedIndia();

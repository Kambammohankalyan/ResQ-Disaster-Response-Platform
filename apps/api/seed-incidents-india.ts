import 'dotenv/config';
import mongoose from 'mongoose';
import { IncidentModel } from './src/models/Incident';
import { User } from './src/models/User';
import { IIncident } from '@repo/types';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const seedIncidents = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Fetch Users to link data
        const admin = await User.findOne({ email: 'admin@resq.in' });
        const dispatcher = await User.findOne({ email: 'dispatcher@resq.in' });
        const volunteer = await User.findOne({ email: 'volunteer@resq.in' });
        const civilian1 = await User.findOne({ email: 'priya@resq.in' }); // Priya
        const civilian2 = await User.findOne({ email: 'rahul@resq.in' }); // Rahul
        const civilian3 = await User.findOne({ email: 'suresh@resq.in' }); // Suresh

        if (!admin || !dispatcher || !volunteer || !civilian1) {
            console.error('❌ Users not found. run seed-users-india.ts first.');
            process.exit(1);
        }

        // 2. Clear existing incidents
        await IncidentModel.deleteMany({});
        console.log('🗑️ Cleared existing incidents');

        const INCIDENTS: Partial<IIncident>[] = [
            {
                title: 'Severe Urban Flooding - Dadar West',
                description: 'Water levels rising above 3ft. People stuck in ground floor apartments. Need immediate evacuation assistance.',
                type: 'FLOOD',
                location: { lat: 19.0213, lng: 72.8424 }, // Mumbai (Dadar)
                severity: 'CRITICAL',
                status: 'OPEN',
                reporterId: civilian1.id, // Priya
                verified: false,
                createdAt: new Date('2023-10-14T10:00:00Z')
            },
            {
                title: 'High-Rise Chemical Fire',
                description: 'Smoke detected from 4th floor of commercial complex. Fire brigade alerted but traffic delaying status.',
                type: 'FIRE',
                location: { lat: 28.6304, lng: 77.2177 }, // Delhi (Connaught Place)
                severity: 'HIGH',
                status: 'IN_PROGRESS',
                reporterId: civilian2?.id, // Rahul
                assignedToId: volunteer.id, // Assigned to Vikram
                verified: true,
                createdAt: new Date('2023-10-15T14:30:00Z')
            },
            {
                title: 'Post-Earthquake Structure Collapse',
                description: 'Old building wall collapsed after tremors. No casualties reported but path blocked.',
                type: 'EARTHQUAKE',
                location: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
                severity: 'MEDIUM',
                status: 'RESOLVED',
                reporterId: dispatcher.id, // Reported by Dispatcher
                assignedToId: admin.id, // Reviewed by Admin
                verified: true,
                createdAt: new Date('2023-10-12T08:15:00Z')
            },
            {
                title: 'Medical Supply Shortage',
                description: 'Local relief camp running low on insulin and basic first aid kits.',
                type: 'MEDICAL',
                location: { lat: 12.9716, lng: 77.5946 }, // Bangalore
                severity: 'LOW',
                status: 'OPEN',
                reporterId: civilian3?.id, // Suresh
                verified: true,
                createdAt: new Date()
            },
            {
                title: 'Landslide on Highway',
                description: 'Heavy rocks blocking NH-44 access. Traffic halted.',
                type: 'OTHER',
                location: { lat: 31.1048, lng: 77.1734 }, // Shimla
                severity: 'HIGH',
                status: 'OPEN',
                reporterId: volunteer.id, // Vikram
                verified: true,
                createdAt: new Date()
            },
            {
                title: 'Dengue Outbreak Zone',
                description: 'Multiple cases reported in Block C. Fumigation required immediately.',
                type: 'MEDICAL',
                location: { lat: 13.0827, lng: 80.2707 }, // Chennai
                severity: 'MEDIUM',
                status: 'IN_PROGRESS',
                reporterId: civilian1.id, // Priya
                assignedToId: volunteer.id, // Assigned to Vikram
                verified: true,
                createdAt: new Date()
            }
        ];

        // 3. Insert Include
        const created = await IncidentModel.insertMany(INCIDENTS);
        
        console.log(`✅ Seeded ${created.length} incidents across India.`);
        console.log('------------------------------------------------');
        created.forEach(inc => {
            console.log(`[${inc.type}] ${inc.title} - ${inc.status} (Sev: ${inc.severity})`);
        });

    } catch (e) {
        console.error('❌ Error seeding incidents:', e);
    } finally {
        await mongoose.disconnect();
    }
};

seedIncidents();

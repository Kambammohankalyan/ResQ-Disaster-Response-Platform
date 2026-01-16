import 'dotenv/config';
import mongoose from 'mongoose';
import { IncidentModel } from './src/models/Incident';
import { IIncident } from '@repo/types';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const INCIDENTS: Partial<IIncident>[] = [
    {
        title: 'Flash Flood Mumbai',
        description: 'Severe flooding in residential area due to heavy rain.',
        type: 'FLOOD',
        location: { lat: 19.0760, lng: 72.8777 }, // Mumbai
        severity: 'CRITICAL',
        status: 'OPEN',
        verified: true,
        createdAt: new Date()
    },
    {
        title: 'Building Fire Delhi',
        description: 'Commercial building caught fire. Firefighters needed.',
        type: 'FIRE',
        location: { lat: 28.6139, lng: 77.2090 }, // Delhi
        severity: 'HIGH',
        status: 'OPEN',
        verified: true,
        createdAt: new Date()
    },
    {
        title: 'Earthquake Tremors Gujarat',
        description: 'Mild tremors felt, structural damage checks needed.',
        type: 'EARTHQUAKE',
        location: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        verified: true,
        createdAt: new Date()
    },
    {
        title: 'Medical Emergency Bangalore',
        description: 'Need medical assistance for displaced families.',
        type: 'MEDICAL',
        location: { lat: 12.9716, lng: 77.5946 }, // Bangalore
        severity: 'LOW',
        status: 'RESOLVED',
        verified: true,
        createdAt: new Date()
    }
];

const seedIncidents = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connected to MongoDB');

        // Clear existing incidents to ensure clean slate for demo
        await IncidentModel.deleteMany({});
        console.log('🗑️ Cleared existing incidents');

        await IncidentModel.insertMany(INCIDENTS);
        console.log(`✅ Seeded ${INCIDENTS.length} incidents`);

    } catch (e) {
        console.error('Errors:', e);
    } finally {
        await mongoose.disconnect();
    }
};

seedIncidents();

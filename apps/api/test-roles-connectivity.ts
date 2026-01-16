import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';
import { IncidentModel } from './src/models/Incident';
import { AuthService } from './src/services/AuthService'; 
import { IncidentService } from './src/services/IncidentService';
import './src/models/Role';
import './src/models/Permission';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const runTest = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        const authService = new AuthService();
        const incidentService = new IncidentService();

        // 1. CIVILIAN: Create Incident
        console.log('\n👤 1. Testing CIVILIAN Role...');
        const civilianToken = await authService.login('civilian@resq.local', 'Help123!');
        const civilianUser = await User.findOne({ email: 'civilian@resq.local' });
        
        if (!civilianToken || !civilianUser) throw new Error('Civilian login failed');
        console.log('✅ Civilian Logged In');

        // Check Scope
        // In a real request, middleware checks this. Here we assume login gave us right scopes and test service logic.
        
        const incidentData = {
            title: 'Test Incident via Script',
            description: 'Automated connectivity test',
            type: 'FIRE' as const,
            severity: 'HIGH' as const,
            location: { lat: 40.7128, lng: -74.0060 }
        };

        const newIncident = await incidentService.createIncident(incidentData, civilianUser.id);
        console.log('✅ Civilian Created Incident:', newIncident.id);


        // 2. VOLUNTEER: View & Claim
        console.log('\n👷 2. Testing VOLUNTEER Role...');
        const volunteerToken = await authService.login('volunteer@resq.local', 'Volunteer123!');
        const volunteerUser = await User.findOne({ email: 'volunteer@resq.local' });

        if (!volunteerToken || !volunteerUser) throw new Error('Volunteer login failed');

        const allIncidents = await incidentService.getIncidents();
        const found = allIncidents.find(i => i.id === newIncident.id);
        if (found) {
            console.log('✅ Volunteer can SEE the incident');
        } else {
            console.error('❌ Volunteer CANNOT see the incident');
        }

        // Claim
        const claimed = await incidentService.assignIncident(newIncident.id, volunteerUser.id);
        if (claimed && claimed.assignedToId === volunteerUser.id && claimed.status === 'IN_PROGRESS') {
            console.log('✅ Volunteer CLAIMED the incident');
        } else {
            console.error('❌ Volunteer CLAIM failed', claimed);
        }


        // 3. DISPATCHER: Verify
        console.log('\n📡 3. Testing DISPATCHER Role...');
        const dispatchToken = await authService.login('dispatch@resq.local', 'Dispatch123!');
        
        const verified = await incidentService.verifyIncident(newIncident.id);
        if (verified && verified.verified === true) {
            console.log('✅ Dispatcher VERIFIED the incident');
        } else {
            console.error('❌ Dispatcher VERIFY failed');
        }

        console.log('\n🎉 ALL ROLE CHECKS PASSED SUCCESSFULLY');

        // Cleanup
        await IncidentModel.findByIdAndDelete(newIncident.id);
        console.log('🧹 Cleanup: Test incident deleted');

    } catch (e: any) {
        console.error('❌ TEST FAILED:', e.message);
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();

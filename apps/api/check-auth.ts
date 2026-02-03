import 'dotenv/config'; // Load .env
import mongoose from 'mongoose';
import { User } from './src/models/User';
import { AuthService } from './src/services/AuthService'; 
import bcrypt from 'bcryptjs';

// Ensure models are registered
import './src/models/Role';
import './src/models/Permission';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

const check = async () => {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log(' Connected to MongoDB Atlas');

        const email = 'admin@resq.local'; 
        
        // 1. Raw User Check
        console.log(`\n Checking for user: ${email}...`);
        const user = await User.findOne({ email }).select('+password').lean();
        
        if (!user) {
            console.error(' User NOT FOUND in database.');
            console.log('Attempting to list ALL users to see what exists...');
            const allUsers = await User.find({}, 'email firstName lastName roles');
            console.table(allUsers);
            return;
        }

        console.log(' User FOUND:', { 
            id: user._id, 
            email: user.email, 
            hasPassword: !!user.password,
            passwordHashLength: user.password?.length 
        });

        // 2. Validate Password
        const password = 'Admin123!';
        console.log(`\n🔑 Testing password: "${password}"`);
        const isMatch = await bcrypt.compare(password, user.password as string);
        
        if (isMatch) {
            console.log('✅ Password MATCHES! Credentials are correct.');
            
            // 3. Test Service
            console.log('\n🚀 Testing AuthService.login()...');
            const service = new AuthService();
            const token = await service.login(email, password);
            console.log('✅ Login Successful! Token generated.');
        } else {
            console.error('❌ Password MISMATCH. The stored hash does not match "Admin123!".');
            console.log('Stored Hash:', user.password);
        }

    } catch (e: any) {
        console.error('⚠️ ERROR:', e.message);
        if (e.response) console.error(e.response);
    } finally {
        await mongoose.disconnect();
    }
};

check();

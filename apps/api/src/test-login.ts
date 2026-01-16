
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq?directConnection=true';

async function test() {
    await mongoose.connect(MONGO_URI);
    const email = 'admin@resq.local';
    const pass = 'Admin123!';
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
        console.log('User not found or password missing');
        process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('Stored Hash:', user.password);
    
    const match = await bcrypt.compare(pass, user.password!);
    console.log('Password Match:', match);
    process.exit(0);
}

test().catch(console.error);

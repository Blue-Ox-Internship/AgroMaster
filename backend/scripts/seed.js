const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const supabaseClient = require('../supabase/client');
const demoUsers = require('../config/demo-users');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrodrop';
const supabaseConfigured = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

async function seedMongo() {
    await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
    });

    for (const demoUser of demoUsers) {
        const existingUser = await User.findOne({ email: demoUser.email.toLowerCase() });
        const userData = {
            full_name: demoUser.full_name,
            email: demoUser.email.toLowerCase(),
            phone: demoUser.phone,
            business_name: demoUser.business_name,
            role: demoUser.role,
            is_active: true
        };

        if (existingUser) {
            Object.assign(existingUser, userData);
            existingUser.password = demoUser.password;
            await existingUser.save();
        } else {
            await User.create({ ...userData, password: demoUser.password });
        }
    }

    await mongoose.disconnect();
    console.log(`MongoDB seeded with ${demoUsers.length} demo users.`);
}

async function seedSupabase() {
    if (!supabaseConfigured) {
        console.log('Supabase skipped: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.');
        return;
    }

    for (const demoUser of demoUsers) {
        const passwordHash = await bcrypt.hash(demoUser.password, 10);
        const payload = {
            full_name: demoUser.full_name,
            email: demoUser.email.toLowerCase(),
            phone: demoUser.phone,
            business_name: demoUser.business_name,
            password_hash: passwordHash,
            role: demoUser.role,
            is_active: true
        };

        const { error } = await supabaseClient
            .from('users')
            .upsert(payload, { onConflict: 'email' });

        if (error) {
            throw new Error(`Supabase seed failed for ${demoUser.email}: ${error.message}`);
        }
    }

    console.log(`Supabase seeded with ${demoUsers.length} demo users.`);
}

async function main() {
    let mongoSeeded = false;

    try {
        await seedMongo();
        mongoSeeded = true;
    } catch (error) {
        console.warn(`MongoDB skipped: ${error.message}`);
    }

    await seedSupabase();

    if (!mongoSeeded && !supabaseConfigured) {
        process.exitCode = 1;
        console.error('No database was seeded. Start MongoDB or add Supabase credentials, then run npm run seed again.');
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});

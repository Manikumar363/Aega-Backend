import mongoose from 'mongoose';
import dotenv from 'dotenv';
import University from '../src/models/university.js';

dotenv.config();

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/aega';

async function main() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', MONGO);

    const docs = await University.find().sort({ createdAt: -1 }).lean();
    if (!docs || docs.length === 0) {
      console.log('No universities found in the database.');
    } else {
      console.log(`Found ${docs.length} universities:`);
      docs.forEach((u) => {
        console.log('---');
        console.log(`id: ${u._id}`);
        console.log(`name: ${u.name}`);
        console.log(`email: ${u.email}`);
        console.log(`status: ${u.status}`);
        console.log(`createdBy: ${u.createdBy}`);
        console.log(`userId: ${u.userId}`);
        console.log(`city: ${u.city} | country: ${u.country} | region: ${u.region}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();

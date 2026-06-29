import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aega';

async function run() {
  await mongoose.connect(MONGO_URI);

  const creatorId = '69e0a0e4dc142342c14e5013';
  const user = await User.findById(creatorId).lean();
  console.log('Creator User:', JSON.stringify(user, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);

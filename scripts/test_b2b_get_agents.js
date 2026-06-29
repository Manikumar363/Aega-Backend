import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAgents } from '../src/controllers/agentController.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aega';

async function run() {
  await mongoose.connect(MONGO_URI);

  // Mock Request & Response
  const req = {
    user: {
      id: '69e0a0e4dc142342c14e5013',
      role: 'agent'
    }
  };

  const res = {
    json: function (data) {
      console.log('Controller JSON response:');
      console.log(JSON.stringify(data, null, 2));
    },
    status: function (code) {
      console.log('Status code set:', code);
      return this;
    }
  };

  await getAgents(req, res);

  await mongoose.disconnect();
}

run().catch(console.error);

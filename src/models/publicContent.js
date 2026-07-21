import mongoose from 'mongoose';

const PublicContentSchema = new mongoose.Schema({
  publicHero: {
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  whatAegaDoes: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    points: { type: [String], default: [] },
    title2: { type: String, default: '' },
    description2: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  clientReviews: [{
    image: { type: String, default: '' },
    clientName: { type: String, default: '' },
    description: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('PublicContent', PublicContentSchema);

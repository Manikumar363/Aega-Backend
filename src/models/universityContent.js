import mongoose from 'mongoose';

const UniversityContentSchema = new mongoose.Schema({
  universityHero: {
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  professionalGuidelines: {
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    points: { type: [String], default: [] }
  },
  servicesForPartners: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    points: [{
      numbering: { type: String, default: '' },
      title: { type: String, default: '' }
    }]
  },
  learningPath: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    points: [{
      numbering: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  ourImpact: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    points: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  clientReviews: [{
    image: { type: String, default: '' },
    clientName: { type: String, default: '' },
    description: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('UniversityContent', UniversityContentSchema);

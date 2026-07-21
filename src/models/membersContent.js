import mongoose from 'mongoose';

const MembersContentSchema = new mongoose.Schema({
  membersHero: {
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  professionalGuidelines: {
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] }
  },
  rangeOfServices: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    services: [{
      numbering: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      points: { type: [String], default: [] }
    }]
  },
  membershipBenefits: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    benefits: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  operationalFramework: {
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    points: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  preCasReady: {
    title: { type: String, default: '' },
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

export default mongoose.model('MembersContent', MembersContentSchema);

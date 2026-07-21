import mongoose from 'mongoose';

const AboutContentSchema = new mongoose.Schema({
  aboutUs: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    kpiValues: [{
      value: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  innerSection2: {
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    description2: { type: String, default: '' }
  },
  ourStory: {
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  ourMission: {
    image: { type: String, default: '' },
    points: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  ourVision: {
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  ourJourney: {
    image: { type: String, default: '' },
    timeline: [{
      year: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  globalImpact: {
    description: { type: String, default: '' },
    kpis: [{
      value: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  coreValues: [{
    numbering: { type: Number, default: 1 },
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  clientReviews: [{
    image: { type: String, default: '' },
    clientName: { type: String, default: '' },
    description: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('AboutContent', AboutContentSchema);

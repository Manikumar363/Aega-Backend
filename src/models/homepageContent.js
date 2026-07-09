import mongoose from 'mongoose';

const HomepageContentSchema = new mongoose.Schema({
  banner: {
    image: { type: String, default: '' },
    heading: { type: String, default: '' },
    description: { type: String, default: '' },
    redirectionUrl: { type: String, default: '' }
  },
  storyOfUs: {
    image: { type: String, default: '' },
    heading: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  whatWeDo: [{
    heading: { type: String, default: '' },
    description: { type: String, default: '' },
    numbering: { type: Number, default: 1 }
  }],
  whyAega: {
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    bottomTitles: { type: [String], default: ['', '', ''] }
  },
  ourCommitment: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    kpis: { type: [Number], default: [0, 0, 0, 0] },
    points: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      numbering: { type: Number, default: 1 }
    }]
  },
  ourImpact: {
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    points: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  },
  testimonials: [{
    review: { type: String, default: '' },
    image: { type: String, default: '' },
    userDetails: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('HomepageContent', HomepageContentSchema);

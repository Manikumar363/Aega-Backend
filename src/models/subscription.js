import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planName: { type: String, enum: ['Elements', 'Pro', 'Customised'], required: true },
  category: { type: String, enum: ['agent', 'educator'], default: 'agent' },
  educatorType: { type: String, enum: ['single_hei', 'pathway_college', 'branch_campus', 'multi_campus', null], default: null },
  officesCount: { type: Number, default: 1 },
  isStartup: { type: Boolean, default: false },
  hasIcefDiscount: { type: Boolean, default: false },
  amountPaidGbp: { type: Number, required: true },
  currency: { type: String, default: 'gbp' },
  billingCycle: { type: String, default: 'yearly' },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  stripePriceId: { type: String, default: null },
  status: { type: String, enum: ['active', 'canceled', 'past_due', 'unpaid', 'none'], default: 'none' },
  currentPeriodStart: { type: Date, default: null },
  currentPeriodEnd: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Subscription', subscriptionSchema);

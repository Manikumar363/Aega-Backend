import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import flywireService from '../services/flywireService.js';

const safeUnixToDate = (value) => {
  if (!value || typeof value !== 'number') return null;
  return new Date(value * 1000);
};

// Calculate exact yearly membership fee in GBP
export const calculateYearlyFeeGbp = ({
  planName,
  category = 'agent',
  officesCount = 1,
  pricingModel = 'overview', // 'overview' | 'detailed'
  isStartup = false,
  hasIcefDiscount = false,
  educatorType = 'single_hei'
}) => {
  if (planName === 'Customised') return 0; // POA

  let baseAmount = 0;
  const offices = Math.max(1, parseInt(officesCount, 10) || 1);

  if (category === 'educator') {
    if (educatorType === 'multi_campus') return 0; // POA
    if (planName === 'Elements') {
      if (educatorType === 'single_hei') baseAmount = 3000;
      else if (educatorType === 'pathway_college' || educatorType === 'branch_campus') baseAmount = 500;
    } else if (planName === 'Pro') {
      if (educatorType === 'single_hei') baseAmount = 6500;
      else if (educatorType === 'pathway_college' || educatorType === 'branch_campus') baseAmount = 1500;
    }
  } else {
    // Agent Category
    if (pricingModel === 'overview') {
      const rate = planName === 'Elements' ? 500 : 1200;
      baseAmount = rate * offices;
    } else {
      // Detailed Fee Schedule
      if (planName === 'Elements') {
        if (isStartup && offices === 1) {
          baseAmount = 300;
        } else {
          baseAmount = 1000; // 1st office
          if (offices >= 2) baseAmount += 400; // 2nd office
          if (offices >= 3) baseAmount += (offices - 2) * 300; // 3rd+ office
        }
      } else if (planName === 'Pro') {
        baseAmount = 2500; // 1st office
        if (offices >= 2) baseAmount += 950; // 2nd office
        if (offices >= 3) baseAmount += (offices - 2) * 750; // 3rd+ office
      }
    }
  }

  // ICEF 10% discount
  if (hasIcefDiscount) {
    baseAmount = Math.round(baseAmount * 0.9);
  }

  return baseAmount;
};

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const {
      planName,
      category = 'agent',
      pricingModel = 'overview',
      officesCount = 1,
      isStartup = false,
      hasIcefDiscount = false,
      educatorType = 'single_hei'
    } = req.body;

    if (!['Elements', 'Pro', 'Customised'].includes(planName)) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    if (planName === 'Customised') {
      return res.status(400).json({
        error: 'Customised plan requires Price on Application (POA). Please contact sales.'
      });
    }

    const amountGbp = calculateYearlyFeeGbp({
      planName,
      category,
      pricingModel,
      officesCount,
      isStartup,
      hasIcefDiscount,
      educatorType
    });

    if (amountGbp <= 0) {
      return res.status(400).json({ error: 'Invalid price calculated.' });
    }

    const frontendDomain = (process.env.FRONTEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    const successUrl = `${frontendDomain}/pricing?success=true&plan=${planName}`;
    const cancelUrl = `${frontendDomain}/pricing?canceled=true`;

    // Check if Flywire is configured
    if (!flywireService.isConfigured()) {
      // Mock activation mode for development/sandbox environment without live API credentials
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      let sub = await Subscription.findOne({ userId });
      if (sub) {
        sub.planName = planName;
        sub.category = category;
        sub.educatorType = educatorType;
        sub.officesCount = officesCount;
        sub.isStartup = isStartup;
        sub.hasIcefDiscount = hasIcefDiscount;
        sub.amountPaidGbp = amountGbp;
        sub.paymentProvider = 'mock';
        sub.status = 'active';
        sub.currentPeriodStart = new Date();
        sub.currentPeriodEnd = oneYearLater;
        sub.cancelAtPeriodEnd = false;
        sub.updatedAt = new Date();
        await sub.save();
      } else {
        sub = await Subscription.create({
          userId,
          planName,
          category,
          educatorType,
          officesCount,
          isStartup,
          hasIcefDiscount,
          amountPaidGbp: amountGbp,
          paymentProvider: 'mock',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearLater,
          cancelAtPeriodEnd: false
        });
      }

      user.hasActiveSubscription = true;
      user.subscription = sub._id;
      await user.save();

      return res.json({
        url: `${successUrl}&mock=true`,
        mock: true,
        message: 'Mock subscription activated successfully.'
      });
    }

    const session = await flywireService.createCheckoutSession({
      userId,
      userEmail: user.email,
      userName: user.name,
      planName,
      category,
      amountGbp,
      officesCount,
      isStartup,
      hasIcefDiscount,
      educatorType,
      successUrl,
      cancelUrl
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Flywire checkout error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    const subscription = await Subscription.findOne({ userId });

    return res.json({
      hasActiveSubscription: user?.hasActiveSubscription || subscription?.status === 'active',
      subscription: subscription || null
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    if (subscription.providerSubscriptionId) {
      await flywireService.cancelSubscription(subscription.providerSubscriptionId);
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.updatedAt = new Date();
    await subscription.save();

    return res.json({
      message: 'Subscription cancellation scheduled at end of period.',
      subscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to cancel subscription.' });
  }
};

export const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found.' });
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.updatedAt = new Date();
    await subscription.save();

    return res.json({
      message: 'Subscription reactivated successfully.',
      subscription
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to reactivate subscription.' });
  }
};

export const subscriptionWebhookHandler = async (req, res) => {
  const signature = req.headers['x-flywire-signature'] || req.headers['stripe-signature'];
  const isVerified = flywireService.verifyWebhookSignature(req.body, signature);

  if (!isVerified) {
    return res.status(400).send('Webhook signature verification failed.');
  }

  try {
    const body = req.body || {};
    const eventType = body.event || body.type || body.status;
    const payload = body.data || body.object || body;
    const metadata = payload.metadata || {};

    const userId = metadata.userId || payload.userId;
    const planName = metadata.planName || payload.planName;
    const amountGbp = Number(metadata.amountGbp || payload.amountGbp || payload.amount || 0);

    if (userId && planName) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      let sub = await Subscription.findOne({ userId });
      if (!sub) {
        sub = new Subscription({ userId });
      }

      sub.planName = planName;
      sub.category = metadata.category || 'agent';
      sub.officesCount = Number(metadata.officesCount || 1);
      sub.isStartup = metadata.isStartup === 'true';
      sub.hasIcefDiscount = metadata.hasIcefDiscount === 'true';
      sub.amountPaidGbp = amountGbp;
      sub.paymentProvider = 'flywire';
      sub.providerCustomerId = String(payload.payer?.id || payload.customer || '');
      sub.providerSubscriptionId = String(payload.id || payload.session_id || payload.subscription || '');
      sub.providerPaymentId = String(payload.payment_id || payload.transaction_id || '');

      // Legacy fallback mapping
      sub.stripeCustomerId = sub.providerCustomerId;
      sub.stripeSubscriptionId = sub.providerSubscriptionId;

      sub.status = 'active';
      sub.currentPeriodStart = new Date();
      sub.currentPeriodEnd = oneYearLater;
      sub.cancelAtPeriodEnd = false;
      sub.updatedAt = new Date();
      await sub.save();

      await User.findByIdAndUpdate(userId, {
        hasActiveSubscription: true,
        subscription: sub._id
      });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Error handling Flywire webhook event:', err);
    return res.status(500).send('Webhook handler error.');
  }
};

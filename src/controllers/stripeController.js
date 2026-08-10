import Stripe from 'stripe';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

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

const getOrCreateStripeCustomer = async (userId, email, name) => {
  if (!stripe) return null;
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length) return customers.data[0].id;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId: String(userId) },
  });

  return customer.id;
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

    // Check if Stripe is configured
    if (!stripe) {
      // Mock activation mode for development environment
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
        url: `${frontendDomain}/pricing?success=true&plan=${planName}&mock=true`,
        mock: true,
        message: 'Mock subscription activated successfully.'
      });
    }

    const customerId = await getOrCreateStripeCustomer(userId, user.email, user.name);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `AEGA ${planName} Plan (${category.toUpperCase()})`,
              description: `AEGA Yearly Membership (${officesCount} office${officesCount > 1 ? 's' : ''}${hasIcefDiscount ? ' - 10% ICEF Discount' : ''})`
            },
            unit_amount: amountGbp * 100, // in pence
            recurring: {
              interval: 'year'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: String(userId),
        planName,
        category,
        officesCount: String(officesCount),
        isStartup: String(isStartup),
        hasIcefDiscount: String(hasIcefDiscount),
        amountGbp: String(amountGbp)
      },
      subscription_data: {
        metadata: {
          userId: String(userId),
          planName,
          category
        }
      },
      success_url: `${frontendDomain}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendDomain}/pricing?canceled=true`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
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

    if (stripe && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
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

    if (stripe && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });
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

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret || !sig) {
    return res.status(400).send('Webhook secret or Stripe signature missing.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;
        const amountGbp = Number(session.metadata?.amountGbp || 0);

        if (userId && planName) {
          const stripeSubId = session.subscription;
          let subData = null;
          if (stripeSubId) {
            subData = await stripe.subscriptions.retrieve(stripeSubId);
          }

          const periodEnd = subData ? safeUnixToDate(subData.current_period_end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

          let sub = await Subscription.findOne({ userId });
          if (!sub) {
            sub = new Subscription({ userId });
          }

          sub.planName = planName;
          sub.category = session.metadata?.category || 'agent';
          sub.officesCount = Number(session.metadata?.officesCount || 1);
          sub.isStartup = session.metadata?.isStartup === 'true';
          sub.hasIcefDiscount = session.metadata?.hasIcefDiscount === 'true';
          sub.amountPaidGbp = amountGbp;
          sub.stripeCustomerId = String(session.customer || '');
          sub.stripeSubscriptionId = String(stripeSubId || '');
          sub.status = 'active';
          sub.currentPeriodStart = new Date();
          sub.currentPeriodEnd = periodEnd;
          sub.cancelAtPeriodEnd = false;
          sub.updatedAt = new Date();
          await sub.save();

          await User.findByIdAndUpdate(userId, {
            hasActiveSubscription: true,
            subscription: sub._id
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subObject = event.data.object;
        const userId = subObject.metadata?.userId;
        if (userId) {
          const status = subObject.status === 'active' ? 'active' : 'canceled';
          const periodEnd = safeUnixToDate(subObject.current_period_end);

          await Subscription.findOneAndUpdate(
            { userId },
            {
              status,
              currentPeriodEnd: periodEnd || new Date(),
              cancelAtPeriodEnd: subObject.cancel_at_period_end ?? false,
              updatedAt: new Date()
            }
          );

          await User.findByIdAndUpdate(userId, {
            hasActiveSubscription: status === 'active'
          });
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return res.status(500).send('Webhook handler error.');
  }
};

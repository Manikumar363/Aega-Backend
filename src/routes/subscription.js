import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  subscriptionWebhookHandler
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.post('/create-checkout-session', requireAuth, createCheckoutSession);
router.get('/subscription-status', requireAuth, getSubscriptionStatus);
router.post('/cancel-subscription', requireAuth, cancelSubscription);
router.post('/reactivate-subscription', requireAuth, reactivateSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionWebhookHandler);

export default router;

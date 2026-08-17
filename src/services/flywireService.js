import crypto from 'crypto';

class FlywireService {
  constructor() {
    this.apiKey = process.env.FLYWIRE_API_KEY || '';
    this.baseUrl = (process.env.FLYWIRE_BASE_URL || 'https://demo.flywire.com').replace(/\/$/, '');
    this.recipientId = process.env.FLYWIRE_RECIPIENT_ID || 'AEGA_SANDBOX';
    this.webhookSecret = process.env.FLYWIRE_WEBHOOK_SECRET || '';
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Create a Flywire checkout session for an annual subscription.
   */
  async createCheckoutSession({
    userId,
    userEmail,
    userName,
    planName,
    category,
    amountGbp,
    officesCount = 1,
    isStartup = false,
    hasIcefDiscount = false,
    educatorType = null,
    successUrl,
    cancelUrl
  }) {
    if (!this.isConfigured()) {
      return null;
    }

    const payload = {
      recipient_id: this.recipientId,
      amount: amountGbp,
      currency: 'GBP',
      payment_type: 'subscription',
      billing_cycle: 'yearly',
      callback_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/subscription/webhook`,
      return_url: successUrl,
      cancel_url: cancelUrl,
      payer: {
        email: userEmail,
        name: userName,
      },
      description: `AEGA ${planName} Plan (${category.toUpperCase()}) - ${officesCount} Office(s)`,
      metadata: {
        userId: String(userId),
        planName,
        category,
        officesCount: String(officesCount),
        isStartup: String(isStartup),
        hasIcefDiscount: String(hasIcefDiscount),
        educatorType: educatorType ? String(educatorType) : '',
        amountGbp: String(amountGbp)
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/checkout/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Flywire-Recipient-ID': this.recipientId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flywire API error response:', errorText);
        throw new Error(`Flywire Checkout creation failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        id: data.id || data.session_id,
        url: data.url || data.checkout_url,
        raw: data
      };
    } catch (error) {
      console.error('Error creating Flywire checkout session:', error);
      throw error;
    }
  }

  /**
   * Verify Flywire webhook HMAC SHA256 signature
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!this.webhookSecret || !signatureHeader) {
      return true; // Pass in sandbox mode if secret is not set
    }

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const computedSignature = hmac.update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signatureHeader));
    } catch (err) {
      console.error('Flywire HMAC signature verification failed:', err);
      return false;
    }
  }

  /**
   * Cancel subscription on Flywire if API is supported
   */
  async cancelSubscription(providerSubscriptionId) {
    if (!this.isConfigured() || !providerSubscriptionId) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/v1/${providerSubscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling Flywire subscription:', error);
      return false;
    }
  }
}

export default new FlywireService();

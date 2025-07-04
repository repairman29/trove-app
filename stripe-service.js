// Stripe Service for Trove Frontend
class StripeService {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.stripe = null;
    this.loadStripe();
  }

  async loadStripe() {
    try {
      // Load Stripe.js
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = Stripe('pk_live_51RFf9cQbygWjAax56RLOwXh5ZGjiOBRdEhQpb1eC7hQLUJMrZFiuTtmpb2bBTliR9qi6RB82dMPJHoywCSppvNw200YdeBHMHX');
        console.log('Stripe loaded successfully');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to load Stripe:', error);
    }
  }

  async createCheckoutSession(userId, plan) {
    try {
      const response = await fetch(`${this.apiBase}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      return sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async redirectToCheckout(sessionId) {
    if (!this.stripe) {
      throw new Error('Stripe not loaded');
    }

    const { error } = await this.stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    if (error) {
      throw error;
    }
  }

  async createPortalSession(customerId) {
    try {
      const response = await fetch(`${this.apiBase}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  async getSubscription(userId) {
    try {
      const response = await fetch(`${this.apiBase}/subscription/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription:', error);
      // Return default free plan if error
      return {
        plan: 'free',
        status: 'active',
        limits: {
          name: 'Free',
          collections: 3,
          templates: 0,
          items: 100
        }
      };
    }
  }

  async subscribeToPlan(userId, plan) {
    try {
      const sessionId = await this.createCheckoutSession(userId, plan);
      await this.redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  }

  async manageBilling(customerId) {
    try {
      const url = await this.createPortalSession(customerId);
      window.location.href = url;
    } catch (error) {
      console.error('Error managing billing:', error);
      throw error;
    }
  }

  // Helper method to check if user can perform action based on subscription
  canPerformAction(subscription, action, currentUsage = 0) {
    const limits = subscription.limits;
    
    switch (action) {
      case 'create_collection':
        return limits.collections === -1 || currentUsage < limits.collections;
      case 'create_template':
        return limits.templates === -1 || currentUsage < limits.templates;
      case 'add_item':
        return limits.items === -1 || currentUsage < limits.items;
      default:
        return true;
    }
  }

  // Helper method to get upgrade prompt message
  getUpgradeMessage(subscription, action) {
    const planName = subscription.plan === 'free' ? 'Pro' : 'Enterprise';
    
    switch (action) {
      case 'create_collection':
        return `Upgrade to ${planName} to create unlimited collections!`;
      case 'create_template':
        return `Upgrade to ${planName} to create custom templates!`;
      case 'add_item':
        return `Upgrade to ${planName} to add more items to your collections!`;
      default:
        return `Upgrade to ${planName} for more features!`;
    }
  }
}

// Initialize Stripe service
const stripeService = new StripeService();

// Export for use in other files
window.stripeService = stripeService; 
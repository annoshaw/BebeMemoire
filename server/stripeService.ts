// Stripe service for Memoria
// Handles direct Stripe API operations for payments and checkout

import { storage } from './storage';
import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    orderId: string;
    items: Array<{ name: string; unitAmount: number; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = await getUncachableStripeClient();
    
    return await stripe.checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      line_items: params.items.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.name,
          },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    orderId: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = await getUncachableStripeClient();
    
    return await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
    });
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async retrieveCheckoutSession(sessionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  }

  async getCustomer(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.retrieve(customerId);
  }
}

export const stripeService = new StripeService();

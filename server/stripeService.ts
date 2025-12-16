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

  // Create a Stripe coupon for discounts
  async createCoupon(params: {
    name: string;
    type: 'percentage' | 'fixed';
    value: number; // percentage (0-100) or amount in cents
    code?: string;
    maxRedemptions?: number;
    expiresAt?: Date;
  }) {
    const stripe = await getUncachableStripeClient();
    
    const couponParams: any = {
      name: params.name,
      currency: 'cad',
    };

    if (params.type === 'percentage') {
      couponParams.percent_off = params.value;
    } else {
      couponParams.amount_off = params.value;
    }

    if (params.maxRedemptions) {
      couponParams.max_redemptions = params.maxRedemptions;
    }

    if (params.expiresAt) {
      couponParams.redeem_by = Math.floor(params.expiresAt.getTime() / 1000);
    }

    const coupon = await stripe.coupons.create(couponParams);

    // If a code is provided, create a promotion code for it
    if (params.code) {
      await (stripe.promotionCodes as any).create({
        coupon: coupon.id,
        code: params.code,
      });
    }

    return coupon;
  }

  // Delete a Stripe coupon
  async deleteCoupon(couponId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.coupons.del(couponId);
  }

  // Create checkout session with discount
  async createCheckoutSessionWithDiscount(params: {
    customerId: string;
    orderId: string;
    items: Array<{ name: string; unitAmount: number; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    discounts?: Array<{ coupon: string }>;
  }) {
    const stripe = await getUncachableStripeClient();
    
    const sessionParams: any = {
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
    };

    // Apply discounts if provided
    if (params.discounts && params.discounts.length > 0) {
      sessionParams.discounts = params.discounts;
    }

    return await stripe.checkout.sessions.create(sessionParams);
  }
}

export const stripeService = new StripeService();

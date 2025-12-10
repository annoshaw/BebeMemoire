// Stripe webhook handlers for Memoria
// Handles webhook processing via stripe-replit-sync + custom order updates

import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // First, let stripe-replit-sync process and sync the data
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    // Then handle our custom business logic
    await this.handleCustomLogic(payload, signature);
  }

  private static async handleCustomLogic(payload: Buffer, signature: string): Promise<void> {
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      // If no webhook secret, we can't verify - just parse the event
      let event;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } else {
        // Parse without verification (dev mode)
        event = JSON.parse(payload.toString());
      }

      console.log(`Processing custom logic for ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
      }
    } catch (error) {
      console.error('Error in custom webhook logic:', error);
      // Don't throw - the sync already processed, this is additional logic
    }
  }

  private static async handleCheckoutCompleted(session: any): Promise<void> {
    const sessionId = session.id;
    console.log(`Checkout completed for session: ${sessionId}`);

    // Find order by stripe session ID
    const orders = await storage.getOrdersByStripeSessionId(sessionId);
    
    if (orders.length === 0) {
      console.log(`No order found for session ${sessionId}`);
      return;
    }

    const order = orders[0];
    console.log(`Updating order ${order.orderNumber} to paid status`);

    // Update order status
    await storage.updateOrder(order.id, {
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent,
    });

    // Log the event
    await storage.createOrderEvent({
      orderId: order.id,
      eventType: 'payment_completed',
      previousStatus: order.status,
      newStatus: 'paid',
      metadata: { 
        stripeSessionId: sessionId,
        paymentIntentId: session.payment_intent,
      },
    });

    // Create payment record
    await storage.createPayment({
      userId: order.userId,
      orderId: order.id,
      stripePaymentIntentId: session.payment_intent,
      amount: session.amount_total,
      currency: session.currency?.toUpperCase() || 'CAD',
      paymentType: 'order',
      status: 'succeeded',
    });

    console.log(`Order ${order.orderNumber} marked as paid`);
  }

  private static async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Additional logic if needed
  }

  private static async handlePaymentFailed(paymentIntent: any): Promise<void> {
    console.log(`Payment failed: ${paymentIntent.id}`);
    
    // Find order by payment intent and update status
    const orders = await storage.getOrdersByPaymentIntentId(paymentIntent.id);
    
    if (orders.length > 0) {
      const order = orders[0];
      await storage.updateOrder(order.id, {
        paymentStatus: 'failed',
      });

      await storage.createOrderEvent({
        orderId: order.id,
        eventType: 'payment_failed',
        newStatus: order.status,
        metadata: { 
          paymentIntentId: paymentIntent.id,
          failureMessage: paymentIntent.last_payment_error?.message,
        },
      });
    }
  }
}

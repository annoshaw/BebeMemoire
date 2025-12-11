// Job to handle pending orders and subscription reminders
import { storage } from './storage';
import { sendOrderCancellationEmail, sendSubscriptionReminderEmail } from './emailService';

const EXPIRATION_DAYS = 14;

export async function processPendingOrders(): Promise<void> {
  console.log('[OrderCleanup] Starting pending orders processing...');
  
  try {
    // Get all pending_payment orders
    const pendingOrders = await storage.getOrdersByStatus('pending_payment');
    console.log(`[OrderCleanup] Found ${pendingOrders.length} pending orders`);
    
    const now = new Date();
    
    for (const order of pendingOrders) {
      const orderAge = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      
      // Only process orders that are 14+ days old
      if (orderAge < EXPIRATION_DAYS) {
        console.log(`[OrderCleanup] Order ${order.orderNumber}: ${orderAge} days old, not yet expired`);
        continue;
      }
      
      console.log(`[OrderCleanup] Cancelling order ${order.orderNumber} (${orderAge} days old)`);
      
      // Check if payment actually failed (not just abandoned)
      const paymentFailed = order.paymentStatus === 'failed';
      
      // Get user info for email (only if payment failed)
      const user = paymentFailed ? await storage.getUser(order.userId) : null;
      
      // Get book info for email
      const book = order.bookId ? await storage.getBook(order.bookId) : null;
      const bookName = book?.childName || 'Votre livre Memoria';
      
      // Cancel the order
      await storage.updateOrder(order.id, { 
        status: 'cancelled',
        adminNotes: paymentFailed 
          ? `Auto-cancelled after ${EXPIRATION_DAYS} days - payment failed`
          : `Auto-cancelled after ${EXPIRATION_DAYS} days - abandoned checkout`
      });
      
      // Log the event
      await storage.createOrderEvent({
        orderId: order.id,
        eventType: 'status_changed',
        previousStatus: 'pending_payment',
        newStatus: 'cancelled',
        description: `Commande auto-annulée après ${EXPIRATION_DAYS} jours sans paiement`,
        metadata: { reason: paymentFailed ? 'payment_failed' : 'abandoned', daysOld: orderAge }
      });
      
      // Send cancellation email ONLY if payment actually failed
      if (paymentFailed && user?.email) {
        console.log(`[OrderCleanup] Sending cancellation email for failed payment: ${order.orderNumber}`);
        await sendOrderCancellationEmail({
          customerEmail: user.email,
          customerName: user.fullName || user.firstName || '',
          orderNumber: order.orderNumber,
          bookName
        });
      } else {
        console.log(`[OrderCleanup] No email sent - order was abandoned (not failed payment)`);
      }
    }
    
    console.log('[OrderCleanup] Finished processing pending orders');
  } catch (error) {
    console.error('[OrderCleanup] Error processing pending orders:', error);
  }
}

export async function processSubscriptionReminders(): Promise<void> {
  console.log('[SubscriptionReminder] Starting subscription reminders processing...');
  
  try {
    // Get users who registered 14+ days ago and haven't received a reminder
    const usersNeedingReminder = await storage.getUsersNeedingSubscriptionReminder();
    console.log(`[SubscriptionReminder] Found ${usersNeedingReminder.length} users needing reminder`);
    
    for (const user of usersNeedingReminder) {
      if (!user.email) {
        console.log(`[SubscriptionReminder] No email for user ${user.id}, skipping`);
        continue;
      }
      
      // Check if user already has a paid subscription
      const userPlan = await storage.getUserPlan(user.id);
      if (userPlan && userPlan.plan !== 'free') {
        // User already has a paid plan, mark as reminded and skip
        await storage.updateUserSubscriptionReminder(user.id);
        console.log(`[SubscriptionReminder] User ${user.id} already has ${userPlan.plan} plan, skipping`);
        continue;
      }
      
      console.log(`[SubscriptionReminder] Sending subscription reminder to ${user.email}`);
      
      const emailSent = await sendSubscriptionReminderEmail({
        customerEmail: user.email,
        customerName: user.fullName || user.firstName || ''
      });
      
      if (emailSent) {
        await storage.updateUserSubscriptionReminder(user.id);
      }
    }
    
    console.log('[SubscriptionReminder] Finished processing subscription reminders');
  } catch (error) {
    console.error('[SubscriptionReminder] Error processing subscription reminders:', error);
  }
}

// Run job every hour
let jobInterval: NodeJS.Timeout | null = null;

export function startOrderCleanupJob(): void {
  console.log('[OrderCleanup] Starting order cleanup job (runs every hour)');
  
  // Run immediately on start
  processPendingOrders();
  processSubscriptionReminders();
  
  // Then run every hour
  jobInterval = setInterval(() => {
    processPendingOrders();
    processSubscriptionReminders();
  }, 60 * 60 * 1000); // 1 hour
}

export function stopOrderCleanupJob(): void {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[OrderCleanup] Order cleanup job stopped');
  }
}

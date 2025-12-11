// Job to handle pending orders: send reminders and auto-cancel after 14 days
import { storage } from './storage';
import { sendPaymentReminderEmail, sendOrderCancellationEmail } from './emailService';

const REMINDER_DAYS = [7, 11, 13]; // Send reminders at day 7, 11, and 13
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
      const daysRemaining = EXPIRATION_DAYS - orderAge;
      
      console.log(`[OrderCleanup] Order ${order.orderNumber}: ${orderAge} days old, ${daysRemaining} days remaining`);
      
      // Get user info for email
      const user = await storage.getUser(order.userId);
      if (!user || !user.email) {
        console.log(`[OrderCleanup] No email for user ${order.userId}, skipping order ${order.orderNumber}`);
        continue;
      }
      
      // Get book info for email
      const book = order.bookId ? await storage.getBook(order.bookId) : null;
      const bookName = book?.childName || 'Votre livre Memoria';
      
      // Check if order should be cancelled (14+ days old)
      if (orderAge >= EXPIRATION_DAYS) {
        console.log(`[OrderCleanup] Cancelling order ${order.orderNumber} (${orderAge} days old)`);
        
        // Cancel the order
        await storage.updateOrder(order.id, { 
          status: 'cancelled',
          adminNotes: `Auto-cancelled after ${EXPIRATION_DAYS} days without payment`
        });
        
        // Log the event
        await storage.createOrderEvent({
          orderId: order.id,
          eventType: 'status_changed',
          previousStatus: 'pending_payment',
          newStatus: 'cancelled',
          description: `Commande auto-annulée après ${EXPIRATION_DAYS} jours sans paiement`,
          metadata: { reason: 'auto_expiration', daysOld: orderAge }
        });
        
        // Send cancellation email
        await sendOrderCancellationEmail({
          customerEmail: user.email,
          customerName: user.fullName || user.firstName || '',
          orderNumber: order.orderNumber,
          bookName
        });
        
        continue;
      }
      
      // Check if we should send a reminder
      const reminderCount = order.reminderCount || 0;
      const shouldSendReminder = REMINDER_DAYS.some((day, index) => 
        orderAge >= day && reminderCount <= index
      );
      
      if (shouldSendReminder) {
        console.log(`[OrderCleanup] Sending reminder #${reminderCount + 1} for order ${order.orderNumber}`);
        
        const emailSent = await sendPaymentReminderEmail({
          customerEmail: user.email,
          customerName: user.fullName || user.firstName || '',
          orderNumber: order.orderNumber,
          bookName,
          totalAmount: order.totalAmount,
          daysRemaining
        });
        
        if (emailSent) {
          await storage.updateOrder(order.id, {
            reminderSentAt: new Date(),
            reminderCount: reminderCount + 1
          });
          
          await storage.createOrderEvent({
            orderId: order.id,
            eventType: 'reminder_sent',
            description: `Rappel de paiement #${reminderCount + 1} envoyé`,
            metadata: { reminderNumber: reminderCount + 1, daysRemaining }
          });
        }
      }
    }
    
    console.log('[OrderCleanup] Finished processing pending orders');
  } catch (error) {
    console.error('[OrderCleanup] Error processing pending orders:', error);
  }
}

// Run job every hour
let jobInterval: NodeJS.Timeout | null = null;

export function startOrderCleanupJob(): void {
  console.log('[OrderCleanup] Starting order cleanup job (runs every hour)');
  
  // Run immediately on start
  processPendingOrders();
  
  // Then run every hour
  jobInterval = setInterval(() => {
    processPendingOrders();
  }, 60 * 60 * 1000); // 1 hour
}

export function stopOrderCleanupJob(): void {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[OrderCleanup] Order cleanup job stopped');
  }
}

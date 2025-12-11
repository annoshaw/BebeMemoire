// Job to handle pending orders: auto-cancel after 14 days (email only on cancellation)
import { storage } from './storage';
import { sendOrderCancellationEmail } from './emailService';

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
      
      // Get user info for email
      const user = await storage.getUser(order.userId);
      
      // Get book info for email
      const book = order.bookId ? await storage.getBook(order.bookId) : null;
      const bookName = book?.childName || 'Votre livre Memoria';
      
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
      
      // Send cancellation email (only email sent)
      if (user?.email) {
        await sendOrderCancellationEmail({
          customerEmail: user.email,
          customerName: user.fullName || user.firstName || '',
          orderNumber: order.orderNumber,
          bookName
        });
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

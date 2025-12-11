// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

interface OrderReminderData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  bookName: string;
  totalAmount: number;
  checkoutUrl?: string;
  daysRemaining: number;
}

export async function sendPaymentReminderEmail(data: OrderReminderData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const subject = data.daysRemaining <= 3 
      ? `⚠️ Dernier rappel: Votre commande ${data.orderNumber} expire bientôt`
      : `Rappel: Finalisez votre commande Memoria ${data.orderNumber}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c9a7a 0%, #5a7d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Votre album de souvenirs</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>Votre commande pour le livre de souvenirs <strong>"${data.bookName}"</strong> est toujours en attente de paiement.</p>
      
      <div class="order-box">
        <p><strong>Numéro de commande:</strong> ${data.orderNumber}</p>
        <p><strong>Total:</strong> ${(data.totalAmount / 100).toFixed(2)}$ CAD</p>
      </div>
      
      ${data.daysRemaining <= 3 ? `
      <div class="warning">
        <strong>⚠️ Attention:</strong> Il vous reste seulement <strong>${data.daysRemaining} jour(s)</strong> pour finaliser votre commande. 
        Passé ce délai, elle sera automatiquement annulée.
      </div>
      ` : `
      <p>Il vous reste <strong>${data.daysRemaining} jours</strong> pour finaliser votre paiement.</p>
      `}
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.checkoutUrl || 'https://memoria.replit.app/app'}" class="btn">
          Finaliser ma commande
        </a>
      </p>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
      <p>Vous recevez cet email car vous avez une commande en cours sur Memoria.</p>
    </div>
  </div>
</body>
</html>
    `;

    await client.emails.send({
      from: fromEmail || 'Memoria <noreply@memoria.app>',
      to: data.customerEmail,
      subject,
      html,
    });

    console.log(`Payment reminder sent to ${data.customerEmail} for order ${data.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment reminder email:', error);
    return false;
  }
}

interface OrderCancellationData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  bookName: string;
}

export async function sendOrderCancellationEmail(data: OrderCancellationData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c9a7a 0%, #5a7d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Votre album de souvenirs</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>Nous vous informons que votre commande a été annulée car le paiement n'a pas été finalisé dans le délai de 14 jours.</p>
      
      <div class="order-box">
        <p><strong>Numéro de commande:</strong> ${data.orderNumber}</p>
        <p><strong>Livre:</strong> ${data.bookName}</p>
        <p><strong>Statut:</strong> Annulée</p>
      </div>
      
      <p>Votre livre de souvenirs est toujours disponible dans votre compte. Vous pouvez passer une nouvelle commande à tout moment.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Retourner à mon album
        </a>
      </p>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    await client.emails.send({
      from: fromEmail || 'Memoria <noreply@memoria.app>',
      to: data.customerEmail,
      subject: `Commande ${data.orderNumber} annulée`,
      html,
    });

    console.log(`Order cancellation email sent to ${data.customerEmail} for order ${data.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send order cancellation email:', error);
    return false;
  }
}

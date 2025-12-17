// Email service using MailerSend
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || 'noreply@test-86org8ey200gew13.mlsender.net';
const FROM_NAME = 'Memoria';

let mailerSendClient: MailerSend | null = null;

function getMailerSendClient(): MailerSend {
  if (!mailerSendClient) {
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      throw new Error('MAILERSEND_API_KEY environment variable is not set');
    }
    mailerSendClient = new MailerSend({ apiKey });
  }
  return mailerSendClient;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    const client = getMailerSendClient();
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    await client.email.send(emailParams);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

interface PasswordResetData {
  email: string;
  fullName: string | null;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
  try {
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
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Réinitialisation de mot de passe</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.fullName || 'cher parent'},</h2>
      
      <p>Vous avez demandé à réinitialiser votre mot de passe Memoria.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="btn">
          Réinitialiser mon mot de passe
        </a>
      </p>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      </div>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.email,
      subject: 'Réinitialisation de votre mot de passe Memoria',
      html,
    });

    if (success) {
      console.log(`Password reset email sent to ${data.email}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
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

    const success = await sendEmail({
      to: data.customerEmail,
      subject,
      html,
    });

    if (success) {
      console.log(`Payment reminder sent to ${data.customerEmail} for order ${data.orderNumber}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send payment reminder email:', error);
    return false;
  }
}

interface SubscriptionReminderData {
  customerEmail: string;
  customerName: string;
}

export async function sendSubscriptionReminderEmail(data: SubscriptionReminderData): Promise<boolean> {
  try {
    
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
    .info-box { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .plan-comparison { margin: 20px 0; }
    .plan { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0; }
    .plan-free { border-left: 4px solid #9ca3af; }
    .plan-premium { border-left: 4px solid #7c9a7a; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .highlight { color: #7c9a7a; font-weight: bold; }
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
      
      <p>Cela fait maintenant 14 jours que vous avez créé votre compte Memoria ! 🎉</p>
      
      <p>Nous voulions vous rappeler que si vous ne choisissez pas d'abonnement, <strong>l'abonnement gratuit sera automatiquement attribué</strong> à votre compte.</p>
      
      <div class="info-box">
        <h3>⚠️ Important à savoir sur l'abonnement gratuit :</h3>
        <ul>
          <li><strong>Les vidéos ne sont pas incluses</strong> dans l'abonnement gratuit</li>
          <li>Stockage limité à 1 Go pour les photos</li>
          <li>Pas de codes QR pour les vidéos dans le livre imprimé</li>
        </ul>
      </div>
      
      <div class="plan-comparison">
        <div class="plan plan-free">
          <strong>Gratuit</strong>
          <ul>
            <li>1 Go de stockage photos</li>
            <li>❌ Pas de vidéos</li>
          </ul>
        </div>
        <div class="plan plan-premium">
          <strong class="highlight">Premium</strong>
          <ul>
            <li>Photos illimitées</li>
            <li>✅ 2 Go de vidéos inclus</li>
            <li>Codes QR pour vos vidéos</li>
          </ul>
        </div>
      </div>
      
      <p>Pour ajouter des vidéos à votre livre de souvenirs, pensez à passer à un abonnement Premium ou Platine.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Voir les abonnements
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

    const success = await sendEmail({
      to: data.customerEmail,
      subject: 'Rappel: Choisissez votre abonnement Memoria',
      html,
    });

    if (success) {
      console.log(`Subscription reminder sent to ${data.customerEmail}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send subscription reminder email:', error);
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

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `Commande ${data.orderNumber} annulée`,
      html,
    });

    if (success) {
      console.log(`Order cancellation email sent to ${data.customerEmail} for order ${data.orderNumber}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send order cancellation email:', error);
    return false;
  }
}

// Send PDF delivery email to customer
interface PdfDeliveryData {
  customerEmail: string;
  customerName: string;
  bookName: string;
  orderNumber: string;
  downloadUrl: string;
  expiresInDays: number;
}

export async function sendPdfDeliveryEmail(data: PdfDeliveryData): Promise<boolean> {
  try {
    
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
    .highlight { background: #e8f5e9; border-left: 4px solid #7c9a7a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Votre livre de souvenirs est prêt!</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>🎉 Bonne nouvelle! Votre livre de souvenirs <strong>"${data.bookName}"</strong> est maintenant prêt à être téléchargé.</p>
      
      <div class="order-box">
        <p><strong>📚 Livre:</strong> ${data.bookName}</p>
        <p><strong>🔢 Commande:</strong> ${data.orderNumber}</p>
        <p><strong>📄 Format:</strong> PDF numérique</p>
      </div>
      
      <div class="highlight">
        <strong>⏰ Important:</strong> Ce lien de téléchargement expire dans ${data.expiresInDays} jours. Assurez-vous de télécharger votre livre avant cette date.
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.downloadUrl}" class="btn">
          📥 Télécharger mon livre PDF
        </a>
      </p>
      
      <p>Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à nous contacter.</p>
      
      <p>Merci d'avoir choisi Memoria pour préserver vos précieux souvenirs!</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `📖 Votre livre "${data.bookName}" est prêt à télécharger!`,
      html,
    });

    if (success) {
      console.log(`PDF delivery email sent to ${data.customerEmail} for book ${data.bookName}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send PDF delivery email:', error);
    return false;
  }
}

// Send subscription confirmation email
interface SubscriptionConfirmationData {
  customerEmail: string;
  customerName: string;
  planName: string; // free, premium, platine
  planPrice: number; // in cents
  features: string[];
}

const planDisplayNames: Record<string, string> = {
  free: "De base (Gratuit)",
  premium: "Premium",
  platine: "Platine",
};

export async function sendSubscriptionConfirmationEmail(data: SubscriptionConfirmationData): Promise<boolean> {
  try {
    
    const planDisplayName = planDisplayNames[data.planName] || data.planName;
    const priceDisplay = data.planPrice > 0 ? `${(data.planPrice / 100).toFixed(2)}$/mois` : "Gratuit";
    
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
    .plan-box { background: white; border: 2px solid #7c9a7a; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
    .plan-name { font-size: 24px; font-weight: bold; color: #7c9a7a; margin-bottom: 10px; }
    .plan-price { font-size: 18px; color: #666; margin-bottom: 15px; }
    .features { text-align: left; padding: 0; list-style: none; }
    .features li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .features li:last-child { border-bottom: none; }
    .features li::before { content: "✓ "; color: #7c9a7a; font-weight: bold; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Bienvenue dans votre abonnement!</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>🎉 Félicitations! Votre abonnement <strong>${planDisplayName}</strong> a été activé avec succès.</p>
      
      <div class="plan-box">
        <div class="plan-name">${planDisplayName}</div>
        <div class="plan-price">${priceDisplay}</div>
        ${data.features.length > 0 ? `
        <ul class="features">
          ${data.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
      
      <p>Vous pouvez maintenant profiter de toutes les fonctionnalités incluses dans votre abonnement.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Accéder à mon compte
        </a>
      </p>
      
      <p>Merci de faire confiance à Memoria pour accompagner votre famille!</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `Votre abonnement ${planDisplayName} est confirmé!`,
      html,
    });

    if (success) {
      console.log(`Subscription confirmation email sent to ${data.customerEmail} for plan ${data.planName}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error);
    return false;
  }
}

// Send plan change confirmation email
interface PlanChangeData {
  customerEmail: string;
  customerName: string;
  previousPlan: string;
  newPlan: string;
  newPrice: number; // in cents
  effectiveDate?: Date;
}

export async function sendPlanChangeEmail(data: PlanChangeData): Promise<boolean> {
  try {
    
    const previousPlanName = planDisplayNames[data.previousPlan] || data.previousPlan;
    const newPlanName = planDisplayNames[data.newPlan] || data.newPlan;
    const priceDisplay = data.newPrice > 0 ? `${(data.newPrice / 100).toFixed(2)}$/mois` : "Gratuit";
    const dateDisplay = data.effectiveDate 
      ? data.effectiveDate.toLocaleDateString('fr-CA')
      : new Date().toLocaleDateString('fr-CA');
    
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
    .change-box { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .plan-change { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .plan-item { text-align: center; padding: 15px; }
    .plan-item.old { color: #999; }
    .plan-item.new { color: #7c9a7a; font-weight: bold; }
    .arrow { font-size: 24px; color: #7c9a7a; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #e8f5e9; border-left: 4px solid #7c9a7a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Changement d'abonnement</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>Votre changement d'abonnement a été effectué avec succès.</p>
      
      <div class="change-box">
        <div class="plan-change">
          <div class="plan-item old">
            <div style="font-size: 12px; text-transform: uppercase;">Ancien plan</div>
            <div style="font-size: 18px;">${previousPlanName}</div>
          </div>
          <div class="arrow">→</div>
          <div class="plan-item new">
            <div style="font-size: 12px; text-transform: uppercase;">Nouveau plan</div>
            <div style="font-size: 18px;">${newPlanName}</div>
            <div style="font-size: 14px;">${priceDisplay}</div>
          </div>
        </div>
      </div>
      
      <div class="info">
        <strong>📅 Date d'effet:</strong> ${dateDisplay}
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Accéder à mon compte
        </a>
      </p>
      
      <p>Si vous avez des questions concernant ce changement, n'hésitez pas à nous contacter.</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `Votre abonnement a été modifié: ${newPlanName}`,
      html,
    });

    if (success) {
      console.log(`Plan change email sent to ${data.customerEmail}: ${data.previousPlan} → ${data.newPlan}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send plan change email:', error);
    return false;
  }
}

// Send price adjustment notification email
interface PriceAdjustmentData {
  customerEmail: string;
  customerName: string;
  planName: string;
  oldPrice: number; // in cents
  newPrice: number; // in cents
  effectiveDate: Date;
  reason?: string;
}

export async function sendPriceAdjustmentEmail(data: PriceAdjustmentData): Promise<boolean> {
  try {
    
    const planDisplayName = planDisplayNames[data.planName] || data.planName;
    const oldPriceDisplay = `${(data.oldPrice / 100).toFixed(2)}$/mois`;
    const newPriceDisplay = `${(data.newPrice / 100).toFixed(2)}$/mois`;
    const dateDisplay = data.effectiveDate.toLocaleDateString('fr-CA');
    const isIncrease = data.newPrice > data.oldPrice;
    
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
    .price-box { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
    .price-change { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .price-item { padding: 15px; }
    .price-item.old { color: #999; text-decoration: line-through; }
    .price-item.new { color: ${isIncrease ? '#e53935' : '#43a047'}; font-weight: bold; font-size: 24px; }
    .arrow { font-size: 24px; color: #666; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Ajustement de prix</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>Nous vous informons d'un ajustement de prix pour votre abonnement <strong>${planDisplayName}</strong>.</p>
      
      <div class="price-box">
        <div class="price-change">
          <div class="price-item old">
            <div style="font-size: 12px; text-transform: uppercase;">Ancien prix</div>
            <div style="font-size: 18px;">${oldPriceDisplay}</div>
          </div>
          <div class="arrow">→</div>
          <div class="price-item new">
            <div style="font-size: 12px; text-transform: uppercase;">Nouveau prix</div>
            <div>${newPriceDisplay}</div>
          </div>
        </div>
      </div>
      
      <div class="info">
        <strong>📅 Date d'effet:</strong> ${dateDisplay}
        ${data.reason ? `<br><strong>Raison:</strong> ${data.reason}` : ''}
      </div>
      
      <p>Ce changement sera appliqué automatiquement à votre prochain cycle de facturation.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app/settings" class="btn">
          Gérer mon abonnement
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

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `Ajustement de prix pour votre abonnement ${planDisplayName}`,
      html,
    });

    if (success) {
      console.log(`Price adjustment email sent to ${data.customerEmail} for plan ${data.planName}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send price adjustment email:', error);
    return false;
  }
}

// Send discount applied notification email
interface DiscountAppliedData {
  customerEmail: string;
  customerName: string;
  discountName: string;
  discountValue: string; // e.g., "20%" or "5.00$"
  durationMonths?: number; // 0 = forever, or number of months
}

export async function sendDiscountAppliedEmail(data: DiscountAppliedData): Promise<boolean> {
  try {
    
    const durationText = !data.durationMonths || data.durationMonths === 0 
      ? "indéfiniment" 
      : `pendant ${data.durationMonths} mois`;
    
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
    .discount-box { background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: white; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
    .discount-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .discount-name { font-size: 18px; opacity: 0.9; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #e8f5e9; border-left: 4px solid #7c9a7a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Memoria</h1>
      <p>Vous avez reçu un rabais!</p>
    </div>
    <div class="content">
      <h2>Bonjour ${data.customerName || 'cher parent'},</h2>
      
      <p>🎉 Bonne nouvelle! Un rabais a été appliqué à votre compte.</p>
      
      <div class="discount-box">
        <div class="discount-name">${data.discountName}</div>
        <div class="discount-value">-${data.discountValue}</div>
      </div>
      
      <div class="info">
        <strong>⏱️ Durée:</strong> Ce rabais s'applique ${durationText} sur vos prochaines factures.
      </div>
      
      <p>Le rabais sera automatiquement appliqué lors de votre prochaine facturation.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Accéder à mon compte
        </a>
      </p>
      
      <p>Merci de votre fidélité!</p>
      
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.customerEmail,
      subject: `🎉 Rabais appliqué: ${data.discountName}`,
      html,
    });

    if (success) {
      console.log(`Discount applied email sent to ${data.customerEmail} for discount ${data.discountName}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send discount applied email:', error);
    return false;
  }
}

// Send bulk campaign email
interface CampaignRecipient {
  email: string;
  fullName: string | null;
}

interface CampaignEmailData {
  subject: string;
  bodyHtml: string;
  recipients: CampaignRecipient[];
}

export async function sendCampaignEmails(data: CampaignEmailData): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };
  
  try {
    
    const emailTemplate = (recipientName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c9a7a 0%, #5a7d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
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
      <h2>Bonjour ${recipientName || 'cher parent'},</h2>
      ${data.bodyHtml}
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://memoria.replit.app/app" class="btn">
          Visitez Memoria
        </a>
      </p>
      <p>L'équipe Memoria</p>
    </div>
    <div class="footer">
      <p>Memoria - Créez des souvenirs qui durent toute une vie</p>
      <p style="font-size: 11px; color: #999;">Pour vous désabonner, contactez-nous à support@memoria.app</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send emails in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < data.recipients.length; i += batchSize) {
      const batch = data.recipients.slice(i, i + batchSize);
      
      const sendPromises = batch.map(async (recipient) => {
        try {
          const success = await sendEmail({
            to: recipient.email,
            subject: data.subject,
            html: emailTemplate(recipient.fullName || ''),
          });
          if (success) {
            results.sent++;
          } else {
            results.failed++;
          }
          return success;
        } catch (error) {
          console.error(`Failed to send campaign email to ${recipient.email}:`, error);
          results.failed++;
          return false;
        }
      });

      await Promise.all(sendPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < data.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Campaign emails sent: ${results.sent} success, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error('Failed to send campaign emails:', error);
    return results;
  }
}

// Send book invitation email
interface BookInvitationData {
  recipientEmail: string;
  inviterName: string;
  bookName: string;
  role: 'collaborator' | 'observer';
  inviteUrl: string;
}

export async function sendBookInvitationEmail(data: BookInvitationData): Promise<boolean> {
  try {
    const roleDescriptionFr = data.role === 'collaborator' 
      ? "Vous pourrez <strong>modifier le livre</strong> et <strong>commander des exemplaires</strong>."
      : "Vous pourrez <strong>consulter le livre</strong> en mode lecture seule.";
    
    const roleLabel = data.role === 'collaborator' ? "Collaborateur" : "Observateur";
    const roleIcon = data.role === 'collaborator' ? "🔧" : "👁️";
    
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
    .invite-box { background: white; border: 2px solid #7c9a7a; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
    .book-name { font-size: 22px; font-weight: bold; color: #7c9a7a; margin-bottom: 10px; }
    .role-badge { display: inline-block; background: ${data.role === 'collaborator' ? '#e8f5e9' : '#e3f2fd'}; color: ${data.role === 'collaborator' ? '#2e7d32' : '#1565c0'}; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
    .btn { display: inline-block; background: #7c9a7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Mémo</h1>
      <p>Vous êtes invité(e) à collaborer!</p>
    </div>
    <div class="content">
      <h2>Bonjour!</h2>
      
      <p><strong>${data.inviterName}</strong> vous invite à accéder à son livre de naissance sur Mémo.</p>
      
      <div class="invite-box">
        <div class="book-name">📚 ${data.bookName}</div>
        <div class="role-badge">${roleIcon} ${roleLabel}</div>
        <p style="color: #666; font-size: 14px; margin-top: 15px;">${roleDescriptionFr}</p>
      </div>
      
      ${data.role === 'collaborator' ? `
      <div class="info">
        <strong>💡 En tant que collaborateur:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Vous pouvez ajouter et modifier des photos et textes</li>
          <li>Vous pouvez commander votre propre exemplaire imprimé</li>
          <li>Vous devrez entrer vos informations personnelles pour les commandes</li>
        </ul>
      </div>
      ` : `
      <div class="info">
        <strong>👁️ En tant qu'observateur:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Vous pouvez consulter toutes les pages du livre</li>
          <li>Vous ne pouvez pas modifier le contenu</li>
          <li>Vous ne pouvez pas passer de commandes</li>
        </ul>
      </div>
      `}
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.inviteUrl}" class="btn">
          Accepter l'invitation
        </a>
      </p>
      
      <p style="font-size: 14px; color: #666;">Si vous n'avez pas encore de compte Mémo, vous pourrez en créer un lors de l'acceptation de l'invitation.</p>
      
      <p>L'équipe Mémo</p>
    </div>
    <div class="footer">
      <p>Mémo - Créez des souvenirs qui durent toute une vie</p>
      <p style="font-size: 11px; color: #999;">Cette invitation expire dans 7 jours.</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await sendEmail({
      to: data.recipientEmail,
      subject: `${data.inviterName} vous invite à accéder à "${data.bookName}" sur Mémo`,
      html,
    });

    if (success) {
      console.log(`Book invitation email sent to ${data.recipientEmail} for book ${data.bookName}`);
    }
    return success;
  } catch (error) {
    console.error('Failed to send book invitation email:', error);
    return false;
  }
}

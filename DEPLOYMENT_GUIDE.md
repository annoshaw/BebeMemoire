# Guide de Déploiement - Mémo

Ce guide explique comment déployer l'application Mémo sur votre serveur personnel.

---

## Prérequis

### Logiciels requis
- **Node.js 20+** (LTS recommandé)
- **PostgreSQL 14+**
- **Nginx** (pour le reverse proxy)
- **PM2** (pour la gestion des processus)
- **Certbot** (pour SSL Let's Encrypt)
- **Git**

### Services externes
- Compte **Stripe** (paiements)
- Compte **AWS S3** (stockage vidéos/images)
- Compte **MailerSend** (emails transactionnels)

---

## Étape 1 : Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt install -y nginx

# Installer PM2
sudo npm install -g pm2

# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Étape 2 : Configurer PostgreSQL

```bash
# Connexion à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE memo_db;
CREATE USER memo_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE memo_db TO memo_user;
\q
```

---

## Étape 3 : Cloner et configurer le projet

```bash
# Créer le répertoire de l'application
sudo mkdir -p /var/www/memo
sudo chown $USER:$USER /var/www/memo

# Cloner le projet (depuis GitHub ou télécharger le zip)
cd /var/www/memo
git clone https://github.com/votre-repo/memo.git .
# OU extraire le zip téléchargé

# Installer les dépendances
npm install

# Compiler l'application
npm run build
```

---

## Étape 4 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
nano /var/www/memo/.env
```

Contenu du fichier `.env` :

```env
# Base de données
DATABASE_URL=postgresql://memo_user:votre_mot_de_passe@localhost:5432/memo_db

# Session
SESSION_SECRET=une_chaine_aleatoire_tres_longue_et_securisee
NODE_ENV=production

# Stripe (clés LIVE, pas test)
STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# AWS S3
AWS_ACCESS_KEY_ID=votre_access_key
AWS_SECRET_ACCESS_KEY=votre_secret_key
AWS_S3_BUCKET=votre-bucket-memo
AWS_REGION=us-east-2

# MailerSend
MAILERSEND_API_KEY=votre_cle_mailersend

# URL de l'application
APP_URL=https://votre-domaine.com
```

---

## Étape 5 : Exécuter les migrations de base de données

```bash
cd /var/www/memo
npm run db:push
```

---

## Étape 6 : Configurer PM2

Créez un fichier de configuration PM2 :

```bash
nano /var/www/memo/ecosystem.config.js
```

Contenu :

```javascript
module.exports = {
  apps: [{
    name: 'memo',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/memo',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/memo/error.log',
    out_file: '/var/log/memo/out.log',
    log_file: '/var/log/memo/combined.log',
    time: true
  }]
};
```

Créer le répertoire de logs et démarrer :

```bash
sudo mkdir -p /var/log/memo
sudo chown $USER:$USER /var/log/memo

# Démarrer l'application
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

---

## Étape 7 : Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/memo
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Taille maximale des uploads (pour les vidéos)
    client_max_body_size 100M;
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/memo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Étape 8 : Configurer SSL avec Let's Encrypt

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions pour obtenir le certificat SSL gratuit.

---

## Étape 9 : Configurer le Webhook Stripe

1. Allez sur [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur **"Ajouter un endpoint"**
3. URL : `https://votre-domaine.com/api/webhooks/stripe`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le **Signing secret** dans votre `.env` (`STRIPE_WEBHOOK_SECRET`)

---

## Étape 10 : Configurer AWS S3 CORS

Dans la console AWS S3, configurez CORS pour votre bucket :

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://votre-domaine.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

---

## Commandes utiles

```bash
# Voir les logs en temps réel
pm2 logs memo

# Redémarrer l'application
pm2 restart memo

# Voir le statut
pm2 status

# Mettre à jour l'application
cd /var/www/memo
git pull
npm install
npm run build
pm2 restart memo
```

---

## Sécurité supplémentaire

### Firewall UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Mises à jour automatiques
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Vérification finale

1. Accédez à `https://votre-domaine.com`
2. Testez la création de compte
3. Testez un paiement (mode live)
4. Vérifiez l'envoi d'emails
5. Testez l'upload de fichiers

---

## Support

Pour toute question : **memo.app.25@hotmail.com**

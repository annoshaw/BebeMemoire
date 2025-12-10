// Script to create Memoria products in Stripe
// Run with: npx tsx scripts/seed-stripe-products.ts

import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Creating Memoria products in Stripe...\n');
  
  const stripe = await getUncachableStripeClient();

  // Check if products already exist
  const existingProducts = await stripe.products.search({
    query: "name~'Memoria'",
  });

  if (existingProducts.data.length > 0) {
    console.log('Memoria products already exist in Stripe:');
    existingProducts.data.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    console.log('\nSkipping creation. Delete existing products first if you want to recreate.');
    return;
  }

  // Create Softcover product
  console.log('Creating Softcover product...');
  const softcoverProduct = await stripe.products.create({
    name: 'Memoria - Livre Couverture Souple',
    description: 'Livre de souvenirs bébé avec couverture souple. Prix de base + frais par page.',
    metadata: {
      productType: 'softcover',
      basePrice: '4324', // 43.24 CAD in cents
      pageRate: '98', // 0.98 CAD per page in cents
      category: 'print',
    },
  });
  console.log(`  Created: ${softcoverProduct.id}`);

  // Create Hardcover product
  console.log('Creating Hardcover product...');
  const hardcoverProduct = await stripe.products.create({
    name: 'Memoria - Livre Couverture Rigide',
    description: 'Livre de souvenirs bébé avec couverture rigide premium. Prix de base + frais par page.',
    metadata: {
      productType: 'hardcover',
      basePrice: '5499', // 54.99 CAD in cents
      pageRate: '98', // 0.98 CAD per page in cents
      category: 'print',
    },
  });
  console.log(`  Created: ${hardcoverProduct.id}`);

  // Create E-Book product
  console.log('Creating E-Book product...');
  const ebookProduct = await stripe.products.create({
    name: 'Memoria - E-Book PDF',
    description: 'Version numérique PDF de votre livre de souvenirs. Téléchargement instantané.',
    metadata: {
      productType: 'ebook',
      basePrice: '3000', // 30.00 CAD in cents
      pageRate: '50', // 0.50 CAD per page in cents
      category: 'digital',
    },
  });
  console.log(`  Created: ${ebookProduct.id}`);

  // Create shipping product
  console.log('Creating Shipping product...');
  const shippingProduct = await stripe.products.create({
    name: 'Memoria - Frais de livraison',
    description: 'Frais de livraison pour les livres imprimés au Canada.',
    metadata: {
      productType: 'shipping',
      category: 'shipping',
    },
  });
  
  await stripe.prices.create({
    product: shippingProduct.id,
    unit_amount: 1200, // 12.00 CAD
    currency: 'cad',
    metadata: {
      type: 'flat_rate',
    },
  });
  console.log(`  Created: ${shippingProduct.id}`);

  console.log('\n✅ All Memoria products created successfully!');
  console.log('\nProducts will be synced to the database automatically via webhooks.');
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creating products:', error);
    process.exit(1);
  });

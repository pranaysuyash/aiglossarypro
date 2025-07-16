#!/usr/bin/env node

import crypto from 'crypto';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

function verifyGumroadSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}

async function testGumroadWebhook() {
  console.log('🧪 Testing Gumroad Webhook Configuration...\n');

  // Check if webhook secret is configured
  if (!process.env.GUMROAD_WEBHOOK_SECRET) {
    console.error('❌ GUMROAD_WEBHOOK_SECRET is not configured!');
    console.log('\nTo configure:');
    console.log('1. Log in to Gumroad');
    console.log('2. Go to Settings > Advanced > Webhooks');
    console.log('3. Add webhook URL: https://aimlglossary.com/api/gumroad/webhooks/sale');
    console.log('4. Copy the webhook secret and add to .env');
    process.exit(1);
  }

  console.log('✅ Webhook secret is configured');
  console.log(`   Secret length: ${process.env.GUMROAD_WEBHOOK_SECRET.length} characters`);

  // Create a test payload similar to what Gumroad sends
  const testPayload = {
    seller_id: 'test_seller_123',
    product_id: 'ggczfy',
    product_name: 'AI/ML Glossary Pro - Lifetime Access',
    permalink: 'ggczfy',
    product_permalink: 'https://pranaysuyash.gumroad.com/l/ggczfy',
    email: 'test@example.com',
    price: 17900, // $179.00 in cents
    currency: 'USD',
    quantity: 1,
    order_number: 'TEST-' + Date.now(),
    sale_id: 'test_sale_' + Date.now(),
    sale_timestamp: new Date().toISOString(),
    purchaser_id: 'test_purchaser_123',
    purchase_id: 'test_purchase_' + Date.now(),
    receipt_url: 'https://app.gumroad.com/receipts/test',
    ip_country: 'US',
    is_gift_receiver_purchase: false,
    refunded: false,
    discover_fee_charged: false,
    is_recurring_charge: false,
    test: true, // This indicates it's a test webhook
  };

  // Generate signature
  const testSignature = crypto
    .createHmac('sha256', process.env.GUMROAD_WEBHOOK_SECRET)
    .update(JSON.stringify(testPayload))
    .digest('hex');

  console.log('\n📝 Test webhook payload created:');
  console.log(`   Product: ${testPayload.product_name}`);
  console.log(`   Price: $${testPayload.price / 100}`);
  console.log(`   Email: ${testPayload.email}`);
  console.log(`   Order: ${testPayload.order_number}`);

  // Verify signature locally
  console.log('\n🔐 Testing signature verification...');
  const isValid = verifyGumroadSignature(
    testPayload,
    testSignature,
    process.env.GUMROAD_WEBHOOK_SECRET
  );

  if (isValid) {
    console.log('✅ Signature verification working correctly!');
  } else {
    console.error('❌ Signature verification failed!');
    process.exit(1);
  }

  // Test webhook endpoint if running locally
  const webhookUrl = process.env.BASE_URL || 'http://localhost:3001';
  console.log(`\n🌐 Testing webhook endpoint at ${webhookUrl}...`);

  try {
    const response = await fetch(`${webhookUrl}/api/gumroad/webhooks/sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gumroad-Signature': testSignature,
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log('✅ Webhook endpoint responded successfully!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText}`);
    } else {
      console.error('❌ Webhook endpoint error:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('⚠️  Could not reach webhook endpoint');
    console.log('   This is normal if the server is not running');
    console.log('   Error:', error.message);
  }

  console.log('\n📋 Webhook Configuration Summary:');
  console.log('   ✅ Webhook secret is set');
  console.log('   ✅ Signature verification works');
  console.log('   📍 Webhook URL: https://aimlglossary.com/api/gumroad/webhooks/sale');
  console.log('\n💡 Next steps:');
  console.log('   1. Ensure webhook URL is added in Gumroad dashboard');
  console.log('   2. Test with a real purchase (Gumroad has a test mode)');
  console.log('   3. Monitor logs for incoming webhooks');
}

// Run the test
testGumroadWebhook().catch(console.error);

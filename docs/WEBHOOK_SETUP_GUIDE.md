# Gumroad Webhook Setup Guide

This guide walks you through setting up Gumroad webhooks for AI Glossary Pro to automatically process purchases, refunds, and other events.

## Overview

Webhooks allow Gumroad to notify your application in real-time when events occur:
- **Sales**: Process new purchases and grant premium access
- **Refunds**: Revoke access and update user status
- **Disputes**: Handle payment disputes
- **Cancellations**: Process subscription cancellations

## Prerequisites

- Gumroad account with a product created
- AI Glossary Pro deployed to a publicly accessible URL
- Access to Gumroad settings

## Step-by-Step Setup

### 1. Get Your Gumroad Access Token

1. Log in to [Gumroad](https://gumroad.com)
2. Navigate to **Settings** → **Advanced**
3. Scroll to **Applications** section
4. Click **Create Application**
5. Fill in:
   - **Application Name**: AI Glossary Pro Integration
   - **Description**: Webhook integration for AI Glossary Pro
6. Click **Create Application**
7. Copy the **Access Token** that appears
8. Add to your `.env.production`:
   ```env
   GUMROAD_ACCESS_TOKEN=your_access_token_here
   ```

### 2. Configure Webhook Endpoints

In Gumroad Settings → Advanced → Webhooks:

#### Sale Webhook

1. Click **Add Webhook**
2. Configure:
   - **URL**: `https://yourdomain.com/api/gumroad/webhooks/sale`
   - **Event**: Sale
3. Click **Create Webhook**
4. Copy the **Signing Secret** that appears

#### Refund Webhook

1. Click **Add Webhook**
2. Configure:
   - **URL**: `https://yourdomain.com/api/gumroad/webhooks/refund`
   - **Event**: Refund
3. Click **Create Webhook**

#### Dispute Webhook

1. Click **Add Webhook**
2. Configure:
   - **URL**: `https://yourdomain.com/api/gumroad/webhooks/dispute`
   - **Event**: Dispute
3. Click **Create Webhook**

#### Cancellation Webhook (Optional - for subscriptions)

1. Click **Add Webhook**
2. Configure:
   - **URL**: `https://yourdomain.com/api/gumroad/webhooks/cancellation`
   - **Event**: Cancellation
3. Click **Create Webhook**

### 3. Configure Webhook Secret

1. Each webhook will have a unique signing secret
2. For production, you'll typically use one secret for all webhooks
3. Add the secret to your `.env.production`:
   ```env
   GUMROAD_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### 4. Update Product Configuration

1. In your Gumroad product settings, note your product ID
2. Update your `.env.production`:
   ```env
   VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product-id
   ```

## Webhook Payload Examples

### Sale Webhook Payload

```json
{
  "sale_id": "1234567890",
  "product_id": "your-product-id",
  "product_name": "AI Glossary Pro Premium",
  "email": "customer@example.com",
  "price": 249,
  "currency": "USD",
  "quantity": 1,
  "order_number": 987654321,
  "sale_timestamp": "2024-01-15T10:30:00Z",
  "full_name": "John Doe",
  "variants": {},
  "test": false,
  "referrer": "https://aiglossarypro.com",
  "refunded": false,
  "disputed": false
}
```

### Refund Webhook Payload

```json
{
  "refund_id": "ref_1234567890",
  "sale_id": "1234567890",
  "amount_refunded_in_cents": 24900,
  "refund_date": "2024-01-16T15:45:00Z",
  "refund_reason": "Customer request"
}
```

## Testing Webhooks

### Using Gumroad's Test Tool

1. In Gumroad webhook settings, click **Test** next to each webhook
2. Gumroad will send a test payload to your endpoint
3. Check your server logs to verify receipt

### Manual Testing (Development)

```bash
# Test sale webhook
curl -X POST http://localhost:3001/api/gumroad/webhooks/test-sale \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "price": 249
  }'

# Test refund webhook
curl -X POST http://localhost:3001/api/gumroad/webhooks/test-refund \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": "test_sale_123",
    "amount": 24900,
    "reason": "Test refund"
  }'
```

### Using the Validation Script

```bash
npm run validate:production
```

This will verify:
- Gumroad access token is valid
- Webhook secret is configured
- API endpoints are accessible

## Webhook Security

### Signature Verification

All webhooks are verified using HMAC-SHA256:

```typescript
// Automatic verification in gumroadWebhooks.ts
const signature = req.headers['x-gumroad-signature'];
const isValid = GumroadService.validateWebhookSignature(rawBody, signature);
```

### IP Whitelisting (Optional)

For additional security, whitelist Gumroad's IP addresses:
- Production: Contact Gumroad support for current IP list
- Add to your firewall or reverse proxy configuration

### Request Validation

Each webhook payload is validated against a schema:
- Required fields are checked
- Data types are verified
- Invalid requests are rejected with 400 status

## Monitoring and Debugging

### Check Webhook Health

```bash
# Health check endpoint
curl https://yourdomain.com/api/gumroad/webhooks/health
```

### View Webhook Logs

```bash
# If using PM2
pm2 logs ai-glossary-pro --lines 100 | grep "Gumroad"

# If using systemd
journalctl -u ai-glossary-pro -f | grep "Gumroad"

# Application logs
tail -f logs/app.log | grep "Gumroad"
```

### Common Log Messages

**Successful Sale**:
```
INFO: Received Gumroad sale webhook: { saleId: '123', email: 'user@example.com', amount: 249 }
INFO: Gumroad sale processed successfully: { saleId: '123', userId: 'user_456' }
```

**Failed Webhook**:
```
WARN: Gumroad webhook missing signature header
ERROR: Error processing Gumroad sale webhook: Invalid signature
```

## Troubleshooting

### Webhook Not Receiving

1. **Verify URL is correct**: Must be publicly accessible
2. **Check SSL certificate**: Must be valid for HTTPS
3. **Test with curl**: 
   ```bash
   curl -I https://yourdomain.com/api/gumroad/webhooks/health
   ```
4. **Check firewall**: Ensure port 443 is open
5. **Verify DNS**: Domain resolves correctly

### Signature Validation Failing

1. **Check webhook secret**: Must match exactly (no extra spaces)
2. **Verify raw body**: Ensure Express is providing raw body
3. **Check headers**: `x-gumroad-signature` must be present
4. **Test with Gumroad's tool**: Use their test feature

### Purchase Not Processing

1. **Check logs**: Look for specific error messages
2. **Verify database**: Ensure purchase table is accessible
3. **Check user matching**: Email might not exist in users table
4. **Test mode**: Ensure test purchases are handled correctly

### Duplicate Webhooks

Gumroad may retry webhooks if they don't receive 200 status:
1. **Always return 200**: Even for duplicate processing
2. **Implement idempotency**: Check if sale_id already exists
3. **Log duplicates**: Track but don't reprocess

## Best Practices

1. **Always validate signatures**: Never trust webhook data without verification
2. **Return quickly**: Process webhooks asynchronously if needed
3. **Handle failures gracefully**: Log errors but return 200 to prevent retries
4. **Monitor webhook health**: Set up alerts for failures
5. **Keep secrets secure**: Never commit webhook secrets to git
6. **Test thoroughly**: Use Gumroad's test tools before going live
7. **Implement retry logic**: For downstream operations (email, etc.)

## Integration with AI Glossary Pro

When a webhook is received, the application:

1. **Validates the signature** to ensure authenticity
2. **Processes the event**:
   - Sale: Creates purchase record, updates user access
   - Refund: Updates purchase status, revokes access
   - Dispute: Creates support ticket, flags account
3. **Sends notifications** (if configured):
   - Welcome email for new purchases
   - Confirmation email for refunds
4. **Updates analytics**: Tracks conversion and revenue metrics
5. **Processes referrals**: Awards commissions if applicable

## Next Steps

1. Test all webhook endpoints in development
2. Verify webhook signatures are validating correctly
3. Monitor initial production webhooks closely
4. Set up alerts for webhook failures
5. Document any custom webhook handling
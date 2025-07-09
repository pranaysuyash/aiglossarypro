# Gumroad Webhook Configuration Guide

## Current Status ✅

The webhook system is **fully implemented** and ready for production. Only environment configuration is needed.

## Required Configuration

### 1. **Set Environment Variables**

Add to your `.env` file:
```bash
# Required for webhook security
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret-here

# Required for webhook URL construction
BASE_URL=https://aimlglossary.com
```

### 2. **Configure Webhook in Gumroad Dashboard**

1. **Login to Gumroad** → Go to your product dashboard
2. **Settings** → **Advanced** → **Webhooks**
3. **Add New Webhook**:
   - **URL**: `https://aimlglossary.com/api/gumroad/webhook`
   - **Resource**: `sale`
   - **Events**: Select all events (created, updated, refunded, etc.)
4. **Copy the webhook secret** that Gumroad generates
5. **Save the webhook configuration**

### 3. **Update Environment Variable**

Replace the placeholder with your actual webhook secret:
```bash
GUMROAD_WEBHOOK_SECRET=your-actual-webhook-secret-from-gumroad
```

## Testing the Webhook

### 1. **Test Webhook Delivery**
1. In Gumroad dashboard → **Webhooks** → **Test Webhook**
2. Send a test webhook to verify connectivity
3. Check server logs for successful processing

### 2. **Test Purchase Flow**
1. Make a test purchase through Gumroad
2. Verify webhook is received and processed
3. Check that user gets lifetime access in database

### 3. **Monitor Logs**
```bash
# Watch for webhook processing
tail -f logs/app.log | grep "Gumroad webhook"
```

## Current Implementation Features ✅

### **Security**
- ✅ HMAC signature verification with timing-safe comparison
- ✅ Webhook secret validation
- ✅ Development mode fallback (allows testing without secret)

### **Purchase Processing**
- ✅ Automatic user creation if not exists
- ✅ Lifetime access granted immediately
- ✅ Purchase records stored in database
- ✅ Confirmation email sent to customer

### **Error Handling**
- ✅ Comprehensive logging with Sentry integration
- ✅ Graceful error handling for failed webhooks
- ✅ Detailed error messages for debugging

### **Database Integration**
- ✅ `purchases` table stores all Gumroad transactions
- ✅ `users` table updated with lifetime access status
- ✅ Purchase data includes order ID, amount, currency, etc.

## Webhook Endpoint Details

### **Endpoint**: `POST /api/gumroad/webhook`

### **Expected Payload**:
```json
{
  "sale": {
    "email": "customer@example.com",
    "order_id": "12345",
    "amount_cents": 17900,
    "currency": "USD",
    "purchaser_id": "abc123",
    "product_name": "AI/ML Glossary Pro - Lifetime Access"
  }
}
```

### **Response**:
```json
{
  "success": true,
  "message": "Purchase processed successfully",
  "data": {
    "userId": "user-uuid",
    "email": "customer@example.com",
    "wasExistingUser": false,
    "orderId": "12345",
    "processedAt": "2025-01-09T10:30:00Z"
  }
}
```

## Additional Features Available

### **Manual Purchase Verification**
- **Endpoint**: `POST /api/gumroad/verify-purchase`
- **Usage**: Customers can verify their purchase by email
- **Component**: `PurchaseVerification.tsx` (already implemented)

### **Admin Access Granting**
- **Endpoint**: `POST /api/gumroad/grant-access`
- **Usage**: Admins can manually grant lifetime access
- **Auth**: Requires admin authentication

### **Test Purchase (Development)**
- **Endpoint**: `POST /api/gumroad/test-purchase`
- **Usage**: Create test purchases in development mode
- **Component**: `TestPurchaseButton.tsx` (already implemented)

## Configuration Verification

After setting up the webhook, verify the configuration:

1. **Environment Variables Set**: ✅
   ```bash
   echo $GUMROAD_WEBHOOK_SECRET
   echo $BASE_URL
   ```

2. **Webhook URL Configured**: ✅
   - Gumroad dashboard shows webhook URL
   - Webhook secret matches environment variable

3. **Server Running**: ✅
   ```bash
   curl -X POST https://aimlglossary.com/api/gumroad/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "connectivity"}'
   ```

4. **Database Tables Exist**: ✅
   - `purchases` table for storing transactions
   - `users` table for lifetime access status

## Troubleshooting

### **Webhook Not Received**
- Check webhook URL in Gumroad dashboard
- Verify server is running and accessible
- Check firewall settings for port 443/80

### **Signature Verification Failed**
- Ensure webhook secret matches exactly
- Check for extra spaces or characters
- Verify webhook is configured for 'sale' resource

### **Purchase Not Processed**
- Check server logs for error messages
- Verify database connection is working
- Ensure user creation is successful

## Production Checklist

- [ ] `GUMROAD_WEBHOOK_SECRET` set in production environment
- [ ] `BASE_URL` points to production domain
- [ ] Webhook URL configured in Gumroad dashboard
- [ ] Test webhook delivery successful
- [ ] Test purchase flow complete
- [ ] Error monitoring (Sentry) configured
- [ ] Database tables created and accessible
- [ ] Email service configured for purchase confirmations

## Status: ✅ READY FOR PRODUCTION

The webhook system is fully implemented and production-ready. Only the webhook secret configuration is needed to activate the system.
# Gumroad Webhook Quick Setup

## 🚀 Quick Setup Steps

### 1. Get Gumroad Access Token
1. Log in to [Gumroad](https://gumroad.com)
2. Go to **Settings** → **Advanced** → **Applications**
3. Click **Create Application**
4. Name it "AI Glossary Pro Integration"
5. Copy the **Access Token**

### 2. Set Up Webhooks
1. In Gumroad **Settings** → **Advanced** → **Webhooks**
2. Add webhook for **Sale** event:
   - URL: `https://aiglossarypro.com/api/gumroad/webhooks/sale`
   - Copy the **Signing Secret**

### 3. Add to Production Environment
Add these to your `.env.production`:
```bash
# Gumroad Configuration
GUMROAD_ACCESS_TOKEN=your_access_token_here
GUMROAD_WEBHOOK_SECRET=your_webhook_signing_secret_here
VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product-id
```

### 4. Test the Configuration
```bash
# Run the test script
npm run test:webhook

# Or check the health endpoint
curl https://aiglossarypro.com/api/gumroad/webhooks/health
```

## 🔒 Security Notes
- The webhook secret is used to verify that webhooks are actually from Gumroad
- Never commit these secrets to git
- The application automatically validates all webhook signatures

## ✅ What Happens on Purchase
1. Gumroad sends webhook to your server
2. Server validates the signature using `GUMROAD_WEBHOOK_SECRET`
3. Purchase is recorded in database
4. Email is sent to buyer with login instructions (using Resend)
5. When buyer logs in with Google/GitHub, their account is upgraded

## 🧪 Testing in Development
```bash
# Test a sale locally
curl -X POST http://localhost:3001/api/gumroad/webhooks/test-sale \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "price": 249
  }'
```

## 📝 Important URLs
- Webhook endpoints are at: `/api/gumroad/webhooks/*`
- Health check: `/api/gumroad/webhooks/health`
- Supported events: `sale`, `refund`, `dispute`, `cancellation`

That's it! Your Gumroad integration is ready. 🎉
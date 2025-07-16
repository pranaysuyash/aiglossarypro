# Google Analytics 4 Quick Setup

## 🚀 Quick Setup Steps

### 1. Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon) → **Create** → **Property**
3. Name it "AI Glossary Pro"
4. Select your timezone and currency
5. Configure business details

### 2. Set Up Web Data Stream
1. In your new property, go to **Admin** → **Data Streams**
2. Click **Add stream** → **Web**
3. Enter:
   - Website URL: `https://aiglossarypro.com`
   - Stream name: "AI Glossary Pro Web"
4. Copy the **Measurement ID** (starts with G-)

### 3. Get API Secret (Optional - for server-side tracking)
1. In the same Data Stream page
2. Scroll to **Additional Settings** → **Measurement Protocol API secrets**
3. Click **Create**
4. Name it "Production Server"
5. Copy the API secret

### 4. Add to Production Environment
Add these to your `.env.production`:
```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Your Measurement ID
GA_API_SECRET=your_api_secret        # Optional - for server tracking
```

### 5. Configure Conversions
In GA4, go to **Configure** → **Conversions**:
1. Mark these events as conversions:
   - `purchase` - When user buys premium
   - `signup_complete` - When user completes signup
   - `newsletter_signup` - Newsletter subscriptions
   - `hero_cta_click` - Main CTA clicks

### 6. Test the Setup
```bash
# Check if analytics is loading
npm run check:analytics

# Or manually verify in browser console
console.log(window.gtag); // Should be a function
```

## ✅ What's Already Implemented

### Automatic Tracking:
- Page views with enhanced data
- Scroll depth (25%, 50%, 75%, 90%, 100%)
- Section visibility
- All CTA button clicks
- Form submissions
- A/B test variants
- Conversion funnel (6 stages)

### Privacy Features:
- Cookie consent integration
- IP anonymization enabled
- Do Not Track support
- GDPR compliant

### Business Metrics:
- Early bird signup tracking
- Pricing interaction monitoring
- Purchase tracking
- User journey mapping

## 🔍 Verify in GA4

1. **Real-time Reports**:
   - Go to **Reports** → **Real-time**
   - Navigate your site
   - See events appearing live

2. **Debug View**:
   - Go to **Configure** → **DebugView**
   - Enable debug mode in development
   - See detailed event parameters

3. **Conversions**:
   - Go to **Reports** → **Life cycle** → **Monetization** → **Conversions**
   - Monitor conversion rates

## 📊 Key Reports to Set Up

1. **Landing Page Funnel**:
   - Create funnel exploration
   - Add steps: Page View → Hero Engagement → Pricing View → CTA Click → Signup → Complete

2. **A/B Test Dashboard**:
   - Create custom dashboard
   - Add cards for variant performance
   - Compare conversion rates

3. **User Acquisition**:
   - Monitor traffic sources
   - Track campaign performance
   - Analyze user quality

## 🚨 Common Issues

**Events not showing?**
- Check cookie consent is accepted
- Verify Measurement ID is correct
- Ensure analytics isn't blocked by ad blockers

**Missing conversions?**
- Confirm events are marked as conversions in GA4
- Wait 24-48 hours for data processing
- Check event names match exactly

**Debug mode not working?**
- Enable debug mode in development environment
- Use GA4 DebugView in Google Analytics
- Check browser console for errors

That's it! Your GA4 analytics is ready to track everything on AI Glossary Pro. 🎉
# Email Service Setup Guide

## Overview
AI Glossary Pro supports multiple email providers. Choose the one that best fits your needs.

## Option 1: Resend (Recommended for Production)

### Setup Steps:
1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (aimlglossary.com)
3. Get your API key from the dashboard
4. Add to `.env.production`:
```bash
EMAIL_ENABLED=true
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

### Test Command:
```bash
npm run test:email your-email@example.com
```

## Option 2: Gmail SMTP (Good for Development/Small Scale)

### Setup Steps:
1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password:
   - Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and generate password
3. Add to `.env.production`:
```bash
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

## Option 3: SendGrid (Enterprise Scale)

### Setup Steps:
1. Sign up at [https://sendgrid.com](https://sendgrid.com)
2. Verify your sender identity
3. Create an API key with "Mail Send" permissions
4. Add to `.env.production`:
```bash
EMAIL_ENABLED=true
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

## Option 4: Custom SMTP Server

### Setup Steps:
Add to `.env.production`:
```bash
EMAIL_ENABLED=true
SMTP_HOST=mail.your-server.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465
SMTP_USER=smtp-username
SMTP_PASS=smtp-password
FROM_EMAIL=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

## Email Templates

The system sends emails for:
- Password reset requests
- Purchase confirmations
- Welcome emails for new users
- Admin notifications

## Testing Your Configuration

1. **Basic Test**:
```bash
npm run test:email test@example.com
```

2. **Test All Templates**:
```bash
npm run test:email:all test@example.com
```

3. **Check Logs**:
```bash
tail -f logs/email.log
```

## Troubleshooting

### Gmail Issues:
- Ensure "Less secure app access" is OFF (we use app passwords)
- Check that 2FA is enabled
- Verify the app password is correct (no spaces)

### Resend Issues:
- Verify domain ownership
- Check API key permissions
- Ensure FROM email matches verified domain

### SendGrid Issues:
- Verify sender identity
- Check API key has "Mail Send" permission
- Monitor SendGrid dashboard for bounces

### General Issues:
- Check firewall allows outbound SMTP
- Verify EMAIL_ENABLED=true
- Test with `telnet` to SMTP host/port
- Check spam folders

## Production Checklist

- [ ] Email service configured and tested
- [ ] SPF records added to DNS
- [ ] DKIM configured (if using Resend/SendGrid)
- [ ] DMARC policy set
- [ ] Test emails sent successfully
- [ ] Bounce handling configured
- [ ] Unsubscribe links working
- [ ] Email logs monitored
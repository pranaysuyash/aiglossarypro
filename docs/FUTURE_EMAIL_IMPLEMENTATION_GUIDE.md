# Future Email Implementation Guide

> This document outlines email features to implement after launch, once the minimal purchase flow is working.

## Current State (Launch Day)

### ✅ Implemented
- **Purchase Instructions Email** - Sent via Resend when Gumroad purchase has no existing account
- **Social Auth Only** - Google/GitHub sign-in (no password management)
- **Entitlement System** - Tracks lifetime access by email before account creation

### 🚫 Intentionally Skipped
- Password reset flows
- Email verification  
- Welcome emails
- Contact form notifications
- Newsletter system

---

## Phase 1: Post-Launch Essentials (Week 1-2)

### 1. Welcome Email for New Users
**Trigger**: After first successful sign-in (not just purchase)
**Why**: Better onboarding, reduce churn, explain features

```typescript
// In auth callback after social sign-in
if (isNewUser) {
  await sendWelcomeEmail({
    email: user.email,
    name: user.displayName,
    signupMethod: 'google', // or 'github'
    hasLifetimeAccess: hasEntitlement
  });
}
```

**Email should include:**
- Personalized greeting
- Quick start guide (3-5 key features)
- Link to explore glossary
- Support contact

### 2. Contact Form Auto-Response
**Current**: Form submissions go to database only
**Needed**: Email to confirm receipt

```typescript
// In /api/newsletter/contact
await sendContactFormResponse({
  to: email,
  name: name,
  subject: subject,
  ticketId: submission.id // for reference
});
```

**Benefits:**
- Reduces duplicate submissions
- Sets response time expectations
- Looks professional

### 3. Admin Notification for Contact Forms
**Why**: You need to know about user issues immediately

```typescript
await sendAdminNotification({
  type: 'contact_form',
  from: { name, email },
  subject: subject,
  message: message,
  metadata: { utm_source, etc }
});
```

---

## Phase 2: Email/Password Support (Month 1-3)

### When to Add Password Auth
Consider adding when:
- Users specifically request it (>10 requests)
- Enterprise customers need it
- You want to reduce dependency on OAuth providers

### 4. Email Verification Flow
```typescript
// If enabling email/password signup
async function handleEmailSignup(email: string, password: string) {
  const user = await createUserWithEmailAndPassword(auth, email, password);
  
  // Option A: Use Firebase's built-in
  await sendEmailVerification(user);
  
  // Option B: Custom via Resend for branding
  const token = await generateVerificationToken(user.uid);
  await sendCustomVerificationEmail(email, token);
}
```

### 5. Password Reset Flow
```typescript
// Custom branded reset emails
async function handlePasswordReset(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return; // Silent fail for security
  
  const resetToken = await generateResetToken(user.uid);
  await sendPasswordResetEmail({
    email,
    resetUrl: `${FRONTEND_URL}/reset-password?token=${resetToken}`,
    expiresIn: '1 hour'
  });
}
```

---

## Phase 3: Marketing & Engagement (Month 3-6)

### 6. Newsletter System
**Current**: Newsletter subscriptions saved but no emails sent

```typescript
// Newsletter sending via BullMQ job queue
await emailQueue.add('newsletter', {
  template: 'monthly_update',
  subject: 'AI Glossary Pro: New Terms & Features',
  segments: ['active_users', 'lifetime_members'],
  content: {
    newTermsCount: 150,
    featuredTerm: { name: 'Transformer', ... },
    productUpdates: [...]
  }
});
```

**Implementation needs:**
- Double opt-in for new subscribers
- Unsubscribe handling
- Bounce management
- Newsletter templates
- Segmentation by user type

### 7. Learning Progress Notifications
**Trigger**: User milestones (25%, 50%, 100% of category)

```typescript
await sendProgressEmail({
  email: user.email,
  achievement: 'Completed Machine Learning Basics',
  nextSteps: ['Deep Learning', 'NLP Fundamentals'],
  stats: {
    termsLearned: 127,
    daysStreak: 7
  }
});
```

### 8. Re-engagement Campaigns
**For inactive users (30+ days)**
```typescript
// Automated via cron job
const inactiveUsers = await getInactiveUsers(30);
for (const user of inactiveUsers) {
  await sendReengagementEmail({
    email: user.email,
    lastActive: user.lastLoginAt,
    newContent: getNewTermsSince(user.lastLoginAt)
  });
}
```

---

## Phase 4: Advanced Features (Month 6+)

### 9. Daily/Weekly Digest
**Personalized term recommendations**
```typescript
interface DigestEmail {
  frequency: 'daily' | 'weekly';
  preferences: string[]; // categories
  format: 'simple' | 'detailed';
}
```

### 10. Community Features
- New comment on your contribution
- Someone endorsed your definition
- Expert replied to your question

### 11. Enterprise/Team Features
- Team member invitations
- Usage reports for admins
- Bulk user onboarding

### 12. Transactional Improvements
- Failed payment notifications
- Subscription renewal reminders (if you add subscriptions)
- API usage alerts

---

## Technical Implementation Notes

### Email Template System
Consider building a robust template system:

```typescript
// templates/base.tsx
export const BaseTemplate = ({ children, footer = true }) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logo} width="150" alt="AI Glossary Pro" />
        {children}
        {footer && <Footer />}
      </Container>
    </Body>
  </Html>
);

// Use with React Email or similar
const WelcomeEmail = ({ name }) => (
  <BaseTemplate>
    <Heading>Welcome to AI Glossary Pro, {name}!</Heading>
    <Text>Your journey into AI terminology starts here...</Text>
  </BaseTemplate>
);
```

### Analytics & Tracking
Add email analytics:
- Open rates (via tracking pixel)
- Click rates (via redirects)
- Conversion tracking
- A/B testing capabilities

### Compliance Considerations
As you grow:
- GDPR compliance (explicit consent)
- CAN-SPAM compliance (unsubscribe links)
- CCPA considerations
- Preference center for users

### Performance Optimization
- Batch sending for large lists
- Rate limiting (Resend: 10 emails/second on Pro)
- Retry logic for failures
- Email queuing system (already have BullMQ)

---

## Migration Path

### From Firebase Auth Emails → Resend
If you start with Firebase's built-in emails:
1. Keep Firebase emails initially
2. Add Resend in parallel
3. Gradually migrate each flow
4. Disable Firebase emails once stable

### From Basic → Advanced Templates
1. Start with plain HTML strings
2. Move to React Email components
3. Add visual template builder (optional)
4. Consider headless email platform

---

## Cost Projections

### Resend Pricing Tiers
- **Free**: 3,000/month (current need)
- **Pro**: $20/mo for 50,000 emails
- **Scale**: $90/mo for 100,000 emails

### When to Upgrade
- ~1,000 active users = Stay on Free
- ~5,000 active users = Move to Pro  
- ~20,000 active users = Consider Scale

### Alternative If Cost Becomes Issue
- Amazon SES: $0.10 per 1,000 emails (cheapest)
- Self-hosted: Postal or similar (complex but free)

---

## Testing Strategy

### Email Testing Tools
1. **Mailtrap** - Catch emails in dev/staging
2. **Litmus** - Cross-client rendering tests
3. **Mail Tester** - Spam score checking

### Test Cases for Each Email Type
- [ ] Renders correctly in Gmail, Outlook, Apple Mail
- [ ] Links work and track properly
- [ ] Unsubscribe works
- [ ] Mobile responsive
- [ ] Plain text version readable
- [ ] Correct from/reply-to addresses

---

## Quick Reference: Priority Order

1. **Week 1**: Welcome email (improves onboarding)
2. **Week 2**: Contact form emails (support efficiency)
3. **Month 1**: Newsletter system (user engagement)
4. **Month 2**: Progress notifications (retention)
5. **Month 3**: Password auth + reset (if requested)
6. **Month 6+**: Everything else

Remember: Each email type should solve a real user problem. Don't add emails just because you can!
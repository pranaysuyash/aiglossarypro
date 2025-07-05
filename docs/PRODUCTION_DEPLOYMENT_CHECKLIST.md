# Production Deployment Checklist

## Overview

This comprehensive checklist ensures a secure, stable, and performant deployment of AI/ML Glossary Pro to production. Complete all sections before going live.

## 🔧 Environment Configuration Validation

### Run Configuration Checker First
```bash
# Validate entire production setup
npm run setup:production-check
```
- [ ] All critical checks pass
- [ ] No security warnings
- [ ] Database connectivity verified
- [ ] External API connections tested

### Core Environment Variables ✅
- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` points to production database with SSL
- [ ] `SESSION_SECRET` is production-grade (32+ chars)
- [ ] `PORT` is configured (default: 5000)
- [ ] `HOST=0.0.0.0` for container compatibility
- [ ] `CORS_ORIGIN` matches production domain
- [ ] `BASE_URL` matches production URL

### Platform-Specific Configuration
#### For Replit Deployment
- [ ] `REPLIT_DOMAINS` is configured with production domain
- [ ] `REPL_ID` is set correctly
- [ ] `ISSUER_URL` points to correct OAuth provider

#### For General Cloud Deployment
- [ ] SSL certificates are valid and current
- [ ] Domain DNS is properly configured
- [ ] Load balancer is configured (if applicable)
- [ ] CDN is configured (if applicable)

## 🔒 Security Configuration

### Authentication & Authorization ✅
- [ ] Mock authentication is **disabled** (no dev middleware active)
- [ ] Production OAuth is **enabled** and tested (Replit/Google/GitHub)
- [ ] Session configuration is production-ready
- [ ] Admin users are properly configured in database
- [ ] HTTPS is enforced for all traffic
- [ ] CSRF protection is enabled
- [ ] Rate limiting is configured and tested

### Security Headers & Protection ✅
- [ ] CORS configuration is restrictive and correct
- [ ] Security headers middleware is active
- [ ] Input validation and sanitization enabled
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] File upload security configured
- [ ] API endpoints properly secured

### External Service Security ✅
- [ ] OpenAI API key is valid and secure
- [ ] Gumroad webhook secret is configured
- [ ] Sentry DSN is configured for error tracking
- [ ] All API keys have proper permissions (least privilege)
- [ ] Third-party integrations use secure connections

## 🗄️ Database & Storage Configuration

### Database Setup ✅
- [ ] Production database is accessible with SSL
- [ ] All migrations have been applied successfully
- [ ] Database connection pooling is configured
- [ ] Performance indexes are created and optimized
- [ ] User table has proper indexes and constraints
- [ ] Session table is configured and accessible
- [ ] Admin users have correct permissions
- [ ] Database backup strategy is implemented

### Database Performance ✅
```bash
# Run database optimizations
npm run db:indexes-enhanced
npm run db:status

# Verify database performance
npm run db:test-performance
```
- [ ] Query performance is optimized
- [ ] Connection pooling is working
- [ ] Slow query logging is enabled
- [ ] Database monitoring is active

### Storage Configuration ✅
- [ ] S3 credentials (if used) are production-ready
- [ ] File upload limits are configured
- [ ] Storage backup strategy is implemented
- [ ] CDN is configured for static assets
- [ ] File security policies are in place

## 📊 Monitoring, Analytics & Performance

### Error Tracking & Logging ✅
- [ ] Sentry error tracking is configured
- [ ] Application logging is properly configured
- [ ] Log retention policies are set
- [ ] Log aggregation is working
- [ ] Alert thresholds are configured

### Performance Monitoring ✅
- [ ] PostHog analytics is configured
- [ ] Performance metrics are being collected
- [ ] Cache performance is monitored
- [ ] API response times are tracked
- [ ] Database query performance is monitored

### Health Checks & Monitoring ✅
- [ ] Health check endpoints are accessible
- [ ] Uptime monitoring is configured
- [ ] Alert systems are functional
- [ ] Performance baseline is established
- [ ] Monitoring dashboards are configured

## 🧪 Pre-Deployment Testing

### Build & Code Quality ✅
```bash
# Clean build verification
npm run build

# TypeScript check
npm run check

# Performance check
npm run perf:ci

# Security audit
npm audit
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Performance metrics are acceptable
- [ ] No high-severity security vulnerabilities

### Authentication Testing ✅
- [ ] OAuth flow works end-to-end
- [ ] User login/logout functions correctly
- [ ] Session persistence works across requests
- [ ] Admin access control is functional
- [ ] API endpoints require proper authentication
- [ ] No development users exist in production

### Functional Testing ✅
- [ ] Core application features work
- [ ] Search functionality is operational
- [ ] Content management works
- [ ] User registration and management work
- [ ] Payment processing works (if enabled)
- [ ] Email notifications work (if enabled)

## 🚀 Deployment Execution

### Final Pre-Deployment Check
```bash
# Run comprehensive production check
npm run setup:production-check

# Verify all critical systems
npm run build
npm run check
npm run perf:ci
```
- [ ] All systems green
- [ ] No critical failures
- [ ] Performance within acceptable limits

### 🔒 Authentication Mode Verification

#### Expected Console Output (Production)
```
✅ Production authentication setup complete
✅ Database connection established
✅ External services connected
✅ All routes registered successfully
🚀 Server running on https://your-domain.com in production mode
```

#### ❌ Red Flags (Must Not See)
```
⚠️ Mock authentication setup complete (development mode)
🔓 Development user ensured in database
🔓 Mock authentication: User logged in
⚠️ Redis connection failed - using mock
⚠️ OpenAI API key not configured
```

### Deployment Commands
```bash
# Standard deployment
npm run build
npm run start

# With process manager (recommended)
pm2 start dist/index.js --name "aiglossary-prod"
pm2 save
pm2 startup

# Container deployment
docker build -t aiglossary-prod .
docker run -p 5000:5000 --env-file .env.production aiglossary-prod
```

## 🧪 Production Testing Protocol

### 1. System Health Tests
```bash
# Health check
curl https://your-domain.com/api/health

# Database connectivity
curl https://your-domain.com/api/health/database

# External service connectivity  
curl https://your-domain.com/api/health/services

# Performance baseline
curl -w "@curl-format.txt" https://your-domain.com/
```
- [ ] Health endpoints respond correctly
- [ ] Database connectivity confirmed
- [ ] External services accessible
- [ ] Response times within acceptable limits

### 2. Authentication Flow Tests
```bash
# Authentication endpoint (should redirect to OAuth)
curl -v https://your-domain.com/api/login

# Verify no development endpoints
curl https://your-domain.com/api/auth/user
# Should return 401 or redirect, NOT dev user data

# Test protected endpoints
curl https://your-domain.com/api/admin/users
# Should require authentication
```

#### OAuth Flow Verification
1. Visit production URL
2. Click login/authenticate
3. Should redirect to configured OAuth provider
4. Complete OAuth flow
5. Should redirect back to app
6. Verify user session is created
7. Test logout functionality
8. Verify session is destroyed

### 3. API Security Tests
```bash
# Test rate limiting
for i in {1..20}; do curl https://your-domain.com/api/search; done

# Test CORS
curl -H "Origin: https://malicious-site.com" https://your-domain.com/api/health

# Test security headers
curl -I https://your-domain.com/

# Test input validation
curl -X POST https://your-domain.com/api/search -d '{"query": "<script>alert(1)</script>"}'
```

### 4. Performance Tests
```bash
# Load testing (basic)
ab -n 100 -c 10 https://your-domain.com/

# Database query performance
curl https://your-domain.com/api/search?q=machine+learning

# Cache performance
curl https://your-domain.com/api/terms/popular
```

### 5. External Service Integration Tests
```bash
# OpenAI API (if configured)
curl -X POST https://your-domain.com/api/ai/explain -d '{"term": "neural network"}'

# Payment webhook (if configured)
curl -X POST https://your-domain.com/api/webhooks/gumroad -d '{"test": "data"}'

# Email service (if configured)
curl -X POST https://your-domain.com/api/admin/newsletter/test
```

## 🔄 Emergency Rollback Procedures

### Critical System Failure Response

#### Immediate Actions (0-5 minutes)
```bash
# Check system status
npm run setup:production-check

# Verify environment variables
echo $NODE_ENV
echo $DATABASE_URL
echo $CORS_ORIGIN

# Quick health check
curl https://your-domain.com/api/health

# Check process status
ps aux | grep node
```

#### Emergency Rollback Options (5-15 minutes)

##### Option 1: Git Revert
```bash
# Revert to previous working deployment
git revert <failed-commit-hash>
npm run build
npm run start

# Or with PM2
pm2 restart aiglossary-prod
```

##### Option 2: Environment Fix
```bash
# Correct environment variables
cp .env.production.backup .env.production
npm run setup:production-check
pm2 restart aiglossary-prod
```

##### Option 3: Emergency Maintenance Mode
```bash
# Temporarily redirect traffic to maintenance page
# Update load balancer/reverse proxy configuration
# Or serve static maintenance page
```

### Database Rollback (if needed)
```bash
# Restore from backup
pg_restore -d production_db backup_file.sql

# Or rollback specific migrations
npm run db:rollback
```

### Rollback Verification
- [ ] Application starts without errors
- [ ] Database connectivity restored
- [ ] Authentication working
- [ ] Core features functional
- [ ] No data loss confirmed

## ⚠️ Common Deployment Mistakes

### Configuration Errors
- **Missing REPLIT_DOMAINS**: Results in mock auth being used
- **Wrong REPL_ID**: OAuth flow fails
- **Development SESSION_SECRET**: Security vulnerability
- **Mixed environment variables**: Unpredictable behavior

### Database Issues
- **Missing admin users**: No admin access post-deployment
- **Wrong database URL**: Authentication data loss
- **Missing migrations**: User/session tables not ready

### Security Oversights
- **HTTP instead of HTTPS**: Session hijacking risk
- **Weak session secret**: Session compromise
- **Mock auth in production**: Major security breach
- **Missing CSRF protection**: Cross-site attacks

## 📊 Post-Deployment Monitoring

### Key Metrics to Watch (First 24 Hours)
- Authentication success rate > 95%
- Average login time < 3 seconds
- Session duration matches expectations
- No 401 errors for authenticated users
- Admin functions accessible to authorized users

### Alerts to Configure
- Auth success rate drops below 90%
- More than 10 consecutive auth failures
- Development user detected in production
- Session store errors
- OAuth provider errors

## 🔧 Quick Fixes for Common Issues

### OAuth Redirect URI Mismatch
```bash
# Check Replit OAuth app settings
# Ensure callback URL matches: https://your-domain.replit.app/api/callback
# Update domain in OAuth app if changed
```

### Session Store Issues
```sql
-- Check session table
SELECT COUNT(*) FROM sessions;

-- Clear old sessions if needed
DELETE FROM sessions WHERE expire < NOW();
```

### Missing Admin Access
```sql
-- Grant admin rights to user
UPDATE users SET is_admin = true WHERE email = 'admin@yourdomain.com';
```

## 📝 Post-Deployment Documentation

### Required Updates After Each Deployment
- [ ] Update production URL in documentation
- [ ] Record any configuration changes
- [ ] Document any issues encountered and solutions
- [ ] Update monitoring dashboards
- [ ] Verify backup procedures are working

### Success Criteria
✅ **All users can authenticate successfully**
✅ **Admin panel is accessible to authorized users**
✅ **No development artifacts in production**
✅ **All API endpoints require proper authentication**
✅ **Session management works correctly**
✅ **Performance meets baseline expectations**

---

## 🆘 Emergency Contacts

### Primary
- **DevOps Lead**: [Contact info]
- **Technical Lead**: [Contact info]

### Secondary  
- **Product Owner**: [Contact info]
- **Platform Team**: [Contact info]

### External
- **Replit Support**: support@replit.com
- **Database Provider**: [Support contact]

---

*Checklist Version: 2.0.0*
*Last Updated: June 22, 2025*
*Next Review: July 22, 2025*

**⚠️ CRITICAL**: Never skip authentication verification steps. A failed authentication deployment can lock out all users.

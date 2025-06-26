# Production Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Environment Configuration ✅
- [ ] `NODE_ENV=production` is set
- [ ] `REPLIT_DOMAINS` is configured with production domain
- [ ] `REPL_ID` is set correctly
- [ ] `ISSUER_URL` points to correct OAuth provider
- [ ] `DATABASE_URL` points to production database
- [ ] `SESSION_SECRET` is production-grade (64+ chars)
- [ ] SSL certificates are valid and current

### Security Verification ✅
- [ ] Mock authentication is **disabled** (no dev middleware active)
- [ ] Real Replit OAuth is **enabled** and tested
- [ ] Session configuration is production-ready
- [ ] Admin users are properly configured in database
- [ ] HTTPS is enforced for all traffic
- [ ] CSRF protection is enabled

### Authentication Testing ✅
- [ ] OAuth flow works end-to-end
- [ ] User login/logout functions correctly
- [ ] Session persistence works across requests
- [ ] Admin access control is functional
- [ ] API endpoints require proper authentication
- [ ] No development users exist in production

### Database & Storage ✅
- [ ] Production database is accessible
- [ ] All migrations have been applied
- [ ] User table has proper indexes
- [ ] Session table is configured and accessible
- [ ] Admin users have correct permissions
- [ ] S3 credentials (if used) are production-ready

### Monitoring & Logging ✅
- [ ] Authentication metrics are being collected
- [ ] Error logging is configured
- [ ] Health check endpoints are accessible
- [ ] Performance monitoring is active
- [ ] Alert thresholds are set for auth failures

## 🔒 Authentication Mode Verification

### Expected Console Output (Production)
```
✅ Replit authentication setup complete
✅ S3 client initialized
✅ All routes registered successfully
🚀 Server running on https://your-app.replit.app in production mode
```

### ❌ Red Flags (Must Not See)
```
⚠️ Mock authentication setup complete (development mode)
🔓 Development user ensured in database
🔓 Mock authentication: User logged in
```

## 🧪 Production Testing Protocol

### 1. Pre-Go-Live Tests
```bash
# Health check
curl https://your-app.replit.app/api/health

# Authentication endpoint (should redirect to OAuth)
curl -v https://your-app.replit.app/api/login

# Verify no development endpoints
curl https://your-app.replit.app/api/auth/user
# Should return 401 or redirect, NOT dev user data
```

### 2. OAuth Flow Test
1. Visit production URL
2. Click login/authenticate
3. Should redirect to Replit OAuth
4. Complete OAuth flow
5. Should redirect back to app
6. Verify user session is created
7. Test logout functionality

### 3. API Authentication Test
```bash
# Without session (should fail)
curl https://your-app.replit.app/api/auth/user
# Expected: 401 or redirect

# With valid session (should work)
curl -b "session_cookie" https://your-app.replit.app/api/auth/user
# Expected: User data
```

## 🔄 Rollback Plan

### If Authentication Fails in Production

#### Immediate Actions (0-5 minutes)
```bash
# Check environment variables
echo $REPLIT_DOMAINS
echo $REPL_ID
echo $NODE_ENV

# Quick health check
curl https://your-app.replit.app/api/health
```

#### Emergency Rollback (5-15 minutes)
```bash
# Option 1: Revert to previous working deployment
git revert <failed-commit-hash>
./deploy.sh

# Option 2: Fix environment variables
# Correct the auth configuration
# Restart application services

# Option 3: Emergency maintenance mode
# Temporarily redirect traffic to maintenance page
```

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

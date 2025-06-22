# Authentication Incident Response Playbook

## 📋 Incident Classification

### Severity Levels

| Level | Description | Response Time | Impact |
|-------|-------------|---------------|---------|
| **P0** | Complete auth failure - no users can access | Immediate | All users blocked |
| **P1** | Partial auth failure - some users affected | < 30 min | Subset of users |
| **P2** | Auth degraded - login delays/errors | < 2 hours | User experience |
| **P3** | Minor auth issues - edge cases | < 24 hours | Individual users |

## 🚨 P0: Complete Authentication Failure

### Symptoms
- All users getting 401 errors
- Login page not loading
- Complete application inaccessibility

### Immediate Response (0-5 minutes)
```bash
# 1. Check service status
curl https://your-app.replit.app/api/health
curl https://your-app.replit.app/api/auth/user

# 2. Check environment
echo "Auth enabled: $REPLIT_DOMAINS"
echo "Node env: $NODE_ENV"

# 3. Check logs for auth setup messages
tail -f /var/log/app.log | grep -i auth
```

### Diagnostic Steps (5-15 minutes)
```bash
# Database connectivity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Session store
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Environment variables
env | grep -E "(REPLIT|SESSION|NODE_ENV)"
```

### Recovery Actions (15-30 minutes)

#### Option 1: Revert to Mock Auth (Emergency)
```bash
# Temporarily disable Replit auth
export REPLIT_DOMAINS=""
export REPL_ID=""
pm2 restart app
```

#### Option 2: Fix Replit Auth
```bash
# Verify OAuth configuration
# Check Replit dashboard for service status
# Restore missing environment variables
# Restart application services
```

#### Option 3: Rollback Deployment
```bash
# If recent deployment caused issue
git revert <commit-hash>
./deploy.sh
```

## 🟡 P1: Partial Authentication Failure

### Symptoms
- Some users can't log in
- Intermittent 401 errors
- New user registration failing

### Investigation Steps
```bash
# Check user-specific errors
psql $DATABASE_URL -c "SELECT * FROM users WHERE email = 'affected@user.com';"

# Check session data
psql $DATABASE_URL -c "SELECT * FROM sessions WHERE sess LIKE '%user-id%';"

# Review recent auth logs
grep "Authentication verification failed" /var/log/app.log | tail -20
```

### Resolution Actions
- Clear affected user sessions
- Verify user permissions in database
- Check for stale cache entries
- Update user records if corrupted

## 🟠 P2: Authentication Degraded

### Symptoms
- Slow login response times
- Occasional timeout errors
- Session expiration issues

### Performance Investigation
```bash
# Check database performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM users LIMIT 1;"

# Check session store performance
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Monitor auth endpoint performance
curl -w "@curl-format.txt" -s -o /dev/null https://your-app.replit.app/api/auth/user
```

### Optimization Actions
- Scale database connections
- Clear old sessions
- Restart application services
- Check for memory leaks

## 🔧 Common Fixes by Error Type

### "Unauthorized" (401) Errors

**Development Environment:**
```bash
# Verify mock auth setup
grep "Mock authentication setup" logs/
# Restart with correct environment
NODE_ENV=development npm run dev
```

**Production Environment:**
```bash
# Check Replit OAuth configuration
curl -v "https://replit.com/oidc/.well-known/openid_configuration"
# Verify callback URL configuration
```

### "t.map is not a function" Errors

**Root Cause**: Frontend receiving error object instead of array

**Fix**:
```bash
# Check API response format
curl -H "Accept: application/json" http://127.0.0.1:3001/api/auth/user
# Clear browser cache
# Restart client application
```

### Database Connection Errors

**Immediate Action**:
```bash
# Test database connectivity
pg_isready -h $PGHOST -p $PGPORT -U $PGUSER
# Check connection pool
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

**Recovery**:
```bash
# Restart database connection pool
pm2 restart app
# Or scale up database resources
```

## 📊 Incident Documentation Template

```markdown
## Incident Report: AUTH-YYYY-MM-DD-XXX

**Incident Start**: YYYY-MM-DD HH:MM UTC
**Incident End**: YYYY-MM-DD HH:MM UTC
**Severity**: P0/P1/P2/P3
**Impact**: X users affected for Y minutes

### Timeline
- HH:MM - Incident detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix implemented
- HH:MM - Resolution confirmed

### Root Cause
[Detailed explanation]

### Resolution
[Steps taken to resolve]

### Prevention
[Changes to prevent recurrence]

### Lessons Learned
[Key takeaways]
```

## 🔍 Monitoring and Alerting

### Key Metrics to Monitor
```javascript
// Authentication success rate
SELECT 
  COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM auth_logs 
WHERE created_at > NOW() - INTERVAL '1 hour';

// Average response time
SELECT AVG(response_time_ms) 
FROM api_logs 
WHERE endpoint = '/api/auth/user' 
AND created_at > NOW() - INTERVAL '1 hour';
```

### Alert Conditions
- Auth success rate < 95% (P1)
- Auth endpoint response time > 5s (P2)
- No successful logins in 10 minutes (P0)
- Database connection failures (P0)

## 🛠️ Prevention Measures

### Regular Maintenance
```bash
# Weekly session cleanup
psql $DATABASE_URL -c "DELETE FROM sessions WHERE expire < NOW();"

# Monthly user audit
psql $DATABASE_URL -c "SELECT email, last_login FROM users WHERE last_login < NOW() - INTERVAL '90 days';"

# Quarterly auth review
# Review OAuth app settings
# Update session secrets
# Security audit of auth flow
```

### Development Best Practices
1. Always test auth changes in development first
2. Use feature flags for auth modifications
3. Monitor auth metrics after deployments
4. Keep auth documentation updated
5. Regular backup of user/session data

## 📞 Escalation Contacts

### Internal Team
- **Primary**: Development team lead
- **Secondary**: DevOps engineer
- **Escalation**: Technical director

### External Dependencies
- **Replit Support**: support@replit.com
- **Database Provider**: [Contact info]
- **Monitoring Service**: [Contact info]

---

## 🔄 Post-Incident Actions

### Immediate (0-24 hours)
- [ ] Document incident in team chat
- [ ] Update monitoring/alerting if needed
- [ ] Create incident report
- [ ] Notify affected users if applicable

### Short-term (1-7 days)
- [ ] Implement additional monitoring
- [ ] Update runbooks based on learnings
- [ ] Schedule team retrospective
- [ ] Update documentation

### Long-term (1-4 weeks)
- [ ] Implement prevention measures
- [ ] Architecture improvements
- [ ] Training/knowledge sharing
- [ ] Process improvements

---

*Last Updated: June 22, 2025*
*Next Review: July 22, 2025*

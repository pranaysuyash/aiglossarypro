# Authentication Quick Reference Guide

## 🚨 Emergency Troubleshooting

### App Not Loading / Blank Page
```bash
# Quick diagnostic
curl http://127.0.0.1:3001/api/auth/user
curl http://127.0.0.1:3001/api/health

# Check server logs for Vite setup
# Look for: "✅ Vite dev server setup complete"

# If 401 errors:
1. Check .env has NODE_ENV=development
2. Restart server: pkill -f "node.*server" && npm run dev
3. Clear browser cache/cookies

# If React app not loading:
1. Verify Vite dev server is running
2. Check for "setupVite" in server logs
3. Ensure development mode is properly detected
```

### Switch Between Auth Modes

| Issue | Solution |
|-------|----------|
| Need local dev | Remove REPLIT_DOMAINS from .env |
| Need production | Add REPLIT_DOMAINS, REPL_ID to .env |
| Force mock auth | Set `features.replitAuthEnabled = false` in config.ts |

## 🔧 Quick Commands

### Development
```bash
# Start with mock auth
NODE_ENV=development npm run dev

# Test auth endpoint
curl http://127.0.0.1:3001/api/auth/user

# Check mock user login
open http://127.0.0.1:3001/api/login
```

### Production
```bash
# Verify auth config
echo $REPLIT_DOMAINS $REPL_ID

# Check production auth
curl https://your-app.replit.app/api/health

# Grant admin access
psql $DATABASE_URL -c "UPDATE users SET is_admin = true WHERE email = 'admin@email.com';"
```

## 📋 Environment Checklist

### Local Development ✅
- [ ] `NODE_ENV=development` in .env
- [ ] REPLIT_DOMAINS empty/missing
- [ ] Database accessible
- [ ] Server starts without auth errors
- [ ] `/api/auth/user` returns dev user
- [ ] Browser console shows no 401 errors

### Production Deployment ✅
- [ ] `NODE_ENV=production` in .env
- [ ] REPLIT_DOMAINS configured
- [ ] REPL_ID configured
- [ ] OAuth app settings match domain
- [ ] HTTPS enabled
- [ ] Admin users granted DB permissions

## 🔍 Debug Patterns

### Console Logs to Look For

**✅ Good (Development)**:
```
✅ Mock authentication setup complete (development mode)
🔓 Development user ensured in database: dev@example.com
🔓 Mock authentication: User logged in as dev@example.com
✅ Vite dev server setup complete
```

**✅ Good (Production)**:
```
✅ Replit authentication setup complete
✅ S3 client initialized
✅ All routes registered successfully
```

**❌ Bad**:
```
Missing required environment variable: REPLIT_DOMAINS
Authentication verification failed
TypeError: t.map is not a function
```

## 🚀 Architecture Overview

```
Environment Detection → Authentication Mode → User Session
     ↓                        ↓                   ↓
Development      →      Mock Auth        →   dev@example.com
Production       →      Replit OAuth     →   Real users
```

## 📞 When to Call for Help

| Scenario | Action |
|----------|--------|
| Following this guide doesn't work | Check files haven't been modified |
| Need new auth provider | Review architecture docs |
| Security concern | Immediate review required |
| Production auth down | Check Replit service status |

## 📁 Key Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `server/middleware/dev/mockAuth.ts` | Mock auth system | Add dev users |
| `server/routes/auth.ts` | Auth endpoints | New auth features |
| `server/config.ts` | Environment detection | New config options |
| `LOCAL_DEV_GUIDE.md` | Developer instructions | Onboarding updates |

---
*Last Updated: June 22, 2025 - Keep this updated when making auth changes!*

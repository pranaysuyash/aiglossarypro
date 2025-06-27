# OAuth End-to-End Test Plan

## 🎯 Test Objective

Verify that the OAuth authentication system works correctly in production while ensuring mock authentication is properly disabled when `NODE_ENV=production`.

## 🧪 Test Environment Setup

### Development Mode (Mock Auth Enabled)
```bash
NODE_ENV=development
REPLIT_AUTH_ENABLED=false
```

### Production Mode (Real OAuth Required)  
```bash
NODE_ENV=production
REPLIT_AUTH_ENABLED=true
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📋 Test Plan

### Phase 1: Mock Auth Verification (Development)

**Test 1.1: Mock Auth Functionality**
- ✅ **Objective**: Verify mock authentication works in development
- **Steps**:
  1. Set `NODE_ENV=development`
  2. Start server with `npm run dev`
  3. Access admin endpoint: `GET /api/admin/stats`
  4. **Expected**: 200 response with mock user logged in
  5. **Verify**: Logs show "Mock authentication: User logged in as dev@example.com"

**Test 1.2: Mock User Admin Access**
- ✅ **Objective**: Verify mock user has admin privileges
- **Steps**:
  1. Access protected admin route: `POST /api/admin/import`
  2. **Expected**: Endpoint accepts request (with proper file upload)
  3. **Verify**: No 403 Forbidden errors
  4. **Verify**: Logs show "Development mode: Granting admin access to dev user"

### Phase 2: Production Auth Disablement

**Test 2.1: Mock Auth Disabled in Production**
- **Objective**: Verify mock auth is disabled when `NODE_ENV=production`
- **Steps**:
  1. Set `NODE_ENV=production`
  2. Set `REPLIT_AUTH_ENABLED=true` 
  3. Start server
  4. Access admin endpoint without auth: `GET /api/admin/stats`
  5. **Expected**: 401 Unauthorized or redirect to OAuth
  6. **Verify**: No mock auth logs appear

**Test 2.2: Real OAuth Required**
- **Objective**: Verify real OAuth providers are required in production
- **Steps**:
  1. Ensure production environment variables set
  2. Access login endpoint: `GET /auth/replit` 
  3. **Expected**: Redirect to Replit OAuth authorization URL
  4. **Verify**: Real OAuth flow initiated

### Phase 3: OAuth Flow Testing

**Test 3.1: Replit OAuth Flow**
- **Objective**: Complete Replit OAuth authentication
- **Steps**:
  1. Navigate to `/auth/replit`
  2. Complete Replit authorization
  3. Verify callback: `/auth/replit/callback`
  4. **Expected**: Successful login and session creation
  5. **Verify**: User redirected to dashboard
  6. **Verify**: Session cookie set

**Test 3.2: GitHub OAuth Flow**  
- **Objective**: Complete GitHub OAuth authentication
- **Steps**:
  1. Navigate to `/auth/github`
  2. Complete GitHub authorization
  3. Verify callback: `/auth/github/callback`
  4. **Expected**: Successful login and session creation

**Test 3.3: Google OAuth Flow**
- **Objective**: Complete Google OAuth authentication  
- **Steps**:
  1. Navigate to `/auth/google`
  2. Complete Google authorization
  3. Verify callback: `/auth/google/callback`
  4. **Expected**: Successful login and session creation

### Phase 4: Admin RBAC Testing

**Test 4.1: Non-Admin User Access**
- **Objective**: Verify non-admin users cannot access admin endpoints
- **Steps**:
  1. Login with regular user account (no admin role)
  2. Access admin endpoint: `GET /api/admin/stats`
  3. **Expected**: 403 Forbidden response
  4. **Verify**: Error message: "Admin access required"

**Test 4.2: Admin User Access**
- **Objective**: Verify admin users can access admin endpoints
- **Steps**:
  1. Login with admin user account
  2. Access admin endpoint: `GET /api/admin/stats`
  3. **Expected**: 200 response with admin data
  4. **Verify**: Full admin functionality available

**Test 4.3: Frontend Admin Page Access**
- **Objective**: Verify frontend enforces admin RBAC
- **Steps**:
  1. Login as non-admin user
  2. Navigate to `/admin` page
  3. **Expected**: Access denied or redirect
  4. **Verify**: Admin UI components hidden

## 🔧 Test Execution Commands

### Development Testing
```bash
# Start in development mode
NODE_ENV=development npm run dev

# Test mock auth endpoint
curl -X GET http://localhost:3001/api/admin/stats

# Test admin import (with file)
curl -X POST http://localhost:3001/api/admin/import -F 'file=@data/row1.xlsx'
```

### Production Testing  
```bash
# Start in production mode
NODE_ENV=production npm start

# Test OAuth redirect
curl -X GET http://localhost:3001/auth/replit

# Test protected endpoint (should fail)
curl -X GET http://localhost:3001/api/admin/stats
```

## ✅ Success Criteria

### Development Mode
- ✅ Mock authentication works for all admin endpoints
- ✅ Mock user has admin privileges
- ✅ No real OAuth required
- ✅ All admin functionality accessible

### Production Mode  
- ✅ Mock authentication completely disabled
- ✅ Real OAuth providers required for authentication
- ✅ Admin RBAC properly enforced
- ✅ 403 errors returned for unauthorized access

## 🚨 Known Considerations

### For Testing Phase
- **Mock auth remains enabled** for development and testing
- Real OAuth testing requires valid provider credentials
- Frontend RBAC testing requires browser-based testing

### For Production Deployment
- Mock auth will be automatically disabled when `NODE_ENV=production`
- All OAuth providers must be properly configured
- Admin users must be designated in the database

## 📝 Test Results Log

**Test Date**: _To be filled during execution_

**Development Mode Tests**:
- Test 1.1: ✅ Mock auth working
- Test 1.2: ✅ Mock admin access working

**Production Mode Tests**:
- Test 2.1: ⏳ To be tested with `NODE_ENV=production`
- Test 2.2: ⏳ To be tested with real OAuth credentials

**OAuth Flow Tests**:
- Test 3.1: ⏳ Requires Replit OAuth setup
- Test 3.2: ⏳ Requires GitHub OAuth setup  
- Test 3.3: ⏳ Requires Google OAuth setup

**Admin RBAC Tests**:
- Test 4.1: ⏳ To be tested with non-admin user
- Test 4.2: ⏳ To be tested with admin user
- Test 4.3: ⏳ Requires frontend testing

---

*This test plan ensures OAuth authentication works correctly while maintaining development testing capabilities.*
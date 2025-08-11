# Domain Strategy & Environment Plan - AIGlossaryPro

## 🎯 Three-Tier Environment Strategy

### 1. **Development/Testing** (Current EC2)
- **Domain**: `test.aiglossary.com`
- **IP**: 52.0.112.85 (Elastic IP)
- **Purpose**: Testing new features, experiments
- **SSL**: Let's Encrypt (free)
- **Cost**: ~$15-20/month (EC2 t3.small)
- **Status**: ✅ Ready (just need DNS)

### 2. **Staging** (Future)
- **Domain**: `staging.aiglossary.com`
- **Purpose**: Pre-production testing, client demos
- **Options**:
  - AWS ECS (if you need auto-scaling)
  - Another EC2 instance
  - Vercel/Netlify (frontend) + AWS Lambda (API)

### 3. **Production** (Future)
- **Domain**: `aiglossary.com` and `www.aiglossary.com`
- **Purpose**: Live production site
- **Recommended**: CloudFront + S3 (frontend) + ECS/Lambda (API)
- **Why**: Better performance, auto-scaling, global CDN

---

## 📋 DNS Configuration Plan

### Step 1: Configure Test Environment (Do Now)
```dns
test.aiglossary.com    A    52.0.112.85    (TTL: 300)
```

### Step 2: Reserve Production (Do Now)
```dns
aiglossary.com         A    52.0.112.85    (TTL: 3600) # Temporary
www.aiglossary.com     CNAME aiglossary.com (TTL: 3600)
staging.aiglossary.com A    52.0.112.85    (TTL: 300) # Can share with test initially
```

### Step 3: Future Production Migration
```dns
aiglossary.com         A    [CloudFront or new IP]
www.aiglossary.com     CNAME d1234567.cloudfront.net
test.aiglossary.com    A    52.0.112.85 (keep as-is)
```

---

## 🚀 Implementation Steps

### Phase 1: Current EC2 as Test Environment (Now)
1. ✅ EC2 with Elastic IP (52.0.112.85)
2. ✅ Self-signed SSL working
3. ⏳ Add DNS A record for test.aiglossary.com → 52.0.112.85
4. ⏳ Get Let's Encrypt cert for test.aiglossary.com
5. ⏳ Update app to use https://test.aiglossary.com

### Phase 2: Staging Environment (Later)
1. Clone EC2 setup or use container service
2. Point staging.aiglossary.com to new resource
3. Use for client demos and final testing

### Phase 3: Production Launch (Future)
1. Set up CloudFront distribution
2. Deploy frontend to S3
3. Deploy API to ECS Fargate or Lambda
4. Point aiglossary.com to CloudFront
5. Keep test.aiglossary.com on EC2 for development

---

## 💰 Cost Optimization

### Current (Test Only)
- EC2 t3.small: ~$15/month
- Elastic IP: Free (while running)
- **Total**: ~$15-20/month

### Future (All Environments)
- Test (EC2): ~$15/month
- Staging (shared or container): ~$10-20/month
- Production (CloudFront+S3+Lambda): ~$10-50/month (traffic-based)
- **Total**: ~$35-85/month

### Alternative: Vercel/Netlify for Frontend
- Test: Free tier
- Staging: Free tier
- Production: $20/month Pro plan
- API stays on AWS
- **Total**: ~$35-40/month

---

## 🔒 SSL Strategy

### Test Environment (test.aiglossary.com)
```bash
# After DNS is configured
sudo certbot --nginx -d test.aiglossary.com --agree-tos --email your-email@example.com
```

### Production (aiglossary.com)
- CloudFront: Free SSL included
- Or: Let's Encrypt with auto-renewal

---

## 🛠️ Environment Variables per Environment

### Test (.env.test)
```env
VITE_API_BASE_URL=https://test.aiglossary.com/api
VITE_ENV=test
```

### Staging (.env.staging)
```env
VITE_API_BASE_URL=https://staging.aiglossary.com/api
VITE_ENV=staging
```

### Production (.env.production)
```env
VITE_API_BASE_URL=https://api.aiglossary.com
VITE_ENV=production
```

---

## 📝 Why This Strategy Works

1. **EC2 as Permanent Test**: Always have a place to experiment
2. **No Downtime**: Can test everything before production
3. **Cost Effective**: Reuse EC2 for multiple purposes
4. **Scalable**: Easy to add staging/production later
5. **Fallback Ready**: If production fails, can quickly point to EC2

---

## 🎯 Next Steps

1. **Configure DNS**: Add A record for test.aiglossary.com → 52.0.112.85
2. **Get Let's Encrypt Cert**: Run certbot for test.aiglossary.com
3. **Update Frontend**: Change API URL to https://test.aiglossary.com/api
4. **Document Everything**: Keep this strategy updated

---

## 🚨 Important Notes

- **Keep EC2 as test**: Don't use it for production long-term
- **Elastic IP**: Keep it - it's your permanent test environment
- **Backups**: Always backup before major changes
- **DNS TTL**: Keep test environment TTL low (300s) for quick changes

---

**Status**: Ready to implement Phase 1
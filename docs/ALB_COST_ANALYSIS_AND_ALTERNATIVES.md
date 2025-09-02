# ALB Cost Analysis and Direct CloudFront → EC2 Alternative

**Date**: September 2, 2025  
**Purpose**: Analyze ALB costs vs benefits and document direct CloudFront → EC2 setup

---

## 💰 Current Cost Analysis

### Monthly ALB Costs
- **Base Hourly Rate**: $0.0225/hour = $16.20/month (720 hours)
- **LCU (Load Balancer Capacity Unit)**: $0.008/LCU-hour
- **Estimated LCUs**: ~10-20 LCUs/month (low traffic)
- **LCU Cost**: ~$5.76-11.52/month
- **Total ALB Cost**: ~$22-28/month

### Current Architecture Total Cost
- **EC2 t3.small**: ~$15-18/month
- **ALB**: ~$22-28/month  
- **CloudFront**: ~$0.50/month
- **S3**: ~$1-2/month
- **Total**: ~$39-49/month

---

## 🎯 Direct CloudFront → EC2 Alternative

### Cost Savings
- **Remove ALB**: Save $22-28/month
- **New Total**: ~$17-21/month (54% cost reduction)
- **Annual Savings**: ~$264-336/year

### Architecture Change
```
Current:  CloudFront → ALB → EC2
Proposed: CloudFront → EC2 (direct)
```

### Implementation Requirements

#### 1. CloudFront Origin Update
```json
{
  "Id": "EC2-Direct",
  "DomainName": "52.0.112.85",
  "CustomOriginConfig": {
    "HTTPPort": 8080,
    "HTTPSPort": 8080,
    "OriginProtocolPolicy": "http-only"
  }
}
```

#### 2. Security Group Updates
```bash
# Allow CloudFront IP ranges to EC2 port 8080
# CloudFront IP ranges are dynamic, so allow broader HTTP access
```

#### 3. Cache Behavior Updates
```json
{
  "PathPattern": "/api/*",
  "TargetOriginId": "EC2-Direct",
  "ViewerProtocolPolicy": "redirect-to-https",
  "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
  "OriginRequestPolicyId": "216adef6-5c7f-47e4-b989-5492eafa07d3"
}
```

---

## ⚖️ Pros and Cons Analysis

### ✅ Pros of Direct CloudFront → EC2

#### Cost Benefits
- **54% cost reduction**: $39 → $17/month
- **Simple architecture**: Fewer moving parts
- **No ALB complexity**: Direct routing

#### Performance Benefits
- **Reduced latency**: One less hop (ALB eliminated)
- **Simpler troubleshooting**: Fewer components to debug
- **Direct control**: No ALB configuration dependencies

### ❌ Cons of Direct CloudFront → EC2

#### Reliability Concerns
- **No health checks**: ALB provides automatic health monitoring
- **No failover**: Single point of failure at EC2 level
- **IP address changes**: Must update CloudFront when EC2 restarts

#### Scaling Limitations
- **No load balancing**: Cannot easily add more EC2 instances
- **Manual scaling**: Would need to reconfigure CloudFront for multiple instances
- **No sticky sessions**: ALB provides session affinity features

#### Security Considerations
- **Broader exposure**: EC2 directly accessible from CloudFront IPs
- **Less granular control**: ALB provides additional security layers
- **SSL termination**: Must handle at CloudFront level only

---

## 🚨 Risk Assessment

### High Risk Items
1. **EC2 Instance Failure**: No automatic failover without ALB
2. **IP Address Changes**: CloudFront config breaks when EC2 restarts with new IP
3. **Security Exposure**: Direct EC2 access from internet (via CloudFront)

### Medium Risk Items
1. **Scaling Challenges**: Difficult to add capacity without ALB
2. **Monitoring Gaps**: Loss of ALB-level metrics and health checks
3. **Troubleshooting Complexity**: Less visibility into request flow

### Low Risk Items
1. **Performance Impact**: Minimal difference for low-traffic scenarios
2. **Configuration Drift**: Direct setup is simpler to maintain
3. **Cost Overruns**: Eliminated with direct approach

---

## 📋 Implementation Steps (If Proceeding)

### Phase 1: Preparation
1. **Create CloudFront configuration backup**
2. **Test EC2 direct access thoroughly**
3. **Update security groups for broader access**
4. **Document rollback procedures**

### Phase 2: CloudFront Update
1. **Add new EC2 direct origin**
2. **Update /api/* cache behavior to use EC2 origin**
3. **Test all API endpoints**
4. **Monitor for 24 hours**

### Phase 3: ALB Cleanup (After Verification)
1. **Remove ALB origin from CloudFront**
2. **Delete ALB and target group**
3. **Clean up security group rules**
4. **Update monitoring and alerts**

---

## 🔄 Rollback Plan

### If Direct Connection Fails
```bash
# 1. Restore CloudFront configuration
aws cloudfront update-distribution --id ESF8YR50LSGU8 --distribution-config file://backup-configs/cloudfront-config-backup-*.json --if-match CURRENT_ETAG

# 2. Verify ALB is still running
aws elbv2 describe-load-balancers --names aiglossarypro-api-alb

# 3. Re-register EC2 with ALB (if deregistered)
aws elbv2 register-targets --target-group-arn arn:aws:elasticloadbalancing:us-east-1:927289246324:targetgroup/aiglossarypro-api-tg/6ffdfcb32339ab5d --targets Id=172.31.46.188,Port=8080

# 4. Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/api/*"

# 5. Test endpoints
curl https://d1m7nnfj3im4kp.cloudfront.net/api/health
```

---

## 🎪 Alternative Approaches

### 1. Scheduled ALB (Partial Savings)
- Keep ALB but implement start/stop schedule
- Save ~60% of ALB costs during off-hours
- More complex automation required

### 2. Smaller ALB Type
- ALB pricing is fixed regardless of size
- No cost savings available through downsizing

### 3. Elastic Beanstalk
- Managed ALB + EC2 solution
- Potentially similar costs with more automation
- Migration effort required

---

## 📊 Recommendation

### For Low-Traffic Production (Current State)
**Recommend: Proceed with Direct CloudFront → EC2**

#### Reasons:
1. **Cost savings are significant**: 54% reduction ($264-336/year)
2. **Risk is manageable**: Low traffic means less impact if issues occur
3. **Easy rollback**: ALB can be recreated if needed
4. **Simplicity**: Fewer components to maintain

### Risk Mitigation Strategies
1. **Monitor EC2 health closely**: Set up CloudWatch alarms
2. **Automate IP updates**: Script to update CloudFront on EC2 restart
3. **Document procedures**: Clear runbooks for troubleshooting
4. **Regular backups**: Keep configuration backups current

---

## ⏰ Timeline for Implementation

### Week 1: Preparation
- [ ] Complete documentation and backups
- [ ] Test EC2 security group changes
- [ ] Create automation scripts for IP updates
- [ ] Set up enhanced monitoring

### Week 2: Implementation
- [ ] Update CloudFront configuration during low-traffic window
- [ ] Monitor for 48 hours before ALB cleanup
- [ ] Remove ALB after successful validation
- [ ] Update documentation and monitoring

### Ongoing: Maintenance
- [ ] Weekly health checks
- [ ] Monthly cost reviews
- [ ] Quarterly architecture reviews

---

**Summary**: Direct CloudFront → EC2 offers significant cost savings with manageable risks for low-traffic scenarios. Proper preparation and monitoring are essential for success.**
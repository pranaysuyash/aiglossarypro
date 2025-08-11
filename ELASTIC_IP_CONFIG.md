# Elastic IP Configuration - AIGlossaryPro

## ✅ Configuration Details

**Elastic IP**: `52.0.112.85`  
**Allocation ID**: `eipalloc-09ca6e1e822a77b1e`  
**Association ID**: `eipassoc-07d4de8d651420a93`  
**EC2 Instance**: `i-045ff31e850f8b78d`  
**Created**: August 11, 2025  

## 🌐 Access URLs

- **Frontend**: http://52.0.112.85/
- **API Health**: http://52.0.112.85/api/health
- **SSH Access**: `ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85`

## 💰 Cost Information

- **While Running**: FREE (no additional charge when associated with running instance)
- **While Stopped**: ~$0.005/hour ($3.60/month if instance is stopped)
- **Best Practice**: Keep instance running or release the Elastic IP if stopping for extended periods

## 🔧 Management Commands

### Check Elastic IP Status
```bash
aws ec2 describe-addresses --allocation-ids eipalloc-09ca6e1e822a77b1e
```

### Disassociate (if needed)
```bash
aws ec2 disassociate-address --association-id eipassoc-07d4de8d651420a93
```

### Release (to stop charges when not needed)
```bash
# WARNING: You'll lose this IP address permanently
aws ec2 release-address --allocation-id eipalloc-09ca6e1e822a77b1e
```

### Re-associate (if disassociated)
```bash
aws ec2 associate-address --instance-id i-045ff31e850f8b78d --allocation-id eipalloc-09ca6e1e822a77b1e
```

## 📝 Benefits

1. **Permanent Address**: IP won't change when instance stops/starts
2. **DNS Friendly**: Can point domain names to this IP
3. **No Downtime**: Users always access the same IP
4. **Easy Deployment**: No need to update configs when restarting EC2

## ⚠️ Important Notes

- This IP is permanently assigned to your AWS account until released
- If you stop the EC2 instance, you'll be charged ~$0.005/hour for the unused Elastic IP
- To avoid charges, either keep the instance running or release the Elastic IP when not needed
- Once released, you cannot get the same IP back

---

**Status**: ✅ Active and Associated with EC2 Instance
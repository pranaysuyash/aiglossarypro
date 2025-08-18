# AWS Credentials Configuration

**⚠️ CONFIDENTIAL DOCUMENT - DO NOT COMMIT TO GIT ⚠️**

## AWS Account Information

**Account ID**: 927289246324  
**Default Region**: us-east-1 (N. Virginia)  
**Profile**: Default AWS CLI profile  

## EC2 Instance Details

### Primary Production Instance
- **Instance ID**: i-045ff31e850f8b78d
- **Public IP**: 52.0.112.85 (Elastic IP allocated)  
- **Instance Type**: t3.small
- **AMI**: Amazon Linux 2023
- **Key Pair**: aiglossarypro-ec2
- **SSH Key Location**: ~/.ssh/aiglossarypro-ec2.pem
- **Security Group**: Default with custom rules for 22, 80, 443, 8080

### SSH Access
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85
```

## AWS Services Used

### 1. Elastic Compute Cloud (EC2)
- **Purpose**: Primary application server
- **Configuration**: t3.small with 2GB RAM, 20GB EBS storage
- **Network**: VPC with public subnet
- **Monitoring**: CloudWatch basic monitoring enabled

### 2. Elastic IP Address (EIP)
- **Allocation ID**: eipalloc-0123456789abcdef (example)
- **Purpose**: Static IP for production stability
- **Association**: Attached to i-045ff31e850f8b78d

### 3. Security Groups
- **Name**: Default + custom rules
- **Inbound Rules**:
  - SSH (22): 0.0.0.0/0
  - HTTP (80): 0.0.0.0/0  
  - HTTPS (443): 0.0.0.0/0
  - Custom (8080): 0.0.0.0/0 (API server)

### 4. Key Pairs
- **Name**: aiglossarypro-ec2
- **Type**: RSA 2048-bit
- **Private Key**: ~/.ssh/aiglossarypro-ec2.pem (chmod 400)

## IAM Permissions Used

### EC2 Permissions
- EC2 full access for instance management
- EIP allocation and association
- Security group management
- Key pair management

### Monitoring & Logging
- CloudWatch basic metrics
- VPC Flow Logs (if enabled)
- CloudTrail API logging

## AWS CLI Configuration

The deployment scripts use the default AWS CLI profile configured with:

```bash
aws configure list
```

**Access Keys**: Managed through AWS CLI configuration
**Secret Keys**: Stored in ~/.aws/credentials (not committed)
**Region**: us-east-1
**Output Format**: json

## Cost Monitoring

### Current Monthly Costs
- **EC2 t3.small**: ~$15/month (24/7 operation)
- **Elastic IP**: Free (while associated)
- **EBS Storage (20GB)**: ~$2/month
- **Data Transfer**: ~$1-5/month (varies by usage)

**Total Estimated**: $18-22/month

### Cost Optimization Notes
- Instance can be stopped during low usage periods
- EBS snapshots for backup (additional cost)
- CloudWatch detailed monitoring is optional ($3.50/month)

## Security Best Practices Applied

### Network Security
- ✅ SSH key-based authentication only
- ✅ Security groups with minimal required ports
- ✅ Elastic IP for consistent access
- ✅ VPC with proper subnet configuration

### Instance Security  
- ✅ Regular Amazon Linux 2023 updates
- ✅ Non-root user (ec2-user) for SSH
- ✅ Private key with restricted permissions (400)
- ✅ No password authentication

### Application Security
- ✅ Environment variables for sensitive config
- ✅ HTTPS configuration ready
- ✅ Database connections use SSL
- ✅ API keys stored in environment files

## Backup Strategy

### Instance Backup
- **AMI Snapshots**: Create before major changes
- **EBS Snapshots**: Weekly automated snapshots
- **Application Data**: Git repository + database backups

### Recovery Procedures
1. **Instance Recovery**: Launch from latest AMI
2. **Data Recovery**: Restore from EBS snapshots
3. **Application Recovery**: Git clone + pnpm install
4. **Configuration Recovery**: Restore environment files

## Maintenance Schedule

### Regular Tasks
- **Weekly**: OS security updates
- **Monthly**: Cost review and optimization
- **Quarterly**: Security audit and access review
- **As Needed**: Instance size optimization

### Update Procedures
```bash
# Connect to instance
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85

# Update system packages
sudo yum update -y

# Restart services if required
sudo systemctl restart nginx
pm2 restart all
```

## Troubleshooting Common Issues

### SSH Connection Issues
- Verify security group allows port 22
- Check private key permissions (chmod 400)
- Confirm Elastic IP association

### Application Access Issues  
- Verify security group allows ports 80, 443, 8080
- Check nginx and PM2 service status
- Review application logs: `pm2 logs`

### Cost Overruns
- Stop instance during maintenance windows
- Review CloudWatch billing alerts
- Optimize instance size if needed

## Emergency Contacts

### AWS Support
- **Plan**: Basic (no paid support)
- **Documentation**: https://docs.aws.amazon.com/
- **Community**: AWS Forums and Stack Overflow

### Account Recovery
- **Root Account**: Secured with MFA
- **Billing Issues**: AWS Billing Console
- **Security Issues**: AWS Trust & Safety

## Change Log

### 2025-08-18
- Created initial documentation
- Configured t3.small instance for production
- Allocated Elastic IP for static addressing
- Set up security groups for web application

---

**Last Updated**: August 18, 2025  
**Next Review**: September 18, 2025  
**Document Version**: 1.0
# Database Backup Strategy - Neon PostgreSQL

## 🛡️ Neon Built-in Features

Neon provides automatic database protection:

### Automatic Backups
- **Point-in-time recovery**: Up to 7 days (free tier)
- **Continuous backups**: Every transaction is backed up
- **Zero data loss**: WAL (Write-Ahead Logging) ensures durability

### Branching (Recommended)
```bash
# Create a backup branch before major changes
neon branches create --name backup-$(date +%Y%m%d)

# List all branches
neon branches list

# Restore from branch if needed
neon branches set-primary backup-20250116
```

## 📋 Backup Strategy

### 1. Daily Automated Backups

Create a backup script `scripts/backup-database.js`:

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFile = `backups/aiglossary-${timestamp}.sql`;
  
  try {
    // Create backup using pg_dump
    await execAsync(
      `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`
    );
    
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Optional: Upload to S3
    if (process.env.AWS_ACCESS_KEY_ID) {
      await execAsync(
        `aws s3 cp ${backupFile} s3://${process.env.S3_BUCKET_NAME}/backups/`
      );
      console.log(`☁️  Backup uploaded to S3`);
    }
    
    // Clean up old local backups (keep last 7 days)
    await execAsync(
      `find backups -name "*.sql" -mtime +7 -delete`
    );
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();
```

### 2. Pre-deployment Backups

Add to `package.json`:

```json
{
  "scripts": {
    "backup": "node scripts/backup-database.js",
    "deploy": "npm run backup && npm run build && npm run migrate"
  }
}
```

### 3. Manual Backup Commands

```bash
# Quick backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Schema only
pg_dump $DATABASE_URL --schema-only > schema-backup.sql

# Data only
pg_dump $DATABASE_URL --data-only > data-backup.sql
```

## 🔄 Restore Procedures

### From Neon Branch
```bash
# List available branches
neon branches list

# Restore from branch
neon branches set-primary branch-name
```

### From SQL Backup
```bash
# Restore full backup
psql $DATABASE_URL < backup-20250116.sql

# Restore compressed backup
gunzip -c backup-20250116.sql.gz | psql $DATABASE_URL
```

### Disaster Recovery
1. Create new Neon project
2. Update DATABASE_URL in environment
3. Restore from latest backup
4. Run migrations to ensure schema is current

## 📊 Backup Schedule

### Recommended Schedule
- **Continuous**: Neon automatic backups (built-in)
- **Daily**: Automated script at 2 AM
- **Weekly**: Full backup to S3 on Sundays
- **Before Deploy**: Automatic backup in deployment pipeline
- **Manual**: Before major database changes

### Retention Policy
- **Neon backups**: 7 days (free) / 30 days (pro)
- **S3 backups**: 30 days
- **Local backups**: 7 days

## 🚨 Monitoring & Alerts

### Health Checks
```javascript
// Add to monitoring endpoint
app.get('/api/health/backup', async (req, res) => {
  const lastBackup = await getLastBackupTime();
  const hoursSinceBackup = (Date.now() - lastBackup) / 3600000;
  
  if (hoursSinceBackup > 24) {
    return res.status(500).json({
      status: 'warning',
      message: 'No backup in last 24 hours',
      lastBackup
    });
  }
  
  res.json({
    status: 'healthy',
    lastBackup,
    nextBackup: getNextBackupTime()
  });
});
```

### Alert Configuration
- Alert if backup fails
- Alert if no backup in 24 hours
- Alert if backup size changes significantly

## 🔐 Security

### Backup Encryption
```bash
# Encrypt backup
openssl enc -aes-256-cbc -in backup.sql -out backup.sql.enc

# Decrypt backup
openssl enc -d -aes-256-cbc -in backup.sql.enc -out backup.sql
```

### Access Control
- Limit backup access to admin users only
- Use IAM roles for S3 access
- Rotate encryption keys quarterly

## 📝 Testing Backups

### Monthly Restore Test
1. Create test database
2. Restore latest backup
3. Verify data integrity
4. Run application tests
5. Document results

### Test Script
```bash
#!/bin/bash
# test-restore.sh

TEST_DB="postgresql://test_restore_db"
BACKUP_FILE=$1

echo "Testing restore of $BACKUP_FILE"
psql $TEST_DB < $BACKUP_FILE

# Run integrity checks
psql $TEST_DB -c "SELECT COUNT(*) FROM users;"
psql $TEST_DB -c "SELECT COUNT(*) FROM terms;"

echo "Restore test completed"
```

## 🛠️ Tools & Automation

### GitHub Actions Backup
```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL > backup.sql
          
      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl private --follow-symlinks
        env:
          AWS_S3_BUCKET: ${{ secrets.S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## ✅ Backup Checklist

### Initial Setup
- [ ] Enable Neon point-in-time recovery
- [ ] Create backup scripts
- [ ] Set up S3 bucket for backups
- [ ] Configure automated backups
- [ ] Test restore procedure

### Ongoing Maintenance
- [ ] Monitor backup success
- [ ] Test restores monthly
- [ ] Review backup size trends
- [ ] Update retention policies
- [ ] Document any issues

## 📞 Emergency Contacts

- **Neon Support**: support@neon.tech
- **Database Admin**: [Your contact]
- **Backup Monitoring**: [Alert email]

## 🎯 Key Metrics

- **RPO** (Recovery Point Objective): < 1 hour
- **RTO** (Recovery Time Objective): < 30 minutes
- **Backup Success Rate**: > 99.9%
- **Restore Test Success**: 100%

---

Remember: A backup is only as good as your last successful restore test! 🔒
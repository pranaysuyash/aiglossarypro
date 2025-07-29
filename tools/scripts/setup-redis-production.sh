#!/bin/bash

# Production Redis Setup Script
# This script configures Redis for production deployment

echo "🔧 Setting up Redis for Production"
echo "================================="

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis is not installed. Installing Redis..."
    
    # Install Redis based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y redis-server
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install redis
    else
        echo "❌ Unsupported operating system. Please install Redis manually."
        exit 1
    fi
    
    echo "✅ Redis installed successfully"
fi

# Create Redis configuration directory
sudo mkdir -p /etc/redis
sudo mkdir -p /var/lib/redis
sudo mkdir -p /var/log/redis

# Create production Redis configuration
echo "📝 Creating production Redis configuration..."

sudo tee /etc/redis/redis.conf > /dev/null << 'EOF'
# Redis Production Configuration for AI Glossary Pro

# Network Configuration
bind 127.0.0.1
port 6379
protected-mode yes
timeout 0
tcp-keepalive 300

# General Configuration
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# Persistence Configuration
# RDB Snapshots
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF (Append Only File) Configuration
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Lazy Freeing
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no

# Security
# requirepass your-strong-password-here
# rename-command FLUSHDB ""
# rename-command FLUSHALL ""
# rename-command EVAL ""
# rename-command DEBUG ""
# rename-command SHUTDOWN SHUTDOWN_AIGLOSSARY

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency Monitor
latency-monitor-threshold 100

# Client Configuration
maxclients 10000

# Advanced Configuration
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF

# Create systemd service file
echo "🔧 Creating systemd service..."

sudo tee /etc/systemd/system/redis-aiglossary.service > /dev/null << 'EOF'
[Unit]
Description=Redis In-Memory Data Store for AI Glossary Pro
After=network.target

[Service]
User=redis
Group=redis
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/bin/redis-cli shutdown
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Create Redis user and set permissions
echo "👤 Setting up Redis user and permissions..."

sudo useradd --system --home /var/lib/redis --shell /bin/false redis 2>/dev/null || true
sudo chown -R redis:redis /var/lib/redis
sudo chown -R redis:redis /var/log/redis
sudo chmod 750 /var/lib/redis
sudo chmod 750 /var/log/redis
sudo chmod 640 /etc/redis/redis.conf

# Enable and start Redis service
echo "🚀 Starting Redis service..."

sudo systemctl daemon-reload
sudo systemctl enable redis-aiglossary
sudo systemctl start redis-aiglossary

# Wait for Redis to start
sleep 3

# Check Redis status
if sudo systemctl is-active --quiet redis-aiglossary; then
    echo "✅ Redis service is running"
else
    echo "❌ Redis service failed to start"
    sudo systemctl status redis-aiglossary
    exit 1
fi

# Create Redis monitoring script
echo "📊 Creating Redis monitoring script..."

sudo tee /usr/local/bin/redis-monitor.sh > /dev/null << 'EOF'
#!/bin/bash

# Redis Monitoring Script for AI Glossary Pro

echo "Redis Status Report - $(date)"
echo "================================"

# Check if Redis is running
if ! pgrep -f redis-server > /dev/null; then
    echo "❌ Redis is not running"
    exit 1
fi

# Connect to Redis and get info
redis-cli --version
echo ""

echo "📊 Redis Info:"
echo "=============="
redis-cli INFO server | grep -E "(redis_version|os|arch|uptime_in_seconds|connected_clients)"
echo ""

echo "💾 Memory Usage:"
echo "==============="
redis-cli INFO memory | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human|mem_fragmentation_ratio)"
echo ""

echo "⚡ Performance:"
echo "=============="
redis-cli INFO stats | grep -E "(total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses)"
echo ""

echo "🔑 Keyspace Info:"
echo "================="
redis-cli INFO keyspace
echo ""

echo "🐌 Slow Log (last 10):"
echo "====================="
redis-cli SLOWLOG GET 10
echo ""

echo "🔥 Top Keys by Memory:"
echo "===================="
redis-cli --bigkeys
EOF

chmod +x /usr/local/bin/redis-monitor.sh

# Create Redis backup script
echo "💾 Creating Redis backup script..."

sudo tee /usr/local/bin/redis-backup.sh > /dev/null << 'EOF'
#!/bin/bash

# Redis Backup Script for AI Glossary Pro

BACKUP_DIR="/var/backups/redis"
BACKUP_FILE="redis-backup-$(date +%Y%m%d-%H%M%S).rdb"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "📦 Creating Redis backup..."
redis-cli BGSAVE
sleep 2

# Wait for background save to complete
while [ $(redis-cli LASTSAVE) -eq $(redis-cli LASTSAVE) ]; do
    sleep 1
done

# Copy the RDB file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "🗜️  Backup compressed: $BACKUP_DIR/$BACKUP_FILE.gz"
    
    # Clean up old backups
    find $BACKUP_DIR -name "redis-backup-*.rdb.gz" -mtime +$RETENTION_DAYS -delete
    echo "🧹 Old backups cleaned (>$RETENTION_DAYS days)"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF

chmod +x /usr/local/bin/redis-backup.sh

# Create cron job for daily backups
echo "⏰ Setting up daily backups..."

(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/redis-backup.sh >> /var/log/redis/backup.log 2>&1") | crontab -

# Test Redis connection
echo "🧪 Testing Redis connection..."

if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis connection test successful"
else
    echo "❌ Redis connection test failed"
    exit 1
fi

# Configure Redis for Node.js application
echo "🔧 Configuring Redis for Node.js application..."

# Create environment variables file
cat > /tmp/redis-env-vars << 'EOF'
# Redis Configuration for AI Glossary Pro
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Redis URL format (alternative to individual settings)
# REDIS_URL=redis://localhost:6379/0

# Redis Cache Settings
ENABLE_REDIS_CACHE=true
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=aiglossary:

# Redis Job Queue Settings (separate database)
REDIS_QUEUE_DB=1
REDIS_QUEUE_PREFIX=queue:

# Redis Performance Settings
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_RETRY_DELAY=100
REDIS_MAX_RETRIES=3
EOF

echo "📝 Redis environment variables template created at /tmp/redis-env-vars"
echo "   Add these to your .env.production file"

# Security recommendations
echo ""
echo "🔒 Security Recommendations:"
echo "============================"
echo "1. Set a strong password: uncomment and set 'requirepass' in /etc/redis/redis.conf"
echo "2. Configure firewall to only allow access from application servers"
echo "3. Enable SSL/TLS if Redis is accessed over network"
echo "4. Regularly monitor Redis logs: tail -f /var/log/redis/redis-server.log"
echo "5. Set up log rotation for Redis logs"

# Performance tuning recommendations
echo ""
echo "⚡ Performance Tuning:"
echo "====================="
echo "1. Monitor memory usage: redis-cli INFO memory"
echo "2. Adjust maxmemory based on available RAM"
echo "3. Consider Redis clustering for high availability"
echo "4. Monitor slow queries: redis-cli SLOWLOG GET"
echo "5. Use Redis monitoring tools in production"

# Final status check
echo ""
echo "📊 Final Status Check:"
echo "===================="
echo "Redis Service Status:"
sudo systemctl status redis-aiglossary --no-pager

echo ""
echo "Redis Process:"
ps aux | grep redis-server | grep -v grep

echo ""
echo "Redis Connection:"
redis-cli ping

echo ""
echo "Redis Memory Usage:"
redis-cli INFO memory | grep used_memory_human

echo ""
echo "🎉 Redis Production Setup Complete!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo "1. Add Redis environment variables to .env.production"
echo "2. Set Redis password in /etc/redis/redis.conf"
echo "3. Configure firewall rules"
echo "4. Test application with Redis enabled"
echo "5. Set up monitoring and alerting"
echo ""
echo "🔧 Useful Commands:"
echo "- Monitor Redis: /usr/local/bin/redis-monitor.sh"
echo "- Backup Redis: /usr/local/bin/redis-backup.sh"
echo "- Check logs: tail -f /var/log/redis/redis-server.log"
echo "- Redis CLI: redis-cli"
echo "- Service control: sudo systemctl [start|stop|restart|status] redis-aiglossary"
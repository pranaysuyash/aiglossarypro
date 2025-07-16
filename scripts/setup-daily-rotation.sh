#!/bin/bash

# Setup Daily Term Rotation Service
# This script sets up the daily term rotation to run automatically

echo "🚀 Setting up AI Glossary Pro Daily Term Rotation"
echo "================================================="

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir -p logs
    echo "✅ Created logs directory"
fi

# Create cache directory if it doesn't exist
if [ ! -d "cache/daily-terms" ]; then
    mkdir -p cache/daily-terms
    echo "✅ Created cache directory"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed"
fi

# Option 1: Using PM2 with cron restart (Recommended)
echo ""
echo "🔄 Setting up PM2 cron job..."
pm2 start ecosystem.config.js --only daily-term-rotation
pm2 save
echo "✅ PM2 cron job configured"

# Option 2: Using system cron as fallback
echo ""
echo "🕐 Setting up system cron as fallback..."

# Create cron job script
cat > /tmp/daily-term-rotation-cron << 'EOF'
#!/bin/bash
cd /path/to/AIGlossaryPro
node scripts/daily-term-rotation.js >> logs/daily-rotation-cron.log 2>&1
EOF

chmod +x /tmp/daily-term-rotation-cron

# Add to crontab (commented out by default)
echo "# Daily term rotation for AI Glossary Pro"
echo "# 0 0 * * * /tmp/daily-term-rotation-cron"
echo ""
echo "ℹ️  To enable system cron, run:"
echo "   crontab -e"
echo "   Add: 0 0 * * * /tmp/daily-term-rotation-cron"

# Option 3: Using systemd service
echo ""
echo "🔧 Creating systemd service..."

sudo tee /etc/systemd/system/aiglossary-daily-rotation.service > /dev/null << EOF
[Unit]
Description=AI Glossary Pro Daily Term Rotation
After=network.target

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node $(pwd)/scripts/daily-term-rotation.js
StandardOutput=append:$(pwd)/logs/daily-rotation-systemd.log
StandardError=append:$(pwd)/logs/daily-rotation-systemd.log

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/aiglossary-daily-rotation.timer > /dev/null << EOF
[Unit]
Description=Run AI Glossary Pro Daily Term Rotation
Requires=aiglossary-daily-rotation.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable aiglossary-daily-rotation.timer
sudo systemctl start aiglossary-daily-rotation.timer

echo "✅ Systemd service and timer created"

# Test the rotation script
echo ""
echo "🧪 Testing daily term rotation script..."
if node scripts/daily-term-rotation.js; then
    echo "✅ Daily term rotation test successful"
else
    echo "❌ Daily term rotation test failed"
    exit 1
fi

# Show status
echo ""
echo "📊 Current Status:"
echo "=================="
echo "PM2 Status:"
pm2 status daily-term-rotation

echo ""
echo "Systemd Timer Status:"
sudo systemctl status aiglossary-daily-rotation.timer --no-pager

echo ""
echo "Cache Directory:"
ls -la cache/daily-terms/ | head -5

echo ""
echo "🎉 Daily Term Rotation Setup Complete!"
echo ""
echo "📅 The rotation will run daily at midnight using:"
echo "   1. PM2 cron restart (primary method)"
echo "   2. Systemd timer (backup method)"
echo ""
echo "🔧 Manual Commands:"
echo "   Test: node scripts/daily-term-rotation.js"
echo "   PM2: pm2 restart daily-term-rotation"
echo "   Systemd: sudo systemctl start aiglossary-daily-rotation.service"
echo ""
echo "📝 Logs:"
echo "   PM2: logs/daily-rotation-*.log"
echo "   Systemd: logs/daily-rotation-systemd.log"
echo "   Cron: logs/daily-rotation-cron.log"
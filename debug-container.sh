#!/bin/bash

echo "🔍 DEBUGGING ACTUAL CONTAINER FAILURE"
echo "======================================"

# Step 1: Get the real DATABASE_URL from AWS Secrets
echo "1. Getting actual production secrets..."
DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id aiglossarypro/database --region us-east-1 --query SecretString --output text | jq -r .DATABASE_URL)
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id aiglossarypro/jwt --region us-east-1 --query SecretString --output text | jq -r .JWT_SECRET)
SESSION_SECRET=$(aws secretsmanager get-secret-value --secret-id aiglossarypro/session --region us-east-1 --query SecretString --output text | jq -r .SESSION_SECRET)

echo "✅ Secrets retrieved"

# Step 2: Test the container locally with REAL production environment
echo ""
echo "2. Testing container locally with production environment..."
echo "Image: full-api-20250807-131943"

docker run --rm \
    -e NODE_ENV=production \
    -e PORT=8080 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e REDIS_ENABLED=false \
    -e LOG_LEVEL=debug \
    -e FIREBASE_AUTH_ENABLED=true \
    -e FIREBASE_PROJECT_ID=aiglossarypro \
    -e FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com \
    full-api-20250807-131943 \
    sh -c "node dist/index.js" &

# Let it run for 10 seconds
PID=$!
sleep 10

# Check if it's still running
if ps -p $PID > /dev/null; then
    echo "✅ Container is running!"
    kill $PID
else
    echo "❌ Container exited"
fi

echo ""
echo "3. Let's see the EXACT error:"

# Step 3: Run with full debugging
docker run --rm \
    -e NODE_ENV=production \
    -e PORT=8080 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e REDIS_ENABLED=false \
    -e LOG_LEVEL=debug \
    full-api-20250807-131943 \
    node -e "
    console.log('=== DEBUGGING STARTUP ===');
    console.log('Node version:', process.version);
    console.log('Working directory:', process.cwd());
    console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
        SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'MISSING'
    });
    
    console.log('=== ATTEMPTING APP START ===');
    try {
        require('./dist/index.js');
    } catch (error) {
        console.error('=== STARTUP ERROR ===');
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
    "

echo ""
echo "4. Check the most recent ECS container logs for actual error:"
STREAM=$(aws logs describe-log-streams \
    --log-group-name /ecs/aiglossarypro-api \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query 'logStreams[0].logStreamName' \
    --output text)

if [ -n "$STREAM" ]; then
    aws logs get-log-events \
        --log-group-name /ecs/aiglossarypro-api \
        --log-stream-name "$STREAM" \
        --start-from-head \
        --limit 50 \
        --query 'events[*].message' \
        --output text
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Fix whatever error is shown above"
echo "2. Test the fix locally first"
echo "3. THEN deploy"
echo ""
echo "NO MORE DEPLOYMENT THEATER UNTIL WE SEE THE APP START LOCALLY"
FROM aiglossarypro-api:latest

# Copy the latest built files  
COPY /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/apps/api/dist /app/apps/api/dist

# Create a simple startup script
RUN cat > /app/start-fixed.sh << 'STARTUP'
#\!/bin/bash
cd /app/apps/api
echo "Starting with fixed database connection..."
exec node dist/index.js
STARTUP

RUN chmod +x /app/start-fixed.sh

CMD ["/app/start-fixed.sh"]

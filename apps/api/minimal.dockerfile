FROM 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest

# Copy just the updated index.js with fixed database connection
COPY dist/index.js /app/apps/api/dist/index.js

# Ensure we're using the right working directory and command
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
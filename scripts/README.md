# AIGlossaryPro Scripts

This directory contains utility scripts for managing the AIGlossaryPro API container lifecycle.

## Scripts Overview

### 🐳 docker-debug.sh
Interactive debugging tool for Docker container issues.

**Features:**
- Auto-detects platform (arm64/amd64)
- Build images with proper architecture
- Run containers with verbose logging
- Interactive shell access
- Environment validation
- Full debug cycle option

**Usage:**
```bash
# Interactive menu
./scripts/docker-debug.sh

# Run full debug cycle
./scripts/docker-debug.sh --full
```

### 🧹 cleanup-services.sh
Cleanup tool for Docker containers and AWS services.

**Features:**
- Remove stopped containers
- Clean Docker images and build cache
- Stop/delete ECS services
- Clean untagged ECR images
- Show recent container logs

**Usage:**
```bash
# Interactive menu
./scripts/cleanup-services.sh

# Cleanup options
./scripts/cleanup-services.sh --all     # Full cleanup
./scripts/cleanup-services.sh --docker  # Docker only
./scripts/cleanup-services.sh --ecs     # ECS only
./scripts/cleanup-services.sh --logs    # Show logs
```

### ✅ test-docker-setup.sh
Quick test to verify Docker setup is working correctly.

**Usage:**
```bash
./scripts/test-docker-setup.sh
```

## Common Workflows

### 1. Debug Container Exit Issues
```bash
# Clean up old containers
./scripts/cleanup-services.sh --docker

# Run debug script
./scripts/docker-debug.sh
# Select option 3 (interactive shell)

# Inside container:
node dist/index.js
# See actual error messages
```

### 2. Fix Platform Issues (arm64 Mac)
```bash
# The scripts auto-detect your platform
# Just run normally:
./scripts/docker-debug.sh --full
```

### 3. Environment Validation
```bash
# Check .env file
./scripts/docker-debug.sh
# Select option 7 (validate environment)
```

### 4. Clean Failed ECS Deployment
```bash
# Stop all tasks and clean up
./scripts/cleanup-services.sh
# Select option 5 (full cleanup)
```

## Environment Variables

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key
- `PORT`: Server port (default: 8080)

Optional variables:
- `GROQ_API_KEY`: Groq API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `REDIS_URL`: Redis connection string
- `ADMIN_API_KEY`: Admin API key
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Troubleshooting

### Container exits immediately
1. Run with interactive shell: `./scripts/docker-debug.sh` → Option 3
2. Check environment variables: Option 7
3. Run with verbose logging: Option 4

### Platform mismatch errors
The scripts automatically detect and use the correct platform. If issues persist:
```bash
# Force rebuild
docker system prune -a
./scripts/docker-debug.sh --full
```

### ECS deployment failures
1. Check CloudWatch logs for the task
2. Run cleanup: `./scripts/cleanup-services.sh --ecs`
3. Verify ECR image: `aws ecr describe-images --repository-name aiglossarypro-api`
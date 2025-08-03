# Security Best Practices - Preventing Secret Exposure

## Overview

This document outlines security best practices to prevent accidental exposure of secrets, API keys, and sensitive information in our codebase.

## What We've Implemented

### 1. Comprehensive .gitignore

We've updated `.gitignore` to exclude:
- All deployment scripts (`scripts/deploy*.sh`)
- AWS and cloud configuration files
- Docker and container files
- Environment files (except `.env.example`)
- Database dumps and backups
- Any file containing keywords like "secret", "credential", "apikey", "token"
- All shell scripts by default (except example/template scripts)

### 2. Pre-commit Hook

A pre-commit hook has been installed that:
- Scans for common secret patterns (API keys, passwords, private keys)
- Warns about deployment scripts being committed
- Blocks commits containing environment files
- Can be bypassed with `--no-verify` (NOT RECOMMENDED)

### 3. Git Secrets Patterns

The `.gitsecrets` file defines patterns for:
- OpenAI API keys (`sk-proj-*`)
- AWS access keys (`AKIA*`)
- Database URLs with passwords
- Private keys
- JWT secrets
- Service-specific tokens

## Best Practices

### 1. Never Hardcode Secrets

❌ **Bad:**
```bash
aws secretsmanager create-secret \
    --secret-string "sk-proj-actualkey123" \
```

✅ **Good:**
```bash
aws secretsmanager create-secret \
    --secret-string "${OPENAI_API_KEY}" \
```

### 2. Use Environment Variables

```bash
# Load from .env.local (never commit this file)
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check required variables
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    exit 1
fi
```

### 3. Use Secret Management Services

For production:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### 4. Create Template Files

Instead of committing actual config files:
```bash
# Create example files
cp .env .env.example
# Edit .env.example to replace secrets with placeholders
# DATABASE_URL=postgresql://user:password@host/db
# OPENAI_API_KEY=sk-proj-your-key-here
```

### 5. Regular Security Audits

```bash
# Search for potential secrets
grep -r "password\|secret\|key\|token" . --exclude-dir=node_modules

# Use tools like git-secrets
git secrets --scan

# Check git history
git log -p | grep -E "AKIA|sk-proj|password"
```

## If You Accidentally Commit Secrets

1. **Don't Panic** - But act quickly
2. **Rotate the Secret Immediately** - Assume it's compromised
3. **Remove from History**:
   ```bash
   # For recent commits
   git reset --hard HEAD~1
   
   # For older commits, use BFG
   bfg --replace-text passwords.txt
   ```
4. **Force Push** (coordinate with team)
5. **Notify Team** about the incident

## Tools and Resources

### Install Security Tools

```bash
# Git secrets
brew install git-secrets
git secrets --install
git secrets --register-aws

# BFG Repo Cleaner
brew install bfg

# TruffleHog (finds secrets in git history)
pip install truffleHog
```

### Useful Commands

```bash
# Scan current directory
git secrets --scan

# Scan git history
trufflehog --regex --entropy=False .

# Find files that might contain secrets
find . -name "*.env*" -o -name "*secret*" -o -name "*key*" | grep -v node_modules
```

## GitHub Security Features

1. **Enable Secret Scanning** - GitHub automatically scans for secrets
2. **Enable Push Protection** - Blocks pushes containing secrets
3. **Review Security Alerts** regularly

## Quick Checklist Before Committing

- [ ] No hardcoded passwords, API keys, or tokens
- [ ] No .env files (only .env.example)
- [ ] No deployment scripts with embedded secrets
- [ ] No database dumps or backups
- [ ] No private keys or certificates
- [ ] Ran `git secrets --scan`
- [ ] Reviewed `git status` output carefully

## Emergency Contacts

If secrets are exposed:
1. Rotate affected credentials immediately
2. Review access logs for suspicious activity
3. Update all systems using the compromised credentials
4. Document the incident for future prevention

Remember: **When in doubt, don't commit it!**
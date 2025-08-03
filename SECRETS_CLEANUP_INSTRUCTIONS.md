# Git History Cleanup Instructions - Removing Exposed Secrets

## Current Situation

The main branch contains exposed secrets in commit `d8f658a1` (and potentially others) in the following files:
- `scripts/deploy-ecs-clean.sh` - Contains OpenAI API keys, AWS access keys, database credentials
- Multiple other deploy scripts with hardcoded secrets

GitHub is blocking push due to secret scanning protection.

## TypeScript Fixes Status

### Successfully Merged Branches:
1. **chore/ts-quick-fixes-1** - ✅ Merged
   - Fixed 50 TypeScript files
   - Reduced errors from 1753 to ~1590 (163 errors eliminated)

2. **typescript-deployment-fixes** - Contains additional fixes but mixed with deployment changes

### Clean Branch Created:
- **main-without-secrets** - Contains all TypeScript fixes but needs secrets removed

## Steps to Clean Main Branch

### Option 1: Force Push Clean Branch (Recommended if you have repo admin rights)

```bash
# 1. Switch to the clean branch
git checkout main-without-secrets

# 2. Force push to main (WARNING: This rewrites history)
git push origin main-without-secrets:main --force

# 3. Update local main
git checkout main
git reset --hard origin/main
```

### Option 2: Use BFG Repo-Cleaner (For thorough cleanup)

```bash
# 1. Install BFG
brew install bfg

# 2. Clone a fresh copy (backup first!)
git clone --mirror https://github.com/pranaysuyash/aiglossarypro.git aiglossarypro-mirror
cd aiglossarypro-mirror

# 3. Create secrets.txt with patterns to remove
cat > secrets.txt << 'EOF'
sk-proj-*
AKIA*
phc_*
re_*
npg_*
EOF

# 4. Run BFG to remove secrets
bfg --replace-text secrets.txt

# 5. Clean up
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 6. Push cleaned history
git push --force
```

### Option 3: Interactive Rebase (For selective editing)

```bash
# 1. Start from commit before secrets
git checkout -b main-cleaned bfc92550

# 2. Cherry-pick the TypeScript fix from the problematic commit
# First, extract just the enhancedStorage.ts changes
git show d8f658a1 -- apps/api/src/enhancedStorage.ts > enhancedStorage.patch
git apply enhancedStorage.patch
git add apps/api/src/enhancedStorage.ts
git commit -m "fix: Resolve 30 TypeScript errors in enhancedStorage.ts"

# 3. Cherry-pick remaining commits
git cherry-pick 1a1b2755 2f7378d1 0f52ab41 ed104fac a9c66cdc
git cherry-pick 89a62377 516ab0fa 711b4ec4 7712e563 5c04a46c

# 4. Push to new main
git push origin main-cleaned:main --force
```

## Files to Review for Secrets

Check these files before pushing:
```bash
# Search for potential secrets
grep -r "sk-proj\|AKIA\|phc_\|re_\|npg_" scripts/
grep -r "password\|secret\|key" scripts/*.sh
```

## After Cleanup

1. Rotate all exposed credentials immediately:
   - OpenAI API keys
   - AWS access keys
   - Database passwords
   - All other API keys

2. Update deployment scripts to use environment variables:
   ```bash
   # Instead of:
   --secret-string "sk-proj-actual-key"
   
   # Use:
   --secret-string "${OPENAI_API_KEY}"
   ```

3. Add `.env.example` with dummy values for reference

4. Update GitHub secrets for Actions

## Prevention

1. Add pre-commit hooks:
   ```bash
   npm install -g @secretlint/secretlint
   echo 'secretlint "**/*"' > .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

2. Use `.gitignore` properly:
   ```
   .env
   .env.*
   !.env.example
   **/secrets/
   ```

3. Enable GitHub secret scanning alerts

## Current Branch Status

- `main` - Contains secrets, cannot push
- `main-without-secrets` - Clean TypeScript fixes, ready to push
- `chore/ts-quick-fixes-1` - Already merged
- `typescript-deployment-fixes` - Contains mixed changes

## Recommended Action

1. Use Option 1 (force push clean branch) if you need to deploy immediately
2. Rotate all credentials after pushing
3. Update all deployment scripts to use environment variables
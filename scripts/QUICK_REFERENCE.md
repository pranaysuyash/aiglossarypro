# Migration Quick Reference

## 🚀 Commands Cheat Sheet

### Setup Validation
```bash
# Check if environment is ready for migration
npx ts-node scripts/validate-migration-setup.ts
```

### Test Migration
```bash
# Test with auto-generated data (3 terms, 5 sections each)
npx ts-node scripts/test-hierarchical-migration.ts

# Test with existing data (first 5 terms)
npx ts-node scripts/test-hierarchical-migration.ts --use-existing --terms=5

# Custom test parameters
npx ts-node scripts/test-hierarchical-migration.ts --terms=2 --sections=8 --items=4

# Keep test data for inspection
npx ts-node scripts/test-hierarchical-migration.ts --no-cleanup
```

### Migration Execution
```bash
# Dry run (safe, no changes)
npx ts-node scripts/migrate-to-hierarchical.ts --dry-run

# Live migration with confirmation prompt
npx ts-node scripts/migrate-to-hierarchical.ts

# Automated migration (no confirmation)
npx ts-node scripts/migrate-to-hierarchical.ts --yes
```

### Rollback Operations
```bash
# List available backup timestamps
npx ts-node scripts/rollback-hierarchical-migration.ts --list-backups

# Dry run rollback
npx ts-node scripts/rollback-hierarchical-migration.ts --dry-run

# Live rollback with confirmation
npx ts-node scripts/rollback-hierarchical-migration.ts

# Rollback to specific timestamp
npx ts-node scripts/rollback-hierarchical-migration.ts --timestamp=2024-01-01T10-30-00-000Z

# Automated rollback
npx ts-node scripts/rollback-hierarchical-migration.ts --yes
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] Run setup validation
- [ ] Test with small dataset
- [ ] Review migration guide
- [ ] Schedule maintenance window
- [ ] Create additional backup (optional)

### Migration
- [ ] Run dry-run migration
- [ ] Execute live migration
- [ ] Monitor migration logs
- [ ] Validate results
- [ ] Test application functionality

### Post-Migration
- [ ] Verify data integrity
- [ ] Check performance
- [ ] Update documentation
- [ ] Clean up backup tables (after validation period)

## 🔍 Key File Locations

### Scripts
- `scripts/migrate-to-hierarchical.ts` - Main migration
- `scripts/rollback-hierarchical-migration.ts` - Rollback
- `scripts/test-hierarchical-migration.ts` - Testing
- `scripts/validate-migration-setup.ts` - Validation

### Documentation
- `scripts/MIGRATION_GUIDE.md` - Complete guide
- `MIGRATION_IMPLEMENTATION_SUMMARY.md` - Implementation summary

### Configuration
- `complete_42_sections_config.ts` - Section definitions
- `client/src/data/content-outline.ts` - Hierarchical structure

## ⚠️ Important Notes

- Always run dry-run before live migration
- Automatic backups are created with timestamps
- Use rollback script if issues occur
- Monitor logs for any errors or warnings
- Test application thoroughly after migration

## 📊 Expected Results

### Before Migration
- Flat sections table with limited hierarchy
- Basic user progress tracking
- Simple navigation structure

### After Migration
- 42 hierarchical sections with 295 subsections
- Enhanced user progress tracking with paths
- Tree-based navigation with interactive elements
- Improved search and filtering capabilities

## 🆘 Troubleshooting

### Common Issues
1. **Database connection failed**: Check DATABASE_URL in .env
2. **Dependencies missing**: Run `npm install`
3. **TypeScript errors**: Check tsconfig.json paths
4. **Migration failed**: Check migration logs and use rollback

### Getting Help
1. Check migration logs: `migration-log-*.json`
2. Review error messages in console output
3. Use validation script to check setup
4. Refer to comprehensive migration guide
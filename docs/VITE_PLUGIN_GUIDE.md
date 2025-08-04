# Custom Vite Plugin Development Guide

## Overview
This guide documents the custom Rollup plugin developed to solve the Vite TSX production build bug. It serves as a reference for future plugin development and similar build issues.

## Plugin Architecture

### Plugin Structure
```typescript
const customRename = () => ({
  name: 'custom-tsx-rename',
  generateBundle(options, bundle) {
    // Bundle manipulation logic
  },
  async writeBundle(options, bundle) {
    // File system operations
  }
});
```

### Hook Lifecycle

```
Vite Build Process:
1. Parse and transform files
2. Bundle with Rollup
3. generateBundle hook ← Our plugin intercepts here
4. Write files to disk
5. writeBundle hook ← Our plugin intercepts here again
```

## Hook Details

### generateBundle Hook

**Purpose**: Modify the bundle before files are written to disk  
**Timing**: After Rollup creates the bundle, before writing to filesystem  
**Use Case**: Rename files in the bundle data structure

```typescript
generateBundle(options, bundle) {
  const filesToRename = [];
  
  // Find all .tsx files in the bundle
  for (const [fileName, file] of Object.entries(bundle)) {
    if (fileName.endsWith('.tsx')) {
      const newFileName = fileName.replace(/\.tsx$/, '.js');
      filesToRename.push({ old: fileName, new: newFileName });
      console.log(`🔄 Renaming in bundle: ${fileName} → ${newFileName}`);
    }
  }
  
  // Rename them in the bundle
  for (const { old, new: newName } of filesToRename) {
    bundle[newName] = bundle[old];
    delete bundle[old];
  }
  
  console.log(`✅ Renamed ${filesToRename.length} .tsx files to .js in bundle`);
}
```

**Key Points**:
- `bundle` is a Map-like object with filename keys
- Must delete old entries and create new ones
- Changes affect internal references and HTML imports

### writeBundle Hook

**Purpose**: Perform file system operations after files are written  
**Timing**: After Vite writes all files to disk  
**Use Case**: Rename actual files on the filesystem

```typescript
async writeBundle(options, bundle) {
  // Import Node.js modules dynamically
  const fs = await import('fs');
  const path = await import('path');
  
  const outDir = options.dir || 'dist';
  
  // Recursive file finder
  const findTsxFiles = (dir) => {
    const files = fs.readdirSync(dir);
    const tsxFiles = [];
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        tsxFiles.push(...findTsxFiles(fullPath));
      } else if (file.endsWith('.tsx')) {
        tsxFiles.push(fullPath);
      }
    }
    
    return tsxFiles;
  };
  
  const tsxFiles = findTsxFiles(outDir);
  
  // Rename files on disk
  for (const tsxFile of tsxFiles) {
    const jsFile = tsxFile.replace(/\.tsx$/, '.js');
    console.log(`🔄 Renaming on disk: ${tsxFile} → ${jsFile}`);
    fs.renameSync(tsxFile, jsFile);
  }
  
  console.log(`✅ Renamed ${tsxFiles.length} .tsx files to .js on disk`);
}
```

**Key Points**:
- Must use dynamic imports in plugin context
- Recursive directory traversal needed
- Synchronous file operations work in this context

## Plugin Integration

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [
    react(), // Base React plugin
    customRename() // Our custom plugin
  ],
  // ... rest of config
});
```

### Plugin Loading Order
1. `@vitejs/plugin-react-swc` - Handles TypeScript compilation
2. `customRename` - Handles file renaming
3. Other plugins...

## Error Handling

### Common Issues

#### 1. Module Import Errors
```typescript
// ❌ Wrong - ESM import in plugin
import fs from 'fs';

// ✅ Correct - Dynamic import
const fs = await import('fs');
```

#### 2. Bundle Manipulation Errors
```typescript
// ❌ Wrong - Modifying while iterating
for (const [fileName, file] of Object.entries(bundle)) {
  if (fileName.endsWith('.tsx')) {
    delete bundle[fileName]; // Modifies during iteration
  }
}

// ✅ Correct - Collect first, then modify
const filesToRename = [];
for (const [fileName, file] of Object.entries(bundle)) {
  if (fileName.endsWith('.tsx')) {
    filesToRename.push({ old: fileName, new: newFileName });
  }
}
for (const { old, new: newName } of filesToRename) {
  bundle[newName] = bundle[old];
  delete bundle[old];
}
```

#### 3. Timing Issues
```typescript
// The issue: Vite writes files AFTER generateBundle
// Solution: Use both hooks for complete coverage
```

## Testing Strategy

### Local Testing
```bash
# Clean build
rm -rf dist && pnpm build

# Verify plugin worked
find dist -name "*.tsx" -type f  # Should be empty
find dist -name "*.js" -type f   # Should show renamed files
```

### CI/CD Validation
```yaml
- name: Validate build output
  run: |
    if find dist -name "*.tsx" -type f | grep -q .; then
      echo "❌ .tsx files found in bundle"
      exit 1
    else
      echo "✅ Bundle clean"
    fi
```

## Plugin Variations

### Generic File Rename Plugin
```typescript
const genericRename = (extensions = [], targetExt = '.js') => ({
  name: 'generic-file-rename',
  generateBundle(options, bundle) {
    const filesToRename = [];
    
    for (const [fileName, file] of Object.entries(bundle)) {
      for (const ext of extensions) {
        if (fileName.endsWith(ext)) {
          const newFileName = fileName.replace(new RegExp(`\\${ext}$`), targetExt);
          filesToRename.push({ old: fileName, new: newFileName });
          break;
        }
      }
    }
    
    for (const { old, new: newName } of filesToRename) {
      bundle[newName] = bundle[old];
      delete bundle[old];
    }
  }
});

// Usage
customRename(['.tsx', '.ts'], '.js')
```

### Conditional Rename Plugin
```typescript
const conditionalRename = (condition, transform) => ({
  name: 'conditional-rename',
  generateBundle(options, bundle) {
    for (const [fileName, file] of Object.entries(bundle)) {
      if (condition(fileName, file)) {
        const newFileName = transform(fileName);
        bundle[newFileName] = bundle[fileName];
        delete bundle[fileName];
      }
    }
  }
});

// Usage
conditionalRename(
  (fileName) => fileName.endsWith('.tsx'),
  (fileName) => fileName.replace('.tsx', '.js')
)
```

## Performance Considerations

### File System Operations
- Use synchronous operations in `writeBundle` for simplicity
- For large projects, consider async operations with proper error handling
- Cache file system queries if needed

### Bundle Manipulation
- Minimal impact on build time
- Object operations are fast for typical bundle sizes
- Logging helps with debugging but can be disabled in production

## Debugging Tips

### Enable Verbose Logging
```typescript
const DEBUG = process.env.DEBUG_PLUGIN === 'true';

if (DEBUG) {
  console.log(`Bundle keys:`, Object.keys(bundle));
  console.log(`Options:`, options);
}
```

### Check Bundle Contents
```typescript
generateBundle(options, bundle) {
  console.log('Bundle analysis:');
  for (const [fileName, file] of Object.entries(bundle)) {
    console.log(`- ${fileName} (${file.type})`);
  }
}
```

## Best Practices

1. **Plugin Naming**: Use descriptive names with vendor prefix
2. **Error Handling**: Gracefully handle missing files/directories
3. **Logging**: Provide useful feedback without being verbose
4. **Testing**: Test both success and failure cases
5. **Documentation**: Document plugin behavior and usage

## Related Resources

- [Rollup Plugin API](https://rollupjs.org/plugin-development/)
- [Vite Plugin Development](https://vitejs.dev/guide/api-plugin.html)
- [Plugin Hook Lifecycle](https://rollupjs.org/plugin-development/#build-hooks)

## Troubleshooting

### Plugin Not Running
- Check plugin is in plugins array
- Verify plugin function returns object with hooks
- Check for TypeScript compilation errors

### Files Not Renamed
- Verify hook timing (use both generateBundle and writeBundle)
- Check file paths and extensions
- Enable debug logging

### Bundle References Broken
- Ensure all bundle object modifications are complete
- Check for circular dependencies
- Verify import/export statements match new filenames

---

**Maintainer**: Development Team  
**Last Updated**: 2025-08-04  
**Related**: TSX_BUILD_FIX.md
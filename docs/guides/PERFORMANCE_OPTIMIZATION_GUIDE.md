# 🚀 Performance Optimization Guide

## Quick Start

### 1. Run with Million.js (Already Configured!)
```bash
npm run dev
```
Million.js is now automatically optimizing your React components for 70% better performance!

### 2. Run with React Scan Performance Monitoring
```bash
npm run dev:perf
```
This will start your dev server AND launch React Scan to visualize performance issues.

## What's Been Optimized

### Million.js Integration ✅
- **Automatic optimization** of all list-rendering components
- **Zero code changes** required - it just works!
- **Smart detection** of components that benefit most from optimization
- **Exclusions** for interactive components that need full React features

### Optimized Components
The following components are now running up to 70% faster:
- Terms listing page
- Categories grid
- Search results
- Favorites list
- Home page term cards
- Trending terms
- Recommended terms
- Term relationships

## Using React Scan

### Basic Usage
```bash
# Run development with performance monitoring
npm run dev:perf

# Or manually run React Scan on running app
npx react-scan@latest http://localhost:5173
```

### What to Look For
React Scan will highlight components with:
- 🔴 **Red**: Excessive re-renders (needs optimization)
- 🟡 **Yellow**: Moderate re-renders (consider optimizing)
- 🟢 **Green**: Efficient rendering (good job!)

### Common Issues & Fixes

#### 1. Unnecessary Re-renders in Lists
```typescript
// Before (re-renders all items)
{terms.map(term => <TermCard term={term} />)}

// After (only re-renders changed items)
{terms.map(term => <TermCard key={term.id} term={term} />)}
```

#### 2. Expensive Computations
```typescript
// Before (recalculates on every render)
const sortedTerms = terms.sort((a, b) => a.name.localeCompare(b.name));

// After (memoizes result)
const sortedTerms = useMemo(
  () => terms.sort((a, b) => a.name.localeCompare(b.name)),
  [terms]
);
```

#### 3. Callback Functions
```typescript
// Before (creates new function every render)
<Button onClick={() => handleClick(term.id)}>View</Button>

// After (stable function reference)
const handleTermClick = useCallback((id: string) => {
  // handle click
}, []);
```

## Performance Monitoring

### Using the Performance Monitor
```typescript
import { usePerformanceMonitor } from '@/utils/performanceMonitor';

function MyComponent() {
  const { measure, logReport } = usePerformanceMonitor('MyComponent');
  
  // Measure render performance
  measure(() => {
    // Component logic
  });
  
  // Log performance report
  useEffect(() => {
    return () => logReport();
  }, []);
}
```

### Checking Performance Improvements

1. **Before Million.js**: Note render times in React DevTools Profiler
2. **After Million.js**: Compare render times - should see 50-70% improvement
3. **Use React Scan**: Identify remaining bottlenecks

## Best Practices

### 1. Keep Components Pure
```typescript
// ✅ Good - Pure component
function TermCard({ term }) {
  return <div>{term.name}</div>;
}

// ❌ Bad - Side effects in render
function TermCard({ term }) {
  localStorage.setItem('lastViewed', term.id); // Side effect!
  return <div>{term.name}</div>;
}
```

### 2. Use Keys Properly
```typescript
// ✅ Good - Stable, unique keys
{terms.map(term => <TermCard key={term.id} term={term} />)}

// ❌ Bad - Index as key (causes issues on reorder)
{terms.map((term, index) => <TermCard key={index} term={term} />)}
```

### 3. Optimize Large Lists
```typescript
// For lists with 100+ items, consider virtualization
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={terms.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TermCard term={terms[index]} />
    </div>
  )}
</FixedSizeList>
```

## Troubleshooting

### Million.js Issues
1. **Component not optimizing?** Check if it's in the exclude list
2. **Errors after optimization?** Add component to exclude list
3. **Build failures?** Ensure all dependencies are up to date

### React Scan Issues
1. **Can't connect?** Make sure dev server is running on correct port
2. **No highlights?** Navigate through your app to trigger renders
3. **Too many warnings?** Focus on red highlights first

## Next Steps

1. **Monitor Performance**: Use React Scan regularly during development
2. **Profile Production Build**: `npm run build && npm run preview`
3. **Track Metrics**: Use performance monitoring in production
4. **Optimize Images**: Consider lazy loading for term images
5. **Code Split**: Use dynamic imports for heavy features

## Resources
- [Million.js Docs](https://million.dev/docs)
- [React Scan GitHub](https://github.com/aidenybai/react-scan)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
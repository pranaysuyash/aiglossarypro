# PR #2: Bugs Found and Required Fixes

## Critical Bugs to Fix

### 1. **Recursive Navigation State Bug** (HierarchicalNavigator.tsx:191-192)

**Issue**: Child nodes inherit parent's `isActive` and `isExpanded` states
```typescript
// CURRENT (WRONG):
<OutlineNode
  isActive={isActive}      // Bug: all children become active when parent is active
  isExpanded={isExpanded}  // Bug: all children expand when parent expands
/>
```

**Fix**:
```typescript
// CORRECTED:
<OutlineNode
  isActive={currentPath === `${path}.${index}`}
  isExpanded={expandedNodes.has(`${path}.${index}`)}
/>
```

### 2. **Depth Calculation Bug** (content-structure.ts:58)

**Issue**: Incorrect depth for root nodes when parentPath is empty
```typescript
// CURRENT (WRONG):
const depth = parentPath.split('.').length;
// ''.split('.') returns [''] with length 1, not 0
```

**Fix**:
```typescript
// CORRECTED:
const depth = parentPath ? parentPath.split('.').length : 0;
```

### 3. **Progress Calculation Mismatch** (HierarchicalNavigator.tsx:247-249)

**Issue**: Comparing total nodes vs only nodes with progress data
```typescript
// CURRENT:
const totalNodes = flattenStructure(sections).length;
const completedNodes = Object.values(userProgress).filter(p => p.isCompleted).length;
// This gives incorrect percentage if not all nodes have progress entries
```

**Fix**:
```typescript
// CORRECTED:
const flatNodes = flattenStructure(sections);
const nodesWithProgress = flatNodes.filter(node => userProgress[node.path]);
const completedNodes = nodesWithProgress.filter(node => userProgress[node.path]?.isCompleted).length;
const overallProgress = nodesWithProgress.length > 0 
  ? (completedNodes / nodesWithProgress.length) * 100 
  : 0;
```

## Performance Issues to Address

### 1. **Expensive Re-renders**

**Issue**: `flattenStructure` called on every render
```typescript
// CURRENT:
const totalNodes = flattenStructure(sections).length;
```

**Fix**:
```typescript
// OPTIMIZED:
const flattenedStructure = useMemo(() => flattenStructure(sections), [sections]);
const totalNodes = flattenedStructure.length;
```

### 2. **Search Performance**

**Issue**: No debouncing on search input
```typescript
// CURRENT:
onChange={(e) => setSearchTerm(e.target.value)}
```

**Fix**:
```typescript
// OPTIMIZED:
const debouncedSetSearch = useCallback(
  debounce((term: string) => setSearchTerm(term), 300),
  []
);

// In the input:
onChange={(e) => debouncedSetSearch(e.target.value)}
```

### 3. **Missing Key Props Warning**

**Issue**: Using array index as key can cause React issues
```typescript
// CURRENT:
key={child.slug || `${path}.${index}`}
```

**Fix**:
```typescript
// BETTER:
key={child.slug || child.name || `${path}.${index}`}
```

## Security Concerns

### 1. **XSS Vulnerability in Demo**

**Issue**: Rendering content without sanitization
```typescript
// CURRENT (HierarchicalNavigatorDemo.tsx:87):
<p>{node.content}</p>
```

**Fix**:
```typescript
// SECURE:
import DOMPurify from 'dompurify';

<p dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(node.content || '') 
}} />
```

## Missing Test Coverage

**Required Tests**:
1. Unit tests for helper functions
2. Component interaction tests
3. Search functionality tests
4. Keyboard navigation tests
5. Progress calculation tests

**Example Test**:
```typescript
describe('flattenStructure', () => {
  it('should flatten nested structure correctly', () => {
    const nodes = [
      { name: 'Parent', subsections: [
        { name: 'Child', subsections: [
          { name: 'Grandchild' }
        ]}
      ]}
    ];
    
    const flat = flattenStructure(nodes);
    expect(flat).toHaveLength(3);
    expect(flat[0].depth).toBe(0);
    expect(flat[1].depth).toBe(1);
    expect(flat[2].depth).toBe(2);
  });
});
```

## Complete Fixed Implementation

Here's the corrected `OutlineNode` recursive call:

```typescript
{node.subsections?.map((child, index) => {
  const childPath = `${path}.${index}`;
  return (
    <OutlineNode
      key={child.slug || child.name || childPath}
      node={child}
      path={childPath}
      depth={depth + 1}
      isActive={currentPath === childPath}
      isExpanded={expandedNodes.has(childPath)}
      onToggle={onToggle}
      onNodeClick={onNodeClick}
      userProgress={userProgress}
      showProgress={showProgress}
      showInteractiveElements={showInteractiveElements}
    />
  );
})}
```

## Test Coverage Report

Failing tests indicate:
- No test files for new components
- Coverage report failing due to missing tests
- Visual tests failing (likely due to new components)

## Priority of Fixes

1. **HIGH**: Fix recursive state bugs (breaks functionality)
2. **HIGH**: Add input sanitization (security risk)
3. **MEDIUM**: Fix performance issues (UX impact)
4. **MEDIUM**: Add test coverage (maintainability)
5. **LOW**: Fix key warnings (React best practices)
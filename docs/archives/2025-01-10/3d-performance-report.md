# 3D Knowledge Graph Performance Test Report
Generated: 2025-07-07T15:48:18.231Z

## Summary

**Recommended maximum:** 15,000 nodes
**Performance at max:** 1640.5 FPS
**Memory usage:** 6.0 MB

## Test Results

| Configuration | Nodes | Est. FPS | Memory (MB) | Layout (ms) | Status |
|---------------|--------|----------|-------------|-------------|---------|
| Small | 1,000 | 14926.6 | 0.4 | 1 | ✅ |
| Medium | 5,000 | 8472.7 | 2.0 | 0 | ✅ |
| Large | 10,000 | 4534.9 | 4.0 | 1 | ✅ |
| XLarge | 15,000 | 1640.5 | 6.0 | 1 | ✅ |

## Detailed Analysis

### Small Configuration
- **Nodes:** 1,000
- **Edges:** 2,000
- **Data Generation:** 1.12ms
- **Layout Calculation:** 0.87ms
- **Rendering:** 2.01ms
- **Estimated FPS:** 14926.6
- **Memory Usage:** 0.40 MB
- **Interaction Latency:** 0.02ms

### Medium Configuration
- **Nodes:** 5,000
- **Edges:** 10,000
- **Data Generation:** 2.68ms
- **Layout Calculation:** 0.28ms
- **Rendering:** 3.54ms
- **Estimated FPS:** 8472.7
- **Memory Usage:** 2.00 MB
- **Interaction Latency:** 0.01ms

### Large Configuration
- **Nodes:** 10,000
- **Edges:** 20,000
- **Data Generation:** 2.92ms
- **Layout Calculation:** 1.09ms
- **Rendering:** 6.62ms
- **Estimated FPS:** 4534.9
- **Memory Usage:** 4.00 MB
- **Interaction Latency:** 0.01ms

### XLarge Configuration
- **Nodes:** 15,000
- **Edges:** 30,000
- **Data Generation:** 4.05ms
- **Layout Calculation:** 0.72ms
- **Rendering:** 18.29ms
- **Estimated FPS:** 1640.5
- **Memory Usage:** 6.00 MB
- **Interaction Latency:** 0.01ms

**Recommendations:**
- Large dataset detected. Implement progressive loading

## Production Recommendations

1. **Optimal Range:** 1,000-10,000 nodes for smooth interaction
2. **Performance Monitoring:** Implement real-time FPS tracking
3. **Progressive Loading:** Load graph data in chunks
4. **Fallback Strategy:** Provide 2D view for large datasets
5. **Mobile Optimization:** Reduce node count on mobile devices
6. **User Controls:** Allow users to adjust quality settings
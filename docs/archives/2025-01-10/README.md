# Hero Section Background Components

This directory contains dynamic background components for the hero section with A/B testing capabilities.

## Components

### 1. NeuralNetworkBackground
- **Description**: Animated neural network with nodes and connections
- **Features**: 
  - Floating nodes with pulsing animations
  - Dynamic connections between nearby nodes
  - Respects `prefers-reduced-motion` setting
  - Performance optimized with GPU acceleration
- **Props**: `opacity`, `nodeCount`, `maxConnections`, `animationSpeed`

### 2. CodeTypingBackground
- **Description**: Animated AI/ML code snippets typing effect
- **Features**: 
  - Real AI/ML code examples (TensorFlow, PyTorch, scikit-learn)
  - Typewriter effect with cursor
  - Random positioning and timing
  - Gradient fade edges
- **Props**: `opacity`, `linesCount`, `typingSpeed`

### 3. GeometricAIBackground
- **Description**: Abstract geometric shapes with AI theme
- **Features**: 
  - Various shapes (triangles, squares, hexagons, circles, diamonds)
  - Rotation and scaling animations
  - Connecting lines between nearby shapes
  - AI-themed color palette
- **Props**: `opacity`, `shapeCount`, `animationSpeed`

### 4. FallbackBackground
- **Description**: Static gradient background for older browsers
- **Features**: 
  - CSS-only implementation
  - Multi-layered radial gradients
  - No JavaScript required
- **Props**: `className`

## A/B Testing Hook

### useBackgroundABTest
```typescript
const { currentVariant, setVariant, trackInteraction, isClient } = useBackgroundABTest({
  enabled: true,
  variants: ['neural', 'code', 'geometric', 'default'],
  sessionKey: 'hero_background_variant',
  cycleInterval: 30000 // Development only
});
```

**Features**:
- Automatic browser compatibility detection
- Session-based variant persistence
- Analytics tracking integration
- Development mode cycling

## Browser Compatibility

The system automatically detects browser capabilities and falls back to simpler backgrounds:

- **Modern browsers**: All animated backgrounds
- **Older browsers**: Automatic fallback to FallbackBackground
- **Reduced motion**: Static states for all animations

**Detection includes**:
- Canvas API support
- RequestAnimationFrame support
- Modern JavaScript features (Promise, Symbol, Array.includes)

## Development Tools

### BackgroundTester
- **Location**: Only visible in development mode
- **Features**:
  - Live variant switching
  - Opacity adjustment
  - Real-time preview
  - Positioned as floating panel

## Usage

```tsx
import { HeroSection } from '@/components/landing/HeroSection';

// The component automatically handles A/B testing
<HeroSection />
```

## Performance Considerations

1. **GPU Acceleration**: All animations use `transform` and `opacity` for optimal performance
2. **Reduced Motion**: Respects user preferences for reduced motion
3. **Memory Management**: Proper cleanup of animation frames and event listeners
4. **Lazy Loading**: Backgrounds only render client-side to prevent hydration issues

## Analytics Integration

The system tracks:
- Background variant assignments
- User interactions with CTAs
- Background-specific conversion metrics

Data is sent to Google Analytics with custom dimensions for A/B test analysis.

## Configuration

Default A/B test configuration:
```typescript
{
  enabled: true,
  variants: ['neural', 'code', 'geometric', 'default'],
  sessionKey: 'hero_background_variant',
  cycleInterval: 30000 // Development only
}
```

## File Structure

```
backgrounds/
├── NeuralNetworkBackground.tsx
├── CodeTypingBackground.tsx
├── GeometricAIBackground.tsx
├── FallbackBackground.tsx
├── BackgroundTester.tsx
├── index.ts
└── README.md
```
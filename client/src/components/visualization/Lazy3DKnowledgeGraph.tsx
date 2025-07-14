/**
 * Lazy-Loaded 3D Knowledge Graph Component
 * 
 * This wrapper provides lazy loading for the heavy 3D visualization component
 * with proper loading states, error boundaries, and performance optimizations.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AlertCircle, Box, Loader2, Network, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { use3DSettings } from '../../hooks/use3DCompatibility';

// Lazy load the heavy 3D component
const ThreeDKnowledgeGraph = lazy(() => import('./3DKnowledgeGraph'));

interface GraphNode {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  connections: string[];
  complexity: number;
  popularity: number;
  isCore: boolean;
  color: string;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: 'prerequisite' | 'related' | 'advanced' | 'application';
}

interface Lazy3DKnowledgeGraphProps {
  className?: string;
  onNodeSelect?: (node: GraphNode) => void;
  initialNodes?: GraphNode[];
  initialEdges?: GraphEdge[];
  autoLoad?: boolean; // Whether to auto-load or wait for user interaction
}

// Loading component with animation and information
function ThreeDLoadingState() {
  const [loadingText, setLoadingText] = useState('Initializing 3D Engine...');
  
  useEffect(() => {
    const messages = [
      'Initializing 3D Engine...',
      'Loading Three.js Components...',
      'Preparing Knowledge Graph...',
      'Rendering 3D Scene...',
      'Almost Ready!'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full h-[600px] flex items-center justify-center">
      <CardContent className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <Box className="h-6 w-6 absolute top-3 left-1/2 transform -translate-x-1/2 text-blue-300 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading 3D Visualization</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loadingText}
          </p>
        </div>
        
        <div className="flex justify-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Three.js
          </Badge>
          <Badge variant="outline" className="text-xs">
            WebGL
          </Badge>
          <Badge variant="outline" className="text-xs">
            Interactive
          </Badge>
        </div>
        
        <p className="text-xs text-gray-500 max-w-md">
          Loading advanced 3D visualization components. This may take a few seconds on slower devices.
        </p>
      </CardContent>
    </Card>
  );
}

// Error boundary component
function ThreeDErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full h-[600px] flex items-center justify-center border-red-200">
      <CardContent className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            3D Visualization Error
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load the 3D visualization component.
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md">
            This could be due to WebGL compatibility issues or network problems.
            Try refreshing the page or check if your browser supports WebGL.
          </p>
          
          <div className="flex justify-center space-x-2">
            <Button onClick={onRetry} variant="outline" size="sm">
              Retry Loading
            </Button>
            <Button 
              onClick={() => window.open('https://get.webgl.org/', '_blank')}
              variant="ghost" 
              size="sm"
            >
              Check WebGL Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Launch button for manual loading
function ThreeDLaunchButton({ 
  onLaunch, 
  compatibility 
}: { 
  onLaunch: () => void;
  compatibility: ReturnType<typeof use3DSettings>;
}) {
  const getQualityBadge = () => {
    switch (compatibility.recommendation) {
      case 'optimal':
        return <Badge variant="default" className="text-xs bg-green-500"><Zap className="h-3 w-3 mr-1" />Optimal</Badge>;
      case 'reduced':
        return <Badge variant="secondary" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Reduced Quality</Badge>;
      case 'minimal':
        return <Badge variant="outline" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Basic Mode</Badge>;
      case 'unsupported':
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Unsupported</Badge>;
    }
  };

  const getDescription = () => {
    if (compatibility.recommendation === 'unsupported') {
      return "WebGL is not supported on this device. 3D visualization is not available.";
    }
    
    const baseDescription = "Interactive 3D visualization of AI/ML concepts and their relationships. Explore the knowledge graph in an immersive 3D environment.";
    
    if (compatibility.warnings.length > 0) {
      return `${baseDescription} Note: ${compatibility.warnings[0]}`;
    }
    
    return baseDescription;
  };

  const isDisabled = compatibility.recommendation === 'unsupported';

  return (
    <Card className="w-full h-[600px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardContent className="text-center space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Network className={`h-16 w-16 mx-auto ${isDisabled ? 'text-gray-400' : 'text-blue-500'}`} />
            {!isDisabled && <Loader2 className="h-6 w-6 absolute -top-1 -right-1 text-blue-300 animate-spin" />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">3D Knowledge Graph</h3>
            <p className={`max-w-md ${isDisabled ? 'text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {getDescription()}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center space-x-2 flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Box className="h-3 w-3 mr-1" />
              WebGL {compatibility.webglVersion || 'Required'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              ~2MB Bundle
            </Badge>
            {getQualityBadge()}
            {compatibility.isMobile && (
              <Badge variant="outline" className="text-xs">
                Mobile Optimized
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={onLaunch} 
            size="lg" 
            className="px-8" 
            disabled={isDisabled}
          >
            <Network className="h-5 w-5 mr-2" />
            {isDisabled ? 'Not Available' : 'Launch 3D Visualization'}
          </Button>
          
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {isDisabled 
                ? 'This device does not support WebGL rendering'
                : 'Loads Three.js and 3D rendering components on demand'
              }
            </p>
            
            {compatibility.warnings.length > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                {compatibility.warnings.slice(0, 2).map((warning, index) => (
                  <div key={index} className="flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Lazy3DKnowledgeGraph({
  className,
  onNodeSelect,
  initialNodes,
  initialEdges,
  autoLoad = false
}: Lazy3DKnowledgeGraphProps) {
  const compatibility = use3DSettings();
  const [shouldLoad, setShouldLoad] = useState(autoLoad || compatibility.shouldLoadEagerly);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleLaunch = () => {
    setShouldLoad(true);
    setHasError(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setRetryKey(prev => prev + 1);
    setShouldLoad(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // Don't load heavy component until requested
  if (!shouldLoad) {
    return <ThreeDLaunchButton onLaunch={handleLaunch} compatibility={compatibility} />;
  }

  // Show error state if loading failed
  if (hasError) {
    return <ThreeDErrorState onRetry={handleRetry} />;
  }

  return (
    <div className={className}>
      <Suspense fallback={<ThreeDLoadingState />}>
        <ErrorBoundary onError={handleError} retryKey={retryKey}>
          <ThreeDKnowledgeGraph
            onNodeSelect={onNodeSelect}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
          />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
  retryKey: number;
}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Visualization Error:', error, errorInfo);
    this.props.onError();
  }

  componentDidUpdate(prevProps: any) {
    // Reset error state when retryKey changes
    if (prevProps.retryKey !== this.props.retryKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Error handled by parent component
    }

    return this.props.children;
  }
}

// Export the GraphNode and GraphEdge types for use in other components
export type { GraphNode, GraphEdge };
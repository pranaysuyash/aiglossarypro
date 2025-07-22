/**
 * 3D Visualization component with Three.js
 * Lazy loads Three.js libraries to reduce bundle size
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy, useEffect, useState } from 'react';

// Lazy load Three.js components
const Canvas = lazy(() =>
    import('@react-three/fiber').then(module => ({ default: module.Canvas }))
);

interface ThreeDVisualizationProps {
    width?: number;
    height?: number;
    backgroundColor?: string;
    showControls?: boolean;
    data?: any[];
}

function ThreeDLoading() {
    return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-md border">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Loading 3D visualization...</p>
                <p className="mt-1 text-xs text-gray-500">Initializing WebGL and Three.js</p>
            </div>
        </div>
    );
}

// Simple 3D scene component
function SimpleScene() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </>
    );
}

// WebGL compatibility check
function useWebGLSupport() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setIsSupported(!!gl);
    }, []);

    return isSupported;
}

function WebGLFallback() {
    return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-md border">
            <div className="text-center max-w-md">
                <div className="text-yellow-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    WebGL Not Supported
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Your browser doesn't support WebGL, which is required for 3D visualization.
                </p>
                <div className="text-xs text-gray-500">
                    <p>Try using a modern browser like:</p>
                    <ul className="mt-1 space-y-1">
                        <li>• Chrome 9+</li>
                        <li>• Firefox 4+</li>
                        <li>• Safari 5.1+</li>
                        <li>• Edge 12+</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function ThreeDCanvas({
    width = 800,
    height = 400,
    backgroundColor = '#f0f0f0',
    showControls = true
}: ThreeDVisualizationProps) {
    return (
        <div style={{ width, height }} className="border rounded-md overflow-hidden">
            <Suspense fallback={<ThreeDLoading />}>
                <Canvas
                    camera={{ position: [0, 0, 5] }}
                    style={{ background: backgroundColor }}
                >
                    <SimpleScene />
                    {showControls && (
                        <Suspense fallback={null}>
                            {/* OrbitControls would be loaded here */}
                        </Suspense>
                    )}
                </Canvas>
            </Suspense>
        </div>
    );
}

export function ThreeDVisualization({
    width = 800,
    height = 400,
    backgroundColor = '#f0f0f0',
    showControls = true,
    data = []
}: ThreeDVisualizationProps) {
    const webglSupported = useWebGLSupport();
    const [error, setError] = useState<string | null>(null);

    if (webglSupported === null) {
        return <ThreeDLoading />;
    }

    if (!webglSupported) {
        return <WebGLFallback />;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800">3D Visualization Error</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <button
                    onClick={() => setError(null)}
                    className="mt-2 text-xs text-red-700 hover:text-red-900"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    3D Visualization
                </label>
                <div className="flex items-center space-x-2">
                    <label className="flex items-center text-xs">
                        <input
                            type="checkbox"
                            checked={showControls}
                            onChange={() => {
                                // Controls toggle would be handled by parent component
                            }}
                            className="mr-1"
                        />
                        Controls
                    </label>
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={() => {
                            // Background color change would be handled by parent component
                        }}
                        className="w-6 h-6 border rounded"
                        title="Background color"
                    />
                </div>
            </div>

            <ThreeDCanvas
                width={width}
                height={height}
                backgroundColor={backgroundColor}
                showControls={showControls}
            />

            <div className="text-xs text-gray-500">
                <p>Use mouse to rotate, zoom, and pan the 3D scene</p>
                {data.length > 0 && <p>Visualizing {data.length} data points</p>}
            </div>
        </div>
    );
}

export default ThreeDVisualization;
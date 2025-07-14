/**
 * 3D Compatibility Detection Hook
 * 
 * Detects device capabilities for 3D rendering and provides recommendations
 * for optimal user experience with WebGL content.
 */

import { useEffect, useState } from 'react';

interface ThreeDCompatibility {
  isWebGLSupported: boolean;
  webglVersion: '1' | '2' | null;
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  isHighPerformance: boolean;
  isMobile: boolean;
  memoryInfo?: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  recommendation: 'optimal' | 'reduced' | 'minimal' | 'unsupported';
  warnings: string[];
}

export function use3DCompatibility(): ThreeDCompatibility {
  const [compatibility, setCompatibility] = useState<ThreeDCompatibility>({
    isWebGLSupported: false,
    webglVersion: null,
    renderer: '',
    vendor: '',
    maxTextureSize: 0,
    maxViewportDims: [0, 0],
    isHighPerformance: false,
    isMobile: false,
    recommendation: 'unsupported',
    warnings: []
  });

  useEffect(() => {
    const detectCompatibility = (): ThreeDCompatibility => {
      const warnings: string[] = [];
      
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const webgl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const webgl2 = canvas.getContext('webgl2');
      
      if (!webgl1 && !webgl2) {
        return {
          isWebGLSupported: false,
          webglVersion: null,
          renderer: '',
          vendor: '',
          maxTextureSize: 0,
          maxViewportDims: [0, 0],
          isHighPerformance: false,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          recommendation: 'unsupported',
          warnings: ['WebGL is not supported on this device']
        };
      }

      const gl = webgl2 || webgl1;
      const webglVersion = webgl2 ? '2' : '1';
      
      // Get WebGL info
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      
      // Get capabilities
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as [number, number];
      
      // Detect mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Performance detection
      let isHighPerformance = true;
      
      // Check for integrated graphics (lower performance)
      const lowPerformanceGPUs = [
        'intel', 'mesa', 'llvmpipe', 'software', 'swiftshader'
      ];
      
      if (lowPerformanceGPUs.some(gpu => renderer.toLowerCase().includes(gpu))) {
        isHighPerformance = false;
        warnings.push('Integrated graphics detected - may impact 3D performance');
      }
      
      // Check texture size capabilities
      if (maxTextureSize < 2048) {
        isHighPerformance = false;
        warnings.push('Limited texture support detected');
      }
      
      // Check memory (if available)
      let memoryInfo;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryInfo = {
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
        
        // Check available memory
        const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
        if (availableMemory < 50 * 1024 * 1024) { // Less than 50MB
          warnings.push('Low available memory - may impact 3D performance');
        }
      }
      
      // Mobile-specific checks
      if (isMobile) {
        isHighPerformance = false;
        warnings.push('Mobile device detected - using optimized 3D settings');
      }
      
      // Determine recommendation
      let recommendation: 'optimal' | 'reduced' | 'minimal' | 'unsupported' = 'optimal';
      
      if (!gl) {
        recommendation = 'unsupported';
      } else if (warnings.length >= 3 || maxTextureSize < 1024) {
        recommendation = 'minimal';
      } else if (!isHighPerformance || warnings.length >= 1) {
        recommendation = 'reduced';
      }
      
      return {
        isWebGLSupported: true,
        webglVersion,
        renderer: renderer || 'Unknown',
        vendor: vendor || 'Unknown',
        maxTextureSize,
        maxViewportDims,
        isHighPerformance,
        isMobile,
        memoryInfo,
        recommendation,
        warnings
      };
    };

    setCompatibility(detectCompatibility());
  }, []);

  return compatibility;
}

/**
 * Hook to get 3D rendering settings based on device capabilities
 */
export function use3DSettings() {
  const compatibility = use3DCompatibility();
  
  const settings = {
    optimal: {
      antialias: true,
      shadowMapSize: 2048,
      maxParticles: 5000,
      enablePostProcessing: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      enablePhysics: true
    },
    reduced: {
      antialias: true,
      shadowMapSize: 1024,
      maxParticles: 2000,
      enablePostProcessing: false,
      pixelRatio: 1,
      enablePhysics: true
    },
    minimal: {
      antialias: false,
      shadowMapSize: 512,
      maxParticles: 500,
      enablePostProcessing: false,
      pixelRatio: 1,
      enablePhysics: false
    }
  };
  
  const currentSettings = compatibility.recommendation === 'unsupported' 
    ? settings.minimal 
    : settings[compatibility.recommendation as keyof typeof settings] || settings.minimal;
  
  return {
    ...compatibility,
    settings: currentSettings,
    shouldLoadEagerly: compatibility.recommendation === 'optimal' && !compatibility.isMobile,
    shouldShowWarning: compatibility.warnings.length > 0,
    shouldUseReducedQuality: compatibility.recommendation !== 'optimal'
  };
}

/**
 * Performance monitoring hook for 3D scenes
 */
export function use3DPerformanceMonitor() {
  const [performance, setPerformance] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    isOptimal: true
  });

  const updatePerformance = (fps: number, frameTime: number) => {
    setPerformance(prev => ({
      fps,
      frameTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      isOptimal: fps >= 30 && frameTime <= 33 // 30 FPS target
    }));
  };

  return {
    performance,
    updatePerformance,
    isPerformanceGood: performance.fps >= 30,
    shouldReduceQuality: performance.fps < 20
  };
}
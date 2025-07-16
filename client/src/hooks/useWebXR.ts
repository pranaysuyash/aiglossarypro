/**
 * WebXR Integration Hook
 * Provides foundation for VR/AR experiences in the AI/ML Glossary
 *
 * Features:
 * - Device detection and capability checking
 * - VR session management for immersive concept exploration
 * - AR session management for real-world overlay visualization
 * - Fallback strategies for non-XR devices
 */

import { useCallback, useEffect, useState } from 'react';

export interface XRDeviceCapabilities {
  vrSupported: boolean;
  arSupported: boolean;
  immersiveVRSupported: boolean;
  immersiveARSupported: boolean;
  inlineSupported: boolean;
  handTracking: boolean;
  eyeTracking: boolean;
  hitTest: boolean;
  anchors: boolean;
  depthSensing: boolean;
}

export interface XRSessionState {
  isActive: boolean;
  mode: 'immersive-vr' | 'immersive-ar' | 'inline' | null;
  error: string | null;
  isLoading: boolean;
}

export interface WebXRHook {
  // Device capabilities
  capabilities: XRDeviceCapabilities;
  isXRSupported: boolean;

  // Session management
  sessionState: XRSessionState;
  initializeVRSession: () => Promise<void>;
  initializeARSession: () => Promise<void>;
  initializeInlineSession: () => Promise<void>;
  endSession: () => Promise<void>;

  // Feature detection
  checkXRSupport: () => Promise<XRDeviceCapabilities>;
  isFeatureSupported: (feature: string) => boolean;

  // Utility functions
  getCompatibilityReport: () => {
    supported: boolean;
    missingFeatures: string[];
    recommendations: string[];
  };
}

/**
 * Custom hook for WebXR functionality
 * Provides comprehensive XR session management and device detection
 */
export const useWebXR = (): WebXRHook => {
  const [capabilities, setCapabilities] = useState<XRDeviceCapabilities>({
    vrSupported: false,
    arSupported: false,
    immersiveVRSupported: false,
    immersiveARSupported: false,
    inlineSupported: false,
    handTracking: false,
    eyeTracking: false,
    hitTest: false,
    anchors: false,
    depthSensing: false,
  });

  const [sessionState, setSessionState] = useState<XRSessionState>({
    isActive: false,
    mode: null,
    error: null,
    isLoading: false,
  });

  const [isXRSupported, setIsXRSupported] = useState(false);

  /**
   * Comprehensive XR feature detection
   */
  const checkXRSupport = useCallback(async (): Promise<XRDeviceCapabilities> => {
    const newCapabilities: XRDeviceCapabilities = {
      vrSupported: false,
      arSupported: false,
      immersiveVRSupported: false,
      immersiveARSupported: false,
      inlineSupported: false,
      handTracking: false,
      eyeTracking: false,
      hitTest: false,
      anchors: false,
      depthSensing: false,
    };

    // Check if WebXR is available
    if (!('xr' in navigator)) {
      console.warn('WebXR not supported in this browser');
      setCapabilities(newCapabilities);
      return newCapabilities;
    }

    try {
      const xr = (navigator as any).xr;

      // Check VR support
      if (await xr.isSessionSupported('immersive-vr')) {
        newCapabilities.vrSupported = true;
        newCapabilities.immersiveVRSupported = true;
      }

      // Check AR support
      if (await xr.isSessionSupported('immersive-ar')) {
        newCapabilities.arSupported = true;
        newCapabilities.immersiveARSupported = true;
      }

      // Check inline support (fallback)
      if (await xr.isSessionSupported('inline')) {
        newCapabilities.inlineSupported = true;
      }

      // Check for additional features that might be available
      // Note: These would need session to be active to test properly
      // For now, we'll assume they might be available if immersive modes are
      if (newCapabilities.immersiveVRSupported || newCapabilities.immersiveARSupported) {
        // These are educated guesses based on typical XR device capabilities
        newCapabilities.handTracking = true; // Many modern XR devices support this
        newCapabilities.hitTest = newCapabilities.immersiveARSupported; // AR typically supports hit testing
        newCapabilities.anchors = newCapabilities.immersiveARSupported; // AR anchor support
      }
    } catch (error) {
      console.error('Error checking XR support:', error);
    }

    setCapabilities(newCapabilities);
    setIsXRSupported(
      newCapabilities.vrSupported || newCapabilities.arSupported || newCapabilities.inlineSupported
    );

    return newCapabilities;
  }, []);

  /**
   * Initialize VR session for immersive concept exploration
   */
  const initializeVRSession = useCallback(async (): Promise<void> => {
    if (!capabilities.immersiveVRSupported) {
      throw new Error('Immersive VR not supported on this device');
    }

    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const xr = (navigator as any).xr;

      // Request VR session with optional features
      const session = await xr.requestSession('immersive-vr', {
        optionalFeatures: ['hand-tracking', 'eye-tracking'],
        requiredFeatures: [],
      });

      setSessionState({
        isActive: true,
        mode: 'immersive-vr',
        error: null,
        isLoading: false,
      });

      // Set up session event listeners
      session.addEventListener('end', () => {
        setSessionState({
          isActive: false,
          mode: null,
          error: null,
          isLoading: false,
        });
      });

      console.log('VR session initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize VR session';
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [capabilities.immersiveVRSupported]);

  /**
   * Initialize AR session for real-world concept overlay
   */
  const initializeARSession = useCallback(async (): Promise<void> => {
    if (!capabilities.immersiveARSupported) {
      throw new Error('Immersive AR not supported on this device');
    }

    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const xr = (navigator as any).xr;

      // Request AR session with hit testing and anchors
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['anchors', 'hand-tracking', 'depth-sensing'],
      });

      setSessionState({
        isActive: true,
        mode: 'immersive-ar',
        error: null,
        isLoading: false,
      });

      // Set up session event listeners
      session.addEventListener('end', () => {
        setSessionState({
          isActive: false,
          mode: null,
          error: null,
          isLoading: false,
        });
      });

      console.log('AR session initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize AR session';
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [capabilities.immersiveARSupported]);

  /**
   * Initialize inline session as fallback
   */
  const initializeInlineSession = useCallback(async (): Promise<void> => {
    if (!capabilities.inlineSupported) {
      throw new Error('Inline XR not supported on this device');
    }

    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const xr = (navigator as any).xr;

      const session = await xr.requestSession('inline');

      setSessionState({
        isActive: true,
        mode: 'inline',
        error: null,
        isLoading: false,
      });

      session.addEventListener('end', () => {
        setSessionState({
          isActive: false,
          mode: null,
          error: null,
          isLoading: false,
        });
      });

      console.log('Inline XR session initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize inline session';
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [capabilities.inlineSupported]);

  /**
   * End current XR session
   */
  const endSession = useCallback(async (): Promise<void> => {
    if (!sessionState.isActive) {
      return;
    }

    try {
      // Note: In a real implementation, we would store the session reference
      // and call session.end() here. For now, we just update state.
      setSessionState({
        isActive: false,
        mode: null,
        error: null,
        isLoading: false,
      });

      console.log('XR session ended');
    } catch (error) {
      console.error('Error ending XR session:', error);
    }
  }, [sessionState.isActive]);

  /**
   * Check if a specific XR feature is supported
   */
  const isFeatureSupported = useCallback(
    (feature: string): boolean => {
      switch (feature) {
        case 'hand-tracking':
          return capabilities.handTracking;
        case 'eye-tracking':
          return capabilities.eyeTracking;
        case 'hit-test':
          return capabilities.hitTest;
        case 'anchors':
          return capabilities.anchors;
        case 'depth-sensing':
          return capabilities.depthSensing;
        default:
          return false;
      }
    },
    [capabilities]
  );

  /**
   * Get comprehensive compatibility report
   */
  const getCompatibilityReport = useCallback(() => {
    const missingFeatures: string[] = [];
    const recommendations: string[] = [];

    if (!isXRSupported) {
      missingFeatures.push('WebXR API not available');
      recommendations.push('Use a WebXR-compatible browser (Chrome, Edge, Firefox Reality)');
    }

    if (!capabilities.vrSupported) {
      missingFeatures.push('VR not supported');
      recommendations.push('Connect a VR headset for immersive experiences');
    }

    if (!capabilities.arSupported) {
      missingFeatures.push('AR not supported');
      recommendations.push('Use an AR-capable device for augmented reality features');
    }

    if (!capabilities.handTracking) {
      recommendations.push('Hand tracking may enhance interaction experience');
    }

    return {
      supported: isXRSupported,
      missingFeatures,
      recommendations,
    };
  }, [isXRSupported, capabilities]);

  // Initialize XR detection on mount
  useEffect(() => {
    checkXRSupport();
  }, [checkXRSupport]);

  return {
    capabilities,
    isXRSupported,
    sessionState,
    initializeVRSession,
    initializeARSession,
    initializeInlineSession,
    endSession,
    checkXRSupport,
    isFeatureSupported,
    getCompatibilityReport,
  };
};

export default useWebXR;

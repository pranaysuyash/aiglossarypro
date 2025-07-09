/**
 * WebXR Device Compatibility Utilities
 * Provides comprehensive device detection and compatibility checking for XR experiences
 */

export interface DeviceInfo {
  platform: 'desktop' | 'mobile' | 'vr' | 'ar' | 'unknown';
  browser: 'chrome' | 'firefox' | 'edge' | 'safari' | 'oculus' | 'unknown';
  browserVersion: string;
  operatingSystem: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';
  supportsWebXR: boolean;
  isSecureContext: boolean;
}

export interface XRCompatibilityLevel {
  level: 'full' | 'partial' | 'fallback' | 'none';
  description: string;
  supportedFeatures: string[];
  missingFeatures: string[];
  recommendations: string[];
}

/**
 * Detect current device and browser information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform.toLowerCase();

  // Browser detection
  let browser: DeviceInfo['browser'] = 'unknown';
  let browserVersion = '';

  if (userAgent.includes('OculusBrowser')) {
    browser = 'oculus';
  } else if (userAgent.includes('Chrome')) {
    browser = 'chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Edge')) {
    browser = 'edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Operating system detection
  let operatingSystem: DeviceInfo['operatingSystem'] = 'unknown';
  if (platform.includes('win')) {
    operatingSystem = 'windows';
  } else if (platform.includes('mac')) {
    operatingSystem = 'macos';
  } else if (platform.includes('linux')) {
    operatingSystem = 'linux';
  } else if (userAgent.includes('Android')) {
    operatingSystem = 'android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    operatingSystem = 'ios';
  }

  // Platform type detection
  let devicePlatform: DeviceInfo['platform'] = 'unknown';
  if (
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone')
  ) {
    devicePlatform = 'mobile';
  } else if (userAgent.includes('OculusBrowser') || userAgent.includes('VR')) {
    devicePlatform = 'vr';
  } else if (
    operatingSystem === 'windows' ||
    operatingSystem === 'macos' ||
    operatingSystem === 'linux'
  ) {
    devicePlatform = 'desktop';
  }

  return {
    platform: devicePlatform,
    browser,
    browserVersion,
    operatingSystem,
    supportsWebXR: 'xr' in navigator,
    isSecureContext: window.isSecureContext,
  };
};

/**
 * Check XR compatibility level based on device capabilities
 */
export const getXRCompatibilityLevel = async (): Promise<XRCompatibilityLevel> => {
  const deviceInfo = getDeviceInfo();
  const supportedFeatures: string[] = [];
  const missingFeatures: string[] = [];
  const recommendations: string[] = [];

  // Check basic WebXR support
  if (!deviceInfo.supportsWebXR) {
    return {
      level: 'none',
      description: 'WebXR is not supported on this device/browser combination',
      supportedFeatures: [],
      missingFeatures: ['WebXR API'],
      recommendations: [
        'Use Chrome 79+, Firefox 80+, or Edge 79+ for WebXR support',
        'Ensure you are on a secure (HTTPS) connection',
      ],
    };
  }

  if (!deviceInfo.isSecureContext) {
    return {
      level: 'none',
      description: 'WebXR requires a secure context (HTTPS)',
      supportedFeatures: [],
      missingFeatures: ['Secure Context'],
      recommendations: ['Access the site over HTTPS'],
    };
  }

  supportedFeatures.push('WebXR API');

  try {
    const xr = (navigator as any).xr;

    // Test VR support
    const supportsVR = await xr.isSessionSupported('immersive-vr');
    if (supportsVR) {
      supportedFeatures.push('Immersive VR');
    } else {
      missingFeatures.push('Immersive VR');
    }

    // Test AR support
    const supportsAR = await xr.isSessionSupported('immersive-ar');
    if (supportsAR) {
      supportedFeatures.push('Immersive AR');
    } else {
      missingFeatures.push('Immersive AR');
    }

    // Test inline support (fallback mode)
    const supportsInline = await xr.isSessionSupported('inline');
    if (supportsInline) {
      supportedFeatures.push('Inline XR');
    } else {
      missingFeatures.push('Inline XR');
    }
  } catch (error) {
    console.error('Error checking XR session support:', error);
    missingFeatures.push('Session Support Check Failed');
  }

  // Determine compatibility level
  let level: XRCompatibilityLevel['level'];
  let description: string;

  if (supportedFeatures.includes('Immersive VR') && supportedFeatures.includes('Immersive AR')) {
    level = 'full';
    description = 'Full XR support with VR and AR capabilities';
  } else if (
    supportedFeatures.includes('Immersive VR') ||
    supportedFeatures.includes('Immersive AR')
  ) {
    level = 'partial';
    description = supportedFeatures.includes('Immersive VR')
      ? 'VR support available, AR not supported'
      : 'AR support available, VR not supported';
  } else if (supportedFeatures.includes('Inline XR')) {
    level = 'fallback';
    description = 'Limited XR support (inline mode only)';
    recommendations.push('Connect a VR headset or use an AR-capable device for full experience');
  } else {
    level = 'none';
    description = 'No XR capabilities detected';
  }

  // Add device-specific recommendations
  switch (deviceInfo.platform) {
    case 'desktop':
      if (!supportedFeatures.includes('Immersive VR')) {
        recommendations.push(
          'Connect a VR headset (Oculus, HTC Vive, Windows Mixed Reality) for VR experiences'
        );
      }
      break;
    case 'mobile':
      if (!supportedFeatures.includes('Immersive AR')) {
        if (deviceInfo.operatingSystem === 'android') {
          recommendations.push('Ensure ARCore is supported on your Android device');
        } else if (deviceInfo.operatingSystem === 'ios') {
          recommendations.push('iOS WebXR support is limited; consider using a dedicated AR app');
        }
      }
      break;
    case 'vr':
      recommendations.push('You are already on a VR device - full immersive experiences available');
      break;
  }

  // Browser-specific recommendations
  if (deviceInfo.browser === 'safari') {
    recommendations.push('Safari has limited WebXR support; consider using Chrome or Firefox');
  }

  return {
    level,
    description,
    supportedFeatures,
    missingFeatures,
    recommendations,
  };
};

/**
 * Get user-friendly device type string
 */
export const getDeviceTypeString = (deviceInfo: DeviceInfo): string => {
  switch (deviceInfo.platform) {
    case 'vr':
      return 'VR Headset';
    case 'mobile':
      return deviceInfo.operatingSystem === 'ios' ? 'iPhone/iPad' : 'Mobile Device';
    case 'desktop':
      return 'Desktop Computer';
    default:
      return 'Unknown Device';
  }
};

/**
 * Check if specific XR features are likely to be supported
 */
export const checkFeatureSupport = (deviceInfo: DeviceInfo) => {
  const features = {
    handTracking: false,
    eyeTracking: false,
    hitTest: false,
    anchors: false,
    depthSensing: false,
    spatialMapping: false,
  };

  // VR devices typically support hand and eye tracking
  if (deviceInfo.platform === 'vr' || deviceInfo.browser === 'oculus') {
    features.handTracking = true;
    features.eyeTracking = true;
  }

  // AR devices typically support hit testing and anchors
  if (
    deviceInfo.platform === 'mobile' &&
    (deviceInfo.operatingSystem === 'android' || deviceInfo.operatingSystem === 'ios')
  ) {
    features.hitTest = true;
    features.anchors = true;
    features.spatialMapping = true;

    // Modern AR devices support depth sensing
    if (deviceInfo.operatingSystem === 'android') {
      features.depthSensing = true; // Many Android devices with ARCore support this
    }
  }

  return features;
};

/**
 * Get performance recommendations based on device
 */
export const getPerformanceRecommendations = (deviceInfo: DeviceInfo): string[] => {
  const recommendations: string[] = [];

  if (deviceInfo.platform === 'mobile') {
    recommendations.push('Use lower-poly 3D models for better mobile performance');
    recommendations.push('Limit the number of concurrent AR objects to 5-10');
    recommendations.push('Enable performance monitoring to adjust quality dynamically');
  }

  if (deviceInfo.platform === 'vr') {
    recommendations.push('Maintain 90fps for VR to prevent motion sickness');
    recommendations.push('Use level-of-detail (LOD) for complex 3D scenes');
    recommendations.push('Implement predictive rendering for smooth head tracking');
  }

  if (deviceInfo.browser === 'safari') {
    recommendations.push('Safari WebGL performance may be limited; consider alternative browsers');
  }

  return recommendations;
};

/**
 * Create a comprehensive compatibility report
 */
export const generateCompatibilityReport = async () => {
  const deviceInfo = getDeviceInfo();
  const xrCompatibility = await getXRCompatibilityLevel();
  const featureSupport = checkFeatureSupport(deviceInfo);
  const performanceRecs = getPerformanceRecommendations(deviceInfo);

  return {
    deviceInfo,
    xrCompatibility,
    featureSupport,
    performanceRecommendations: performanceRecs,
    deviceTypeString: getDeviceTypeString(deviceInfo),
    overallScore: calculateCompatibilityScore(deviceInfo, xrCompatibility),
  };
};

/**
 * Calculate an overall compatibility score (0-100)
 */
const calculateCompatibilityScore = (
  deviceInfo: DeviceInfo,
  xrCompatibility: XRCompatibilityLevel
): number => {
  let score = 0;

  // Base score for WebXR support
  if (deviceInfo.supportsWebXR && deviceInfo.isSecureContext) {
    score += 30;
  }

  // Score based on XR capability level
  switch (xrCompatibility.level) {
    case 'full':
      score += 50;
      break;
    case 'partial':
      score += 35;
      break;
    case 'fallback':
      score += 15;
      break;
    case 'none':
      score += 0;
      break;
  }

  // Bonus points for modern browsers
  if (['chrome', 'firefox', 'edge', 'oculus'].includes(deviceInfo.browser)) {
    score += 10;
  }

  // Bonus for VR-native devices
  if (deviceInfo.platform === 'vr') {
    score += 10;
  }

  return Math.min(score, 100);
};

export default {
  getDeviceInfo,
  getXRCompatibilityLevel,
  getDeviceTypeString,
  checkFeatureSupport,
  getPerformanceRecommendations,
  generateCompatibilityReport,
};

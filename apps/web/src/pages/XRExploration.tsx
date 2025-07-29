/**
 * XR Exploration Page
 * Main entry point for WebXR experiences (VR and AR)
 * Provides device detection, compatibility checking, and mode selection
 */

import { useEffect, useState } from 'react';
import type React from 'react';
import ARConceptOverlay from '../components/ar/ARConceptOverlay';
import VRConceptSpace from '../components/vr/VRConceptSpace';
import { useWebXR } from '../hooks/useWebXR';
import { generateCompatibilityReport } from '../utils/xrCompatibility';

type XRMode = 'selection' | 'vr' | 'ar' | 'compatibility';

const XRExploration: React.FC = () => {
  const [mode, setMode] = useState<XRMode>('selection');
  const [compatibilityReport, setCompatibilityReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { capabilities, isXRSupported, sessionState, getCompatibilityReport } = useWebXR();

  // Generate compatibility report on component mount
  useEffect(() => {
    const loadCompatibilityReport = async () => {
      try {
        const report = await generateCompatibilityReport();
        setCompatibilityReport(report);
      } catch (error: Error | unknown) {
        console.error('Failed to generate compatibility report:', error);
        setError('Failed to check device compatibility');
      }
    };

    loadCompatibilityReport();
  }, []);

  const handleModeSelect = (newMode: XRMode) => {
    setMode(newMode);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setMode('selection');
  };

  const handleBackToSelection = () => {
    setMode('selection');
    setError(null);
  };

  const renderModeSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">XR Exploration</h1>
          <p className="text-xl text-gray-300 mb-8">
            Explore AI/ML concepts in Virtual and Augmented Reality
          </p>

          {/* Compatibility Status */}
          {compatibilityReport && (
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full ${
                compatibilityReport.overallScore > 70
                  ? 'bg-green-900 text-green-200'
                  : compatibilityReport.overallScore > 40
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-red-900 text-red-200'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  compatibilityReport.overallScore > 70
                    ? 'bg-green-400'
                    : compatibilityReport.overallScore > 40
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                }`}
              />
              <span className="font-medium">
                {compatibilityReport.deviceTypeString} - {compatibilityReport.overallScore}%
                Compatible
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-8">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* VR Mode */}
          <div
            className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 transition-all duration-300 ${
              capabilities.vrSupported
                ? 'hover:bg-opacity-20 cursor-pointer hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => capabilities.vrSupported && handleModeSelect('vr')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Virtual Reality</h3>
              <p className="text-gray-300 mb-4">
                Immerse yourself in a 3D knowledge space where AI concepts float around you in
                virtual space
              </p>
              <div className="text-sm">
                {capabilities.vrSupported ? (
                  <span className="text-green-400 font-medium">✓ Available</span>
                ) : (
                  <span className="text-red-400 font-medium">✗ Not Supported</span>
                )}
              </div>
            </div>
          </div>

          {/* AR Mode */}
          <div
            className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 transition-all duration-300 ${
              capabilities.arSupported
                ? 'hover:bg-opacity-20 cursor-pointer hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => capabilities.arSupported && handleModeSelect('ar')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Augmented Reality</h3>
              <p className="text-gray-300 mb-4">
                Place and interact with AI concepts in your real-world environment using your
                device's camera
              </p>
              <div className="text-sm">
                {capabilities.arSupported ? (
                  <span className="text-green-400 font-medium">✓ Available</span>
                ) : (
                  <span className="text-red-400 font-medium">✗ Not Supported</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-10">
            <h4 className="text-lg font-bold text-white mb-2">3D Visualization</h4>
            <p className="text-gray-300 text-sm">
              Explore complex AI concepts in three-dimensional space with intuitive navigation
            </p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-10">
            <h4 className="text-lg font-bold text-white mb-2">Interactive Learning</h4>
            <p className="text-gray-300 text-sm">
              Select, manipulate, and connect concepts using hand gestures or controllers
            </p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-10">
            <h4 className="text-lg font-bold text-white mb-2">Spatial Memory</h4>
            <p className="text-gray-300 text-sm">
              Leverage spatial memory to better understand relationships between AI concepts
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleModeSelect('compatibility')}
            className="px-6 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-lg border border-white border-opacity-20 transition-colors"
          >
            Check Compatibility
          </button>

          {!isXRSupported && (
            <div className="px-6 py-3 bg-yellow-900 text-yellow-200 rounded-lg">
              WebXR not supported on this device
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompatibilityInfo = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={handleBackToSelection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-6"
          >
            ← Back to Selection
          </button>

          <h1 className="text-3xl font-bold text-white mb-4">Device Compatibility Report</h1>

          {compatibilityReport && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Overall Compatibility</h2>
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${
                      compatibilityReport.overallScore > 70
                        ? 'text-green-400'
                        : compatibilityReport.overallScore > 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {compatibilityReport.overallScore}%
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {compatibilityReport.deviceTypeString}
                    </div>
                    <div className="text-gray-300">
                      {compatibilityReport.xrCompatibility.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Device Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-300">Platform:</div>
                    <div className="text-white font-medium capitalize">
                      {compatibilityReport.deviceInfo.platform}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300">Browser:</div>
                    <div className="text-white font-medium capitalize">
                      {compatibilityReport.deviceInfo.browser}{' '}
                      {compatibilityReport.deviceInfo.browserVersion}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300">Operating System:</div>
                    <div className="text-white font-medium capitalize">
                      {compatibilityReport.deviceInfo.operatingSystem}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300">WebXR Support:</div>
                    <div
                      className={`font-medium ${compatibilityReport.deviceInfo.supportsWebXR ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {compatibilityReport.deviceInfo.supportsWebXR ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported Features */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Supported Features</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {compatibilityReport.xrCompatibility.supportedFeatures.map((feature: string) => (
                    <div key={feature} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Features */}
              {compatibilityReport.xrCompatibility.missingFeatures.length > 0 && (
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Missing Features</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {compatibilityReport.xrCompatibility.missingFeatures.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {compatibilityReport.xrCompatibility.recommendations.length > 0 && (
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {compatibilityReport.xrCompatibility.recommendations.map(
                      (rec: string, index: number) => (
                        <li key={index} className="text-gray-300">
                          • {rec}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === 'vr') {
    return (
      <div className="relative">
        <button
          onClick={handleBackToSelection}
          className="absolute top-4 right-4 z-20 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Exit VR
        </button>
        <VRConceptSpace
          onConceptSelect={conceptId => console.log('VR Concept selected:', conceptId)}
          onError={handleError}
        />
      </div>
    );
  }

  if (mode === 'ar') {
    return (
      <div className="relative">
        <button
          onClick={handleBackToSelection}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Exit AR
        </button>
        <ARConceptOverlay
          onConceptPlace={(concept, position) =>
            console.log('AR Concept placed:', concept.name, 'at', position)
          }
          onConceptSelect={conceptId => console.log('AR Concept selected:', conceptId)}
          onError={handleError}
        />
      </div>
    );
  }

  if (mode === 'compatibility') {
    return renderCompatibilityInfo();
  }

  return renderModeSelection();
};

export default XRExploration;

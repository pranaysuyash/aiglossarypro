/**
 * PWA Status Component
 * Displays PWA installation status, offline capabilities, and cache management
 */

import {
  AlertCircle,
  Bell,
  CheckCircle,
  Download,
  HardDrive,
  Info,
  Monitor,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import usePWA from '../hooks/usePWA';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface PWAStatusProps {
  className?: string | undefined;
  compact?: boolean;
}

const PWAStatus: React.FC<PWAStatusProps> = ({ className = '', compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    isInstallable,
    isInstalled,
    isOffline,
    isUpdateAvailable,
    capabilities,
    cacheInfo,
    installPWA,
    updateServiceWorker,
    requestNotificationPermission,
    shareContent,
    getCacheInfo,
    clearCache,
    formatCacheSize,
    isStandaloneMode,
  } = usePWA();

  const handleInstallPWA = async () => {
    setIsLoading(true);
    const success = await installPWA();
    setIsLoading(false);

    if (success) {
      // Show success message or redirect
      console.log('PWA installed successfully');
    }
  };

  const handleUpdateApp = async () => {
    setIsLoading(true);
    await updateServiceWorker();
    setIsLoading(false);
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      console.log('Notification permission granted');
    }
  };

  const handleShare = async () => {
    await shareContent({
      title: 'AI Glossary Pro',
      text: 'Comprehensive AI/ML terminology and learning platform',
      url: window.location.origin,
    });
  };

  const handleRefreshCache = async () => {
    setIsLoading(true);
    await getCacheInfo();
    setIsLoading(false);
  };

  const handleClearCache = async () => {
    if (confirm('This will clear all cached content and you may lose offline access. Continue?')) {
      setIsLoading(true);
      const success = await clearCache();
      setIsLoading(false);

      if (success) {
        console.log('Cache cleared successfully');
      }
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          {isOffline ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <Wifi className="h-4 w-4 text-green-500" />
          )}
          <span className="text-xs text-gray-600">{isOffline ? 'Offline' : 'Online'}</span>
        </div>

        {/* Install Status */}
        {isInstallable && (
          <Button size="sm" variant="outline" onClick={handleInstallPWA} disabled={isLoading}>
            <Download className="h-3 w-3 mr-1" />
            Install
          </Button>
        )}

        {/* Update Available */}
        {isUpdateAvailable && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpdateApp}
            className="text-blue-600 border-blue-600"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Update
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Smartphone className="h-6 w-6 mr-2 text-blue-600" />
            Progressive Web App
          </h2>
          <p className="text-gray-600">App installation and offline capabilities</p>
        </div>

        {/* Quick Status */}
        <div className="flex items-center gap-2">
          <Badge variant={isOffline ? 'destructive' : 'default'}>
            {isOffline ? <WifiOff className="h-3 w-3 mr-1" /> : <Wifi className="h-3 w-3 mr-1" />}
            {isOffline ? 'Offline' : 'Online'}
          </Badge>

          {isInstalled && (
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Installed
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">App Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Installed as PWA</span>
                    {isInstalled ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Standalone Mode</span>
                    {isStandaloneMode() ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Worker</span>
                    {capabilities.hasServiceWorker ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Offline Ready</span>
                    {capabilities.hasServiceWorker ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Push Notifications</span>
                    {capabilities.canNotify ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleRequestNotifications}>
                        <Bell className="h-3 w-3 mr-1" />
                        Enable
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Web Share</span>
                    {capabilities.canShare ? (
                      <Button size="sm" variant="outline" onClick={handleShare}>
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Background Sync</span>
                    {capabilities.canSync ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">App Installation</span>
                    {capabilities.canInstall ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Update Available */}
          {isUpdateAvailable && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">Update Available</h4>
                      <p className="text-sm text-blue-700">
                        A new version of the app is ready to install.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleUpdateApp} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Update Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Installation Tab */}
        <TabsContent value="installation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Install AI Glossary Pro</CardTitle>
              <p className="text-sm text-gray-600">
                Get native app experience with offline access and faster loading
              </p>
            </CardHeader>
            <CardContent>
              {isInstalled ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    App Installed Successfully!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    AI Glossary Pro is now installed on your device and available from your home
                    screen.
                  </p>
                  {isStandaloneMode() && (
                    <Badge variant="secondary">Running in standalone mode</Badge>
                  )}
                </div>
              ) : isInstallable ? (
                <div className="text-center py-8">
                  <Smartphone className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Install as App</h3>
                  <p className="text-gray-600 mb-6">
                    Install AI Glossary Pro for faster access, offline capability, and native app
                    experience.
                  </p>
                  <Button onClick={handleInstallPWA} disabled={isLoading} size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Installation Not Available
                  </h3>
                  <p className="text-gray-600">
                    App installation is not supported on this browser or device. You can still use
                    all features through your web browser.
                  </p>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Benefits of Installing</h4>
                  <ul className="text-sm text-gray-600 space-y-1 text-left">
                    <li>• Offline access to content</li>
                    <li>• Faster loading times</li>
                    <li>• Home screen access</li>
                    <li>• Push notifications</li>
                    <li>• Native app experience</li>
                  </ul>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">System Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1 text-left">
                    <li>• Modern web browser</li>
                    <li>• HTTPS connection</li>
                    <li>• 50MB+ available storage</li>
                    <li>• Service Worker support</li>
                    <li>• Manifest support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Tab */}
        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offline Capabilities</CardTitle>
              <p className="text-sm text-gray-600">
                Access cached content when you're not connected to the internet
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Connection Status</h4>
                    <Badge variant={isOffline ? 'destructive' : 'default'}>
                      {isOffline ? (
                        <WifiOff className="h-3 w-3 mr-1" />
                      ) : (
                        <Wifi className="h-3 w-3 mr-1" />
                      )}
                      {isOffline ? 'Offline' : 'Online'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isOffline
                      ? 'You are currently offline. Cached content is available for viewing.'
                      : 'You are online. New content will be cached automatically for offline access.'}
                  </p>
                </div>

                {/* Offline Features */}
                <div>
                  <h4 className="font-medium mb-3">Available Offline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Previously viewed terms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Favorites and bookmarks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Search through cached content</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Learning progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Basic navigation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">New content loading</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offline Tips */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Offline Tips</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Browse content while online to cache it for offline use</li>
                        <li>• Add terms to favorites for guaranteed offline access</li>
                        <li>• The app will sync changes when connection is restored</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <p className="text-sm text-gray-600">Manage cached content and storage usage</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cache Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <HardDrive className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCacheSize(cacheInfo.totalCacheSize)}
                    </div>
                    <div className="text-sm text-gray-600">Total Cache Size</div>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCacheSize(cacheInfo.staticCacheSize)}
                    </div>
                    <div className="text-sm text-gray-600">Static Assets</div>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCacheSize(cacheInfo.dynamicCacheSize)}
                    </div>
                    <div className="text-sm text-gray-600">Dynamic Content</div>
                  </div>
                </div>

                {/* Cache Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefreshCache} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Stats
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearCache}
                    disabled={isLoading}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                {/* Last Updated */}
                {cacheInfo.lastUpdated && (
                  <div className="text-sm text-gray-600">
                    Last updated: {cacheInfo.lastUpdated.toLocaleString()}
                  </div>
                )}

                {/* Cache Warning */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Cache Notice</h4>
                      <p className="text-sm text-yellow-800">
                        Clearing the cache will remove all offline content and may require
                        re-downloading when you visit pages again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PWAStatus;

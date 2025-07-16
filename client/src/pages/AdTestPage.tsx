import React from 'react';
import GoogleAd from '@/components/ads/GoogleAd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdPlacement } from '@/hooks/useAdSense';
import { useAuth } from '@/hooks/useAuth';

/**
 * AdTestPage - Development testing page for AdSense integration
 *
 * This page is used to test AdSense functionality in development:
 * - Different ad formats and placements
 * - Premium user exclusion
 * - Lazy loading behavior
 * - Environment configuration
 *
 * Remove this page from production build
 */

export default function AdTestPage() {
  const { user, isAuthenticated } = useAuth();
  const { canShowAd: canShowHomepageAd, adSlot: homepageAdSlot } = useAdPlacement('homepage');
  const { canShowAd: canShowTermDetailAd, adSlot: termDetailAdSlot } = useAdPlacement('termDetail');
  const { canShowAd: canShowSearchAd, adSlot: searchAdSlot } = useAdPlacement('searchResults');
  const { canShowAd: canShowSidebarAd, adSlot: sidebarAdSlot } = useAdPlacement('sidebar');

  const [testMode, setTestMode] = React.useState(false);

  const userStatus = React.useMemo(() => {
    if (!isAuthenticated) {return 'Guest User';}
    if (user?.lifetimeAccess) {return 'Premium User (Lifetime Access)';}
    return 'Free User';
  }, [isAuthenticated, user]);

  const adsenseConfig = {
    enabled: import.meta.env.VITE_ADSENSE_ENABLED === 'true',
    clientId: import.meta.env.VITE_ADSENSE_CLIENT_ID,
    environment: import.meta.env.DEV ? 'Development' : 'Production',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AdSense Integration Test Page</h1>
        <p className="text-gray-600 mb-4">
          This page is for testing AdSense integration in development. Remove from production.
        </p>

        {/* Status Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">User Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{userStatus}</p>
              <p className="text-sm text-gray-500">
                {user?.lifetimeAccess ? 'Should see NO ads' : 'Should see ads'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AdSense Config</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <strong>Enabled:</strong> {adsenseConfig.enabled ? 'Yes' : 'No'}
              </p>
              <p className="text-sm">
                <strong>Environment:</strong> {adsenseConfig.environment}
              </p>
              <p className="text-sm">
                <strong>Client ID:</strong> {adsenseConfig.clientId ? 'Set' : 'Missing'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ad Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs">
                <strong>Homepage:</strong> {homepageAdSlot || 'Not set'}
              </p>
              <p className="text-xs">
                <strong>Term Detail:</strong> {termDetailAdSlot || 'Not set'}
              </p>
              <p className="text-xs">
                <strong>Search:</strong> {searchAdSlot || 'Not set'}
              </p>
              <p className="text-xs">
                <strong>Sidebar:</strong> {sidebarAdSlot || 'Not set'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-4">
          <Button onClick={() => setTestMode(!testMode)} variant={testMode ? 'default' : 'outline'}>
            {testMode ? 'Hide' : 'Show'} Test Ads
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      </div>

      {/* Ad Format Tests */}
      {testMode && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Rectangle Ad (300x250)</h2>
            <Card className="p-4">
              {canShowHomepageAd && homepageAdSlot ? (
                <GoogleAd
                  slot={homepageAdSlot}
                  format="rectangle"
                  responsive
                  lazy={false}
                  className="mx-auto"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {user?.lifetimeAccess
                    ? 'Premium user - no ads shown'
                    : 'AdSense disabled or slot not configured'}
                </div>
              )}
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Horizontal Banner (728x90)</h2>
            <Card className="p-4">
              {canShowSearchAd && searchAdSlot ? (
                <GoogleAd
                  slot={searchAdSlot}
                  format="horizontal"
                  responsive
                  lazy={false}
                  className="mx-auto"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {user?.lifetimeAccess
                    ? 'Premium user - no ads shown'
                    : 'AdSense disabled or slot not configured'}
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Content Area Ad</h2>
              <Card className="p-4">
                {canShowTermDetailAd && termDetailAdSlot ? (
                  <GoogleAd slot={termDetailAdSlot} format="fluid" responsive lazy={false} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {user?.lifetimeAccess
                      ? 'Premium user - no ads shown'
                      : 'AdSense disabled or slot not configured'}
                  </div>
                )}
              </Card>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Sidebar Ad (160x600)</h2>
              <Card className="p-4">
                {canShowSidebarAd && sidebarAdSlot ? (
                  <GoogleAd
                    slot={sidebarAdSlot}
                    format="vertical"
                    responsive={false}
                    lazy={false}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {user?.lifetimeAccess
                      ? 'Premium user - no ads shown'
                      : 'AdSense disabled or slot not configured'}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Lazy Loading Test</h2>
            <p className="text-gray-600 mb-4">
              Scroll down to see the ad load when it comes into view (lazy loading test)
            </p>

            {/* Spacer to push ad below fold */}
            <div className="h-screen bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Scroll down to test lazy loading...</p>
            </div>

            <Card className="p-4 mt-4">
              <h3 className="text-lg font-medium mb-4">
                Lazy Loaded Ad (should load when scrolled into view)
              </h3>
              {canShowHomepageAd && homepageAdSlot ? (
                <GoogleAd
                  slot={homepageAdSlot}
                  format="rectangle"
                  responsive
                  lazy // Enable lazy loading
                  className="mx-auto"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {user?.lifetimeAccess
                    ? 'Premium user - no ads shown'
                    : 'AdSense disabled or slot not configured'}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Set <code>VITE_ADSENSE_ENABLED=true</code> in your .env file
          </li>
          <li>
            Configure <code>VITE_ADSENSE_CLIENT_ID</code> with your AdSense publisher ID
          </li>
          <li>Set up ad slot IDs for each placement type</li>
          <li>Test with different user types (guest, free, premium)</li>
          <li>Check browser console for AdSense-related errors</li>
          <li>Test on mobile devices for responsive behavior</li>
          <li>Use browser dev tools to monitor network requests</li>
          <li>Verify lazy loading works by watching network tab while scrolling</li>
        </ol>
      </div>
    </div>
  );
}

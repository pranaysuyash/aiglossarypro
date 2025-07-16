import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Eye,
  FileText,
  MousePointer,
  RefreshCw,
  Settings,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { isCookieAllowed } from '@/components/CookieConsentBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ga4Analytics } from '@/lib/ga4Analytics';

interface AnalyticsDebugInfo {
  isGA4Enabled: boolean;
  hasAnalyticsConsent: boolean;
  measurementId: string;
  sessionInfo: any;
  environment: string;
}

export default function AnalyticsDashboard() {
  const [debugInfo, setDebugInfo] = useState<AnalyticsDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const loadDebugInfo = async () => {
    setIsLoading(true);
    try {
      const info: AnalyticsDebugInfo = {
        isGA4Enabled: import.meta.env.VITE_GA4_ENABLED === 'true',
        hasAnalyticsConsent: isCookieAllowed('analytics'),
        measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'Not configured',
        sessionInfo: ga4Analytics.getSessionInfo(),
        environment: import.meta.env.NODE_ENV || 'unknown',
      };
      setDebugInfo(info);
    } catch (error: any) {
      console.error('Error loading debug info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const runAnalyticsTests = async () => {
    const results: Record<string, boolean> = {};

    // Test 1: Page view tracking
    try {
      ga4Analytics.trackPageView('Test Page View', window.location.href);
      results.pageViewTracking = true;
    } catch (error: any) {
      console.error('Page view test failed:', error);
      results.pageViewTracking = false;
    }

    // Test 2: CTA click tracking
    try {
      ga4Analytics.trackCTAClick('Test CTA', 'dashboard', 'testing');
      results.ctaTracking = true;
    } catch (error: any) {
      console.error('CTA tracking test failed:', error);
      results.ctaTracking = false;
    }

    // Test 3: Scroll depth tracking
    try {
      ga4Analytics.trackScrollDepth(50);
      results.scrollTracking = true;
    } catch (error: any) {
      console.error('Scroll tracking test failed:', error);
      results.scrollTracking = false;
    }

    // Test 4: Section view tracking
    try {
      ga4Analytics.trackSectionView('Test Section', 1);
      results.sectionTracking = true;
    } catch (error: any) {
      console.error('Section tracking test failed:', error);
      results.sectionTracking = false;
    }

    // Test 5: Form submission tracking
    try {
      ga4Analytics.trackFormSubmission('contact', 'dashboard_test');
      results.formTracking = true;
    } catch (error: any) {
      console.error('Form tracking test failed:', error);
      results.formTracking = false;
    }

    // Test 6: Business event tracking
    try {
      ga4Analytics.trackBusinessEvent({
        event_name: 'test_business_event',
        business_metric: 'ab_test_view',
        event_category: 'testing',
        event_label: 'dashboard_test',
        value: 1,
      });
      results.businessEventTracking = true;
    } catch (error: any) {
      console.error('Business event tracking test failed:', error);
      results.businessEventTracking = false;
    }

    setTestResults(results);
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) {return <AlertCircle className="h-4 w-4 text-yellow-500" />;}
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) {return 'secondary';}
    return status ? 'default' : 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analytics information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor and test GA4 analytics implementation</p>
        </div>
        <Button onClick={loadDebugInfo} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>GA4 Enabled</span>
              <Badge variant={getStatusColor(debugInfo?.isGA4Enabled || false)}>
                {getStatusIcon(debugInfo?.isGA4Enabled || false)}
                <span className="ml-2">{debugInfo?.isGA4Enabled ? 'Yes' : 'No'}</span>
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Analytics Consent</span>
              <Badge variant={getStatusColor(debugInfo?.hasAnalyticsConsent || false)}>
                {getStatusIcon(debugInfo?.hasAnalyticsConsent || false)}
                <span className="ml-2">
                  {debugInfo?.hasAnalyticsConsent ? 'Granted' : 'Denied'}
                </span>
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Environment</span>
              <Badge variant="outline">{debugInfo?.environment}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Measurement ID</span>
              <Badge variant="outline" className="font-mono text-xs">
                {debugInfo?.measurementId}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugInfo?.sessionInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Session ID:</span>
                <div className="font-mono text-xs text-muted-foreground break-all">
                  {debugInfo.sessionInfo.sessionId}
                </div>
              </div>
              <div>
                <span className="font-medium">Page View ID:</span>
                <div className="font-mono text-xs text-muted-foreground break-all">
                  {debugInfo.sessionInfo.pageViewId}
                </div>
              </div>
              <div>
                <span className="font-medium">User ID:</span>
                <div className="font-mono text-xs text-muted-foreground">
                  {debugInfo.sessionInfo.userId || 'Not set'}
                </div>
              </div>
              <div>
                <span className="font-medium">Session Duration:</span>
                <div className="font-mono text-xs text-muted-foreground">
                  {debugInfo.sessionInfo.sessionDuration}s
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAnalyticsTests} className="w-full">
            Run Analytics Tests
          </Button>

          {Object.keys(testResults).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Test Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(testResults).map(([test, result]) => (
                    <div key={test} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {test.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={getStatusColor(result)}>
                        {getStatusIcon(result)}
                        <span className="ml-2">{result ? 'Pass' : 'Fail'}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MousePointer className="h-5 w-5 mr-2" />
            Quick Test Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => ga4Analytics.trackPageView('Manual Test Page', window.location.href)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Track Page View
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => ga4Analytics.trackCTAClick('Test Button', 'dashboard', 'manual_test')}
            >
              <MousePointer className="h-4 w-4 mr-2" />
              Track CTA Click
            </Button>

            <Button variant="outline" size="sm" onClick={() => ga4Analytics.trackScrollDepth(75)}>
              <Activity className="h-4 w-4 mr-2" />
              Track Scroll Depth
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => ga4Analytics.trackSectionView('Manual Test Section')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Track Section View
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => ga4Analytics.trackFormSubmission('newsletter', 'dashboard_manual')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Track Form Submit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => ga4Analytics.trackEarlyBirdSignup('pro', 20)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Track Early Bird
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      {import.meta.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

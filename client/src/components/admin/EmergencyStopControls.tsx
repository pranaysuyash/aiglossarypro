import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PlayCircle,
  Settings,
  Shield,
  StopCircle,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface SafetyLimits {
  dailyCostLimit: number;
  monthlyCostLimit: number;
  maxConcurrentOperations: number;
  maxTermsPerBatch: number;
  maxQueueSize: number;
  minQualityThreshold: number;
  maxFailureRate: number;
  emergencyStopActive: boolean;
}

interface SafetyMetrics {
  dailySpend: number;
  monthlySpend: number;
  activeOperations: number;
  queueSize: number;
  averageQuality: number;
  failureRate: number;
  lastUpdated: string;
}

interface SafetyAlert {
  id: string;
  type: 'cost' | 'quality' | 'capacity' | 'emergency' | 'failure_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  autoResolved: boolean;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
  activeOperations: number;
  queueSize: number;
  emergencyStopActive: boolean;
  criticalAlerts: number;
}

export const EmergencyStopControls: React.FC = () => {
  const [limits, setLimits] = useState<SafetyLimits>({
    dailyCostLimit: 100,
    monthlyCostLimit: 2000,
    maxConcurrentOperations: 5,
    maxTermsPerBatch: 100,
    maxQueueSize: 500,
    minQualityThreshold: 6.0,
    maxFailureRate: 0.1,
    emergencyStopActive: false,
  });

  const [metrics, setMetrics] = useState<SafetyMetrics>({
    dailySpend: 23.45,
    monthlySpend: 678.9,
    activeOperations: 2,
    queueSize: 15,
    averageQuality: 7.8,
    failureRate: 0.03,
    lastUpdated: new Date().toISOString(),
  });

  const [alerts, setAlerts] = useState<SafetyAlert[]>([
    {
      id: 'alert-1',
      type: 'cost',
      severity: 'medium',
      message: 'Daily cost approaching 80% of limit',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      acknowledged: false,
      autoResolved: false,
    },
    {
      id: 'alert-2',
      type: 'quality',
      severity: 'low',
      message: 'Quality score below threshold for operation batch-456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      acknowledged: false,
      autoResolved: false,
    },
  ]);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    activeOperations: 2,
    queueSize: 15,
    emergencyStopActive: false,
    criticalAlerts: 0,
  });

  const [emergencyReason, setEmergencyReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        dailySpend: prev.dailySpend + Math.random() * 0.5,
        lastUpdated: new Date().toISOString(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    if (!emergencyReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the emergency stop',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLimits(prev => ({ ...prev, emergencyStopActive: true }));
      setSystemStatus(prev => ({ ...prev, emergencyStopActive: true, status: 'emergency' }));
      setMetrics(prev => ({ ...prev, activeOperations: 0, queueSize: 0 }));

      toast({
        title: 'Emergency Stop Activated',
        description: 'All operations have been stopped successfully',
        variant: 'default',
      });

      setEmergencyReason('');
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to activate emergency stop',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeOperations = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLimits(prev => ({ ...prev, emergencyStopActive: false }));
      setSystemStatus(prev => ({ ...prev, emergencyStopActive: false, status: 'healthy' }));

      toast({
        title: 'Operations Resumed',
        description: 'System is now accepting new operations',
        variant: 'default',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to resume operations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    );
    toast({
      title: 'Alert Acknowledged',
      description: 'Alert has been marked as acknowledged',
      variant: 'default',
    });
  };

  const handleUpdateLimits = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Limits Updated',
        description: 'Safety limits have been updated successfully',
        variant: 'default',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update safety limits',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      case 'emergency':
        return 'bg-red-800';
      default:
        return 'bg-gray-500';
    }
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'emergency':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Safety Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.status)}`} />
              <span className="font-medium">Status:</span>
              <Badge variant={systemStatus.status === 'healthy' ? 'default' : 'destructive'}>
                {systemStatus.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Active Operations: {systemStatus.activeOperations}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Alerts: {systemStatus.criticalAlerts}</span>
            </div>
            <div className="flex items-center gap-2">
              {systemStatus.emergencyStopActive ? (
                <StopCircle className="w-4 h-4 text-red-500" />
              ) : (
                <PlayCircle className="w-4 h-4 text-green-500" />
              )}
              <span>
                Emergency Stop: {systemStatus.emergencyStopActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Stop Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StopCircle className="w-5 h-5" />
            Emergency Stop Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {limits.emergencyStopActive ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Emergency stop is currently active. All operations have been halted.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="emergency-reason">Reason for Emergency Stop</Label>
                <Input
                  id="emergency-reason"
                  placeholder="Enter reason for emergency stop..."
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {limits.emergencyStopActive ? (
              <Button onClick={handleResumeOperations} disabled={isLoading} variant="default">
                <PlayCircle className="w-4 h-4 mr-2" />
                Resume Operations
              </Button>
            ) : (
              <Button
                onClick={handleEmergencyStop}
                disabled={isLoading || !emergencyReason.trim()}
                variant="destructive"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Emergency Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="settings">Safety Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Daily Spend</span>
                    <span>
                      ${metrics.dailySpend.toFixed(2)} / ${limits.dailyCostLimit}
                    </span>
                  </div>
                  <Progress value={(metrics.dailySpend / limits.dailyCostLimit) * 100} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Monthly Spend</span>
                    <span>
                      ${metrics.monthlySpend.toFixed(2)} / ${limits.monthlyCostLimit}
                    </span>
                  </div>
                  <Progress value={(metrics.monthlySpend / limits.monthlyCostLimit) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Operation Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Operation Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Active Operations</span>
                    <span>
                      {metrics.activeOperations} / {limits.maxConcurrentOperations}
                    </span>
                  </div>
                  <Progress
                    value={(metrics.activeOperations / limits.maxConcurrentOperations) * 100}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Queue Size</span>
                    <span>
                      {metrics.queueSize} / {limits.maxQueueSize}
                    </span>
                  </div>
                  <Progress value={(metrics.queueSize / limits.maxQueueSize) * 100} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Average Quality</span>
                    <span>{metrics.averageQuality.toFixed(1)} / 10</span>
                  </div>
                  <Progress value={(metrics.averageQuality / 10) * 100} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Failure Rate</span>
                    <span>{(metrics.failureRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.failureRate / limits.maxFailureRate) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No active alerts</div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <Alert key={alert.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="ml-2">{alert.message}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Safety Limits Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily-limit">Daily Cost Limit ($)</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={limits.dailyCostLimit}
                    onChange={e =>
                      setLimits(prev => ({ ...prev, dailyCostLimit: parseFloat(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="monthly-limit">Monthly Cost Limit ($)</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    value={limits.monthlyCostLimit}
                    onChange={e =>
                      setLimits(prev => ({
                        ...prev,
                        monthlyCostLimit: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max-concurrent">Max Concurrent Operations</Label>
                  <Input
                    id="max-concurrent"
                    type="number"
                    value={limits.maxConcurrentOperations}
                    onChange={e =>
                      setLimits(prev => ({
                        ...prev,
                        maxConcurrentOperations: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max-batch">Max Terms per Batch</Label>
                  <Input
                    id="max-batch"
                    type="number"
                    value={limits.maxTermsPerBatch}
                    onChange={e =>
                      setLimits(prev => ({ ...prev, maxTermsPerBatch: parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quality-threshold">Min Quality Threshold</Label>
                  <Input
                    id="quality-threshold"
                    type="number"
                    step="0.1"
                    value={limits.minQualityThreshold}
                    onChange={e =>
                      setLimits(prev => ({
                        ...prev,
                        minQualityThreshold: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="failure-rate">Max Failure Rate (%)</Label>
                  <Input
                    id="failure-rate"
                    type="number"
                    step="0.01"
                    value={limits.maxFailureRate * 100}
                    onChange={e =>
                      setLimits(prev => ({
                        ...prev,
                        maxFailureRate: parseFloat(e.target.value) / 100,
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={handleUpdateLimits} disabled={isLoading} className="w-full">
                Update Safety Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

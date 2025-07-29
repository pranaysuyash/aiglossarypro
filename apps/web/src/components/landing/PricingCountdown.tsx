import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EarlyBirdStatus {
  totalRegistered: number;
  totalPurchased: number;
  maxSlots: number;
  remainingSlots: number;
  percentageFilled: number;
  isActive: boolean;
  lastUpdated: string;
  pricing: {
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    discountPercentage: number;
  };
}

interface PricingCountdownProps {
  className?: string | undefined;
  compact?: boolean;
}

export function PricingCountdown({ className = '', compact = false }: PricingCountdownProps) {
  const [status, setStatus] = useState<EarlyBirdStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch early bird status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/early-bird-status');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch early bird status');
      }
    } catch (_err) {
      setError('Network error - unable to fetch current status');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchStatus();

    // Update every 5 minutes
    const interval = setInterval(
      () => {
        fetchStatus();
        setLastUpdate(new Date());
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent re-running on every render

  // Handle loading state
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-32 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading early bird status...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !status) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error || 'Unable to load early bird status'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle promotion ended
  if (!status.isActive) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 mb-2">
              Early Bird Promotion Ended
            </div>
            <div className="text-sm text-gray-600">
              All 500 early bird slots have been filled. Regular pricing now applies.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress bar width
  const progressWidth = Math.min(100, (status.totalRegistered / status.maxSlots) * 100);

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (status.remainingSlots <= 50) {return 'critical';}
    if (status.remainingSlots <= 100) {return 'high';}
    if (status.remainingSlots <= 200) {return 'medium';}
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel();
  const urgencyColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const urgencyTextColors = {
    critical: 'text-red-700',
    high: 'text-orange-700',
    medium: 'text-yellow-700',
    low: 'text-green-700',
  };

  if (compact) {
    return (
      <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-1">
              First 500 Customers
            </Badge>
            <div className="text-sm font-medium text-purple-900">
              {status.remainingSlots} slots remaining
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-900">
              ${status.pricing.discountedPrice}
            </div>
            <div className="text-sm text-purple-600 line-through">
              ${status.pricing.originalPrice}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="bg-purple-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${urgencyColors[urgencyLevel]}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-600 mt-1">
            <span>{status.totalRegistered} registered</span>
            <span>{status.percentageFilled}% filled</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-2 border-purple-200 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-purple-900">First 500 Customers</CardTitle>
            <div className="text-sm text-purple-600">Limited time early bird pricing</div>
          </div>
          <Badge variant="secondary" className="bg-purple-600 text-white">
            ${status.pricing.discountAmount} OFF
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Pricing display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-3xl font-bold text-purple-900">
              ${status.pricing.discountedPrice}
            </div>
            <div className="text-xl text-gray-500 line-through">
              ${status.pricing.originalPrice}
            </div>
          </div>
          <div className="text-sm text-purple-600">
            Save ${status.pricing.discountAmount} • {status.pricing.discountPercentage}% off
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Registered</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{status.totalRegistered}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Purchased</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{status.totalPurchased}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{status.remainingSlots} slots remaining</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${urgencyColors[urgencyLevel]}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span className={`font-medium ${urgencyTextColors[urgencyLevel]}`}>
              {status.percentageFilled}% filled
            </span>
            <span>500</span>
          </div>
        </div>

        {/* Urgency message */}
        {urgencyLevel === 'critical' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Almost full! Only {status.remainingSlots} slots left
              </span>
            </div>
          </div>
        )}

        {urgencyLevel === 'high' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                Filling up fast! {status.remainingSlots} slots remaining
              </span>
            </div>
          </div>
        )}

        {/* Last updated */}
        <div className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

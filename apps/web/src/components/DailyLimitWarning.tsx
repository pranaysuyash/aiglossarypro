import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DailyLimitWarningProps {
  remainingViews: number;
  totalLimit: number;
  resetTime?: string;
}

export function DailyLimitWarning({
  remainingViews,
  totalLimit,
  resetTime = 'tomorrow',
}: DailyLimitWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const percentageUsed = ((totalLimit - remainingViews) / totalLimit) * 100;

  useEffect(() => {
    // Show warning when 80% of daily limit is reached
    if (percentageUsed >= 80) {
      setIsVisible(true);
    }
  }, [percentageUsed]);

  if (!isVisible || remainingViews <= 0) {
    return null;
  }

  const getWarningLevel = () => {
    if (remainingViews <= 5) {return 'critical';}
    if (remainingViews <= 10) {return 'high';}
    return 'medium';
  };

  const warningLevel = getWarningLevel();

  const getWarningStyles = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-900 dark:text-red-100',
          subtext: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-100',
          subtext: 'text-orange-700 dark:text-orange-300',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-900 dark:text-yellow-100',
          subtext: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
    }
  };

  const styles = getWarningStyles();

  return (
    <Card className={`${styles.bg} ${styles.border} mb-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            <CardTitle className={`text-lg ${styles.text}`}>
              {warningLevel === 'critical' ? 'Almost at daily limit!' : 'Approaching daily limit'}
            </CardTitle>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className={`text-sm ${styles.subtext} hover:opacity-70`}
          >
            ×
          </button>
        </div>
        <CardDescription className={styles.subtext}>
          {remainingViews} of {totalLimit} free views remaining today
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${styles.icon}`} />
            <span className={`text-sm ${styles.subtext}`}>Resets {resetTime}</span>
          </div>
          <Button
            onClick={() => (window.location.href = '/upgrade')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            Upgrade for Unlimited
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className={styles.subtext}>Usage</span>
            <span className={styles.subtext}>{Math.round(percentageUsed)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                warningLevel === 'critical'
                  ? 'bg-red-500'
                  : warningLevel === 'high'
                    ? 'bg-orange-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

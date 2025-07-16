import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart components to reduce initial bundle size
const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const LazyLineChart = lazy(() =>
  import('recharts').then(module => ({ default: module.LineChart }))
);
const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const LazyRadarChart = lazy(() =>
  import('recharts').then(module => ({ default: module.RadarChart }))
);

// Chart loading fallback
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full space-y-3">
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className={`w-full h-[${height}px]`} />
    <div className="flex space-x-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

interface LazyChartProps {
  type: 'bar' | 'line' | 'pie' | 'radar';
  height?: number;
  children: React.ReactNode;
}

export function LazyChart({ type, height = 300, children }: LazyChartProps) {
  const getChartComponent = () => {
    switch (type) {
      case 'bar':
        return <LazyBarChart height={height}>{children}</LazyBarChart>;
      case 'line':
        return <LazyLineChart height={height}>{children}</LazyLineChart>;
      case 'pie':
        return <LazyPieChart height={height}>{children}</LazyPieChart>;
      case 'radar':
        return <LazyRadarChart height={height}>{children}</LazyRadarChart>;
      default:
        return <LazyBarChart height={height}>{children}</LazyBarChart>;
    }
  };

  return <Suspense fallback={<ChartSkeleton height={height} />}>{getChartComponent()}</Suspense>;
}

export default LazyChart;

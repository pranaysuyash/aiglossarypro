import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load Mermaid component to reduce initial bundle size
const MermaidDiagram = lazy(() => import('@/components/interactive/MermaidDiagram'));

// Mermaid loading fallback
const MermaidSkeleton = ({ height = 200 }: { height?: number }) => (
  <div className="w-full space-y-3 border rounded-lg p-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className={`w-full h-[${height}px] rounded`} />
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-20" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </div>
);

interface LazyMermaidProps {
  diagram: string;
  title?: string;
  description?: string;
  className?: string;
}

export function LazyMermaid({ diagram, title, description, className }: LazyMermaidProps) {
  return (
    <Suspense fallback={<MermaidSkeleton height={200} />}>
      <MermaidDiagram 
        diagram={diagram}
        title={title}
        description={description}
        className={className}
      />
    </Suspense>
  );
}

export default LazyMermaid;
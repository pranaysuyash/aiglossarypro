'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    'aria-label'?: string;
    'aria-labelledby'?: string;
    indicatorClassName?: string;
  }
>(
  (
    { className, value, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, indicatorClassName, ...props },
    ref
  ) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-valuenow={typeof value === 'number' && !Number.isNaN(value) ? value : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

/**
 * Loading spinner component with different sizes and styles
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    color?: 'primary' | 'secondary' | 'white';
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
};

const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
};

export function LoadingSpinner({
    size = 'md',
    className,
    color = 'primary'
}: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-current border-t-transparent',
                sizeClasses[size],
                colorClasses[color],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}
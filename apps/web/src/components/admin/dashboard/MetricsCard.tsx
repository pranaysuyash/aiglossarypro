import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        label: string;
        isPositive?: boolean;
    };
    icon: LucideIcon;
    gradient: string;
    iconColor: string;
    textColor: string;
}

export function MetricsCard({
    title,
    value,
    trend,
    icon: Icon,
    gradient,
    iconColor,
    textColor,
}: MetricsCardProps) {
    return (
        <div className={`${gradient} rounded-lg p-6 text-white`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className={`${textColor} text-sm`}>{title}</div>
                    <div className="text-3xl font-bold">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    {trend && (
                        <div className={`${textColor} text-sm flex items-center mt-1`}>
                            <Icon className="w-4 h-4 mr-1" />
                            {trend.isPositive !== false ? '+' : ''}{trend.value}% {trend.label}
                        </div>
                    )}
                </div>
                <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
        </div>
    );
}
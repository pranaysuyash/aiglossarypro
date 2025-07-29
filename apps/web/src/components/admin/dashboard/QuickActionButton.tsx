import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    hoverColor: string;
    iconColor: string;
    textColor: string;
}

export function QuickActionButton({
    icon: Icon,
    label,
    onClick,
    hoverColor,
    iconColor,
    textColor,
}: QuickActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${hoverColor} transition-colors group`}
        >
            <div className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 text-gray-400 ${iconColor}`} />
                <div className={`text-sm font-medium text-gray-600 ${textColor}`}>
                    {label}
                </div>
            </div>
        </button>
    );
}
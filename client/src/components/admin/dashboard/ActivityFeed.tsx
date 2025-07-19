
interface ActivityItem {
    id: string;
    timestamp: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    title: string;
}

const getActivityColor = (type: string) => {
    switch (type) {
        case 'success':
            return 'bg-green-500';
        case 'info':
            return 'bg-blue-500';
        case 'warning':
            return 'bg-yellow-500';
        case 'error':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

export function ActivityFeed({ activities, title }: ActivityFeedProps) {
    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="space-y-3">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 text-sm">
                        <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                        <span className="text-gray-500">{activity.timestamp}</span>
                        <span>{activity.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
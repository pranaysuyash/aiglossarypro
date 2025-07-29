/**
 * Chart Dashboard component with lazy-loaded chart libraries
 * Provides various chart types for data visualization
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy } from 'react';

// Lazy load chart components to reduce bundle size
const LineChart = lazy(() =>
    import('recharts').then(module => ({ default: module.LineChart }))
);
const BarChart = lazy(() =>
    import('recharts').then(module => ({ default: module.BarChart }))
);
const PieChart = lazy(() =>
    import('recharts').then(module => ({ default: module.PieChart }))
);
const ResponsiveContainer = lazy(() =>
    import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);
const XAxis = lazy(() =>
    import('recharts').then(module => ({ default: module.XAxis }))
);
const YAxis = lazy(() =>
    import('recharts').then(module => ({ default: module.YAxis }))
);
const CartesianGrid = lazy(() =>
    import('recharts').then(module => ({ default: module.CartesianGrid }))
);
const Tooltip = lazy(() =>
    import('recharts').then(module => ({ default: module.Tooltip }))
);
const Legend = lazy(() =>
    import('recharts').then(module => ({ default: module.Legend }))
);
const Line = lazy(() =>
    import('recharts').then(module => ({ default: module.Line }))
);
const Bar = lazy(() =>
    import('recharts').then(module => ({ default: module.Bar }))
);
const Pie = lazy(() =>
    import('recharts').then(module => ({ default: module.Pie }))
);
const Cell = lazy(() =>
    import('recharts').then(module => ({ default: module.Cell }))
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface ChartDashboardProps {
    data?: ChartData[];
    title?: string;
    type?: 'line' | 'bar' | 'pie';
    width?: number;
    height?: number;
}

function ChartLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Loading chart...</p>
            </div>
        </div>
    );
}

function LineChartComponent({ data, width = 600, height = 300 }: ChartDashboardProps) {
    return (
        <Suspense fallback={<ChartLoading />}>
            <ResponsiveContainer width={width} height={height}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </Suspense>
    );
}

function BarChartComponent({ data, width = 600, height = 300 }: ChartDashboardProps) {
    return (
        <Suspense fallback={<ChartLoading />}>
            <ResponsiveContainer width={width} height={height}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </Suspense>
    );
}

function PieChartComponent({ data, width = 400, height = 400 }: ChartDashboardProps) {
    return (
        <Suspense fallback={<ChartLoading />}>
            <ResponsiveContainer width={width} height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Suspense>
    );
}

export function ChartDashboard({
    data = [],
    title = 'Chart Dashboard',
    type = 'line',
    width,
    height
}: ChartDashboardProps) {
    const renderChart = () => {
        switch (type) {
            case 'bar':
                return <BarChartComponent data={data} width={width} height={height} />;
            case 'pie':
                return <PieChartComponent data={data} width={width} height={height} />;
            case 'line':
            default:
                return <LineChartComponent data={data} width={width} height={height} />;
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {data.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>No data available</p>
                </div>
            ) : (
                renderChart()
            )}
        </div>
    );
}

export default ChartDashboard;
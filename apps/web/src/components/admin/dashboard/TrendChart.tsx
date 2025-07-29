import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TrendData {
    month: string;
    generated: number;
    cost: number;
}

interface TrendChartProps {
    data: TrendData[];
    title: string;
    dataKey: string;
    stroke: string;
    name: string;
}

export function TrendChart({ data, title, dataKey, stroke, name }: TrendChartProps) {
    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={stroke}
                        strokeWidth={2}
                        name={name}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface QualityData {
    name: string;
    value: number;
    color: string;
}

interface QualityPieChartProps {
    data: QualityData[];
    title: string;
}

export function QualityPieChart({ data, title }: QualityPieChartProps) {
    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center text-sm">
                        <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600">
                            {item.name}: {item.value}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
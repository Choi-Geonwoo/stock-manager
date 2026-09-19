import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from "recharts";

// 기본 색상 팔레트 설정
const DEFAULT_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function CommonBarChart({
    title,
    data,
    xKey = "name",
    dataKey = "value",
    color = "#4f46e5",
    height = 350,
    barSize = 30 // 막대 너비 고정
}) {
    return (
        <div className="m3-card">
            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey={xKey} 
                        tick={{ fontSize: 12 }} 
                        interval="preserveStartEnd" 
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                    <Bar 
                        dataKey={dataKey} 
                        fill={color} 
                        barSize={barSize}
                        radius={[4, 4, 0, 0]} // 막대 상단 둥글게
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
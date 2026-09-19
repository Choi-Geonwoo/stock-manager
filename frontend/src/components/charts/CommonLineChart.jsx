import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid // 추가
} from "recharts";

export default function CommonLineChart({
    title,
    data,
    xKey = "name",
    dataKey = "value",
    color = "#10b981",
    height = 350,
    showDots = true // 데이터 포인트 표시 여부
}) {
    return (
        <div className="m3-card">
            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} /> {/* 배경 격자 */}
                    <XAxis 
                        dataKey={xKey} 
                        tick={{ fontSize: 12 }} 
                        interval="preserveStartEnd" // 데이터가 많을 때 축 라벨 생략
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={showDots} // 데이터 포인트 개별 제어
                        activeDot={{ r: 6 }} // 강조 효과
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
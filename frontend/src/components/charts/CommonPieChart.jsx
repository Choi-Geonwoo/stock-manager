import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from "recharts";

// 기본 색상 팔레트 설정
const DEFAULT_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function CommonPieChart({
    title,
    data,
    dataKey = "value",
    nameKey = "name",
    colors = DEFAULT_COLORS, // 색상 배열 추가
    height = 350
}) {
    return (
        <div className="m3-card">
            <h3>{title}</h3>

            <ResponsiveContainer
                width="100%"
                height={height}
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={dataKey}
                        nameKey={nameKey}
                        label={({ payload, percent }) =>
                            `${payload?.name ?? ""} ${(percent * 100).toFixed(1)}%`
                        }
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                // 데이터 객체에 fill 속성이 있으면 우선 사용하고, 없으면 배열에서 순차적으로 선택
                                fill={entry.fill ?? colors[index % colors.length]} 
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
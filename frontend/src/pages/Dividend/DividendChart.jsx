import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import { CommonTable } from "../../components";
import { formatCurrency } from "../../utils/comUtils";

export default function DividendChart({ monthlyTable = [], selectedYear = "", selectedMonth = "" }) {
    const normalizedRows = Array.isArray(monthlyTable)
        ? monthlyTable
        : monthlyTable?.data ?? [];

    const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const monthKeyByNumber = {
        "01": "jan",
        "02": "feb",
        "03": "mar",
        "04": "apr",
        "05": "may",
        "06": "jun",
        "07": "jul",
        "08": "aug",
        "09": "sep",
        "10": "oct",
        "11": "nov",
        "12": "dec",
    };
    const rows = normalizedRows.map((row) => {
        const total = monthKeys.reduce((sum, key) => sum + (Number(row?.[key]) || 0), 0);

        return {
            ...row,
            total,
        };
    });

    const selectedYearText = String(selectedYear || "").trim();
    const selectedMonthText = String(selectedMonth || "").trim();
    const selectedMonthKey = monthKeyByNumber[selectedMonthText] || "";
    const chartData = selectedYearText
        ? monthKeys.map((monthKey, index) => {
            const entry = { month: monthLabels[index] };
            const matchingRows = rows.filter((row) => String(row?.dlngymd ?? "") === selectedYearText);

            matchingRows.forEach((row) => {
                const value = Number(row?.[monthKey]) || 0;
                if (row?.currency === "$") {
                    entry.usd = value;
                }
                if (row?.currency === "₩") {
                    entry.krw = value;
                }
            });

            return entry;
        })
        : rows.reduce((acc, row) => {
            const year = String(row?.dlngymd ?? "");
            if (!year) return acc;

            const existing = acc.find((item) => item.year === year);
            const total = selectedMonthKey
                ? Number(row?.[selectedMonthKey] || 0)
                : Number(row?.total || 0);

            if (existing) {
                if (row?.currency === "$") {
                    existing.usd = (existing.usd || 0) + total;
                }
                if (row?.currency === "₩") {
                    existing.krw = (existing.krw || 0) + total;
                }
                return acc;
            }

            const nextItem = { year };
            if (row?.currency === "$") {
                nextItem.usd = total;
            }
            if (row?.currency === "₩") {
                nextItem.krw = total;
            }

            acc.push(nextItem);
            return acc;
        }, []);

    const chartXAxisKey = selectedYearText ? "month" : "year";
    const chartTitle = selectedYearText
        ? `${selectedYearText}년 월별 배당금 추이`
        : selectedMonthText
            ? `${selectedMonthText}월 연도별 배당금 추이`
            : "연도별 배당금 추이";

    const headers = [
        { label: "년도", key: "dlngymd" },
        { label: "통화", key: "currency" },
        { label: "1월", key: "jan", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "2월", key: "feb", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "3월", key: "mar", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "4월", key: "apr", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "5월", key: "may", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "6월", key: "jun", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "7월", key: "jul", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "8월", key: "aug", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "9월", key: "sep", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "10월", key: "oct", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "11월", key: "nov", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "12월", key: "dec", render: (value, row) => formatCurrency(value, row.currency) },
        { label: "합계", key: "total", render: (value, row) => formatCurrency(value, row.currency) },
    ];

    return (
        <div>
            <div className="m3-card" style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 12 }}>{chartTitle}</h3>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={chartXAxisKey} tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "usd") {
                                    return [formatCurrency(value, "미국"), "미국"];
                                }
                                if (name === "krw") {
                                    return [formatCurrency(value, "한국"), "한국"];
                                }
                                return [value, name];
                            }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="krw" name="한국" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="usd" name="미국" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="dividend-chart-table">
                <CommonTable headers={headers} rows={rows} />
            </div>
        </div>
    );
}
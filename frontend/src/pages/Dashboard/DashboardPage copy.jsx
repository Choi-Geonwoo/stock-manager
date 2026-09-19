import { useEffect, useState } from "react";
import "../styles/dashboard.css";

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

import { dividendsService } from "../../api/dividend/dividendApi";
import { stockService } from "../../api/stock/stockApi";
import { nationService } from "../../api/nation/nationApi";

export default function DashboardPage() {

    const [monthlyData, setMonthlyData] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [nationData, setNationData] = useState([]);
    const [rows, setRows] = useState([]);

    const [stockMap, setStockMap] = useState({});
    const [nationMap, setNationMap] = useState({});

    useEffect(() => {
        load();
    }, []);

    const load = async () => {

        try {

            const [
                dividendRes,
                stockRes,
                nationRes
            ] = await Promise.all([
                dividendsService.getDividends(),
                stockService.getStocks(),
                nationService.getNations()
            ]);

            const dividendRows =
                Array.isArray(dividendRes.data)
                    ? dividendRes.data
                    : [];

            setRows(dividendRows);

            const monthly = {};
            const stock = {};
            const nationDividend = {};

            const stockObj = {};
            const nationObj = {};

            // ==========================
            // 주식 -> 국가 매핑
            // ==========================

            const stocks =
                Array.isArray(stockRes.data?.data)
                    ? stockRes.data.data
                    : Array.isArray(stockRes.data)
                    ? stockRes.data
                    : [];

            stocks.forEach((s) => {

                stockObj[s.stcktea] =
                    s.ntncd;
            });

            // ==========================
            // 국가 -> 국가명 매핑
            // ==========================

            const nations =
                Array.isArray(nationRes.data)
                    ? nationRes.data
                    : [];

            nations.forEach((n) => {

                nationObj[n.ntncd] =
                    n.ntnnm;
            });

            setStockMap(stockObj);
            setNationMap(nationObj);

            // ==========================
            // 집계
            // ==========================

            dividendRows.forEach((r) => {

                const month =
                    r.dlngymd
                        ? r.dlngymd.substring(
                              0,
                              7
                          )
                        : "";

                const amount =
                    Number(
                        r.dvdnd || 0
                    );

                const ticker =
                    r.stcktea;

                const nation =
                    stockObj[ticker];

                if (month) {

                    monthly[month] =
                        (
                            monthly[
                                month
                            ] || 0
                        ) + amount;
                }

                if (ticker) {

                    stock[ticker] =
                        (
                            stock[
                                ticker
                            ] || 0
                        ) + amount;
                }

                if (nation) {

                    nationDividend[
                        nation
                    ] =
                        (
                            nationDividend[
                                nation
                            ] || 0
                        ) + amount;
                }
            });

            setMonthlyData(
                Object.keys(monthly)
                    .sort()
                    .map((k) => ({
                        month: k,
                        value:
                            monthly[k]
                    }))
            );

            setStockData(
                Object.keys(stock).map(
                    (k) => ({
                        name: k,
                        value:
                            stock[k]
                    })
                )
            );

            setNationData(
                Object.keys(
                    nationDividend
                ).map((k) => ({
                    name:
                        nationObj[k] ||
                        k,
                    value:
                        nationDividend[
                            k
                        ]
                }))
            );

        } catch (err) {

            console.error(err);
        }
    };

    const totalDividend =
        rows.reduce(
            (sum, r) =>
                sum +
                Number(
                    r.dvdnd || 0
                ),
            0
        );

    const thisMonth =
        monthlyData.length > 0
            ? monthlyData[
                  monthlyData.length -
                      1
              ].value
            : 0;

    const COLORS = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#14b8a6"
    ];

    return (
        <div className="dashboard-page">

            <h1>
                배당 대시보드
            </h1>

            {/* KPI */}

            <div className="kpi-grid">

                <div className="kpi-card">
                    <h4>
                        총 배당금
                    </h4>
                    <p>
                        {totalDividend.toLocaleString()}
                    </p>
                </div>

                <div className="kpi-card">
                    <h4>
                        보유 종목 수
                    </h4>
                    <p>
                        {stockData.length}
                        개
                    </p>
                </div>

                <div className="kpi-card">
                    <h4>
                        이번달 배당금
                    </h4>
                    <p>
                        {thisMonth.toLocaleString()}
                    </p>
                </div>

            </div>

            {/* 월별 차트 */}

            <div className="card">

                <h3>
                    월별 배당금
                </h3>

                <div
                    style={{
                        width: "100%",
                        height: 350
                    }}
                >

                    <ResponsiveContainer>

                        <BarChart
                            data={
                                monthlyData
                            }
                        >

                            <XAxis
                                dataKey="month"
                            />

                            <YAxis />

                            <Tooltip />

                            <Bar
                                dataKey="value"
                                fill="#3b82f6"
                            />

                        </BarChart>

                    </ResponsiveContainer>

                </div>

            </div>

            <div className="bottom-grid">

                {/* 종목별 */}

                <div className="card">

                    <h3>
                        종목별 배당 비중
                    </h3>

                    <PieChart
                        width={450}
                        height={350}
                    >

                        <Pie
                            data={
                                stockData
                            }
                            dataKey="value"
                            nameKey="name"
                            outerRadius={
                                120
                            }
                            label
                        >

                            {stockData.map(
                                (
                                    entry,
                                    index
                                ) => (
                                    <Cell
                                        key={
                                            index
                                        }
                                        fill={
                                            COLORS[
                                                index %
                                                    COLORS.length
                                            ]
                                        }
                                    />
                                )
                            )}

                        </Pie>

                        <Tooltip />

                    </PieChart>

                </div>

                {/* 국가별 */}

                <div className="card">

                    <h3>
                        국가별 배당 비중
                    </h3>

                    <PieChart
                        width={450}
                        height={350}
                    >

                        <Pie
                            data={
                                nationData
                            }
                            dataKey="value"
                            nameKey="name"
                            outerRadius={
                                120
                            }
                            label
                        >

                            {nationData.map(
                                (
                                    entry,
                                    index
                                ) => (
                                    <Cell
                                        key={
                                            index
                                        }
                                        fill={
                                            COLORS[
                                                index %
                                                    COLORS.length
                                            ]
                                        }
                                    />
                                )
                            )}

                        </Pie>

                        <Tooltip />

                    </PieChart>

                </div>

            </div>

            {/* 최근 배당 */}

            <div className="card">

                <h3>
                    최근 배당 내역
                </h3>

                {rows.length ===
                0 ? (

                    <div>
                        배당 데이터
                        없음
                    </div>

                ) : (

                    rows
                        .slice(-5)
                        .reverse()
                        .map(
                            (
                                r
                            ) => (
                                <div
                                    key={
                                        r.alctndlngdsctn_no
                                    }
                                    className="recent-row"
                                >

                                    <div>
                                        {
                                            r.dlngymd
                                        }
                                    </div>

                                    <div>
                                        {
                                            r.stcktea
                                        }
                                    </div>

                                    <div>
                                        {Number(
                                            r.dvdnd ||
                                                0
                                        ).toLocaleString()}
                                    </div>

                                </div>
                            )
                        )

                )}

            </div>

        </div>
    );
}
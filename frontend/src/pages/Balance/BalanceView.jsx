import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import CommonTable from "../../components/CommonTable";
import CommonExcelDownloadButton from "../../components/excel/CommonExcelDownloadButton";
import CommonModal from "../../components/CommonModal";
import { formatCurrency } from "../../utils/comUtils";

export default function BalanceView({
    balanceList,
    loading
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [countryFilter, setCountryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [selectedStock, setSelectedStock] = useState(null);

    const headers = [
        {
            key: "ntnnm",
            label: "국가"
        },
        {
            key: "stcknm",
            label: "종목명"
        },
        {
            key: "buy_cnt",
            label: "매수"
        },
        {
            key: "sell_cnt",
            label: "매도"
        },
        {
            key: "balance",
            label: "수량"
        },
        {
            key: "avg_dlngamt",
            label: "평균 배당금",
            render: (value, row) => formatCurrency(value, row.ntnnm)
        },
        {
            key: "sum_dlngamt",
            label: "누적 배당금",
            render: (value, row) => formatCurrency(value, row.ntnnm)
        }
    ];

    const summary = useMemo(() => {
        const safeList = Array.isArray(balanceList) ? balanceList : [];

        const totalHoldingCount = safeList.reduce((sum, row) => sum + Number(row.balance || 0), 0);
        const totalDividend = safeList.reduce((sum, row) => sum + Number(row.sum_dlngamt || 0), 0);
        const averageDividend = safeList.length > 0
            ? safeList.reduce((sum, row) => sum + Number(row.avg_dlngamt || 0), 0) / safeList.length
            : 0;
        const countryCount = new Set(safeList.map((row) => row.ntnnm).filter(Boolean)).size;

        return {
            totalHoldingCount,
            totalDividend,
            averageDividend,
            countryCount
        };
    }, [balanceList]);

    const countryDividendData = useMemo(() => {
        const safeList = Array.isArray(balanceList) ? balanceList : [];

        const grouped = safeList.reduce((acc, row) => {
            const nation = row.ntnnm || "기타";
            acc[nation] = (acc[nation] || 0) + Number(row.sum_dlngamt || 0);
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([name, value]) => ({
                name,
                value,
                display: formatCurrency(value, name)
            }))
            .sort((a, b) => b.value - a.value);
    }, [balanceList]);

    const countryOptions = useMemo(() => {
        const uniqueCountries = [...new Set((Array.isArray(balanceList) ? balanceList : []).map((row) => row.ntnnm).filter(Boolean))];
        return uniqueCountries.sort((a, b) => a.localeCompare(b, "ko"));
    }, [balanceList]);

    const filteredBalanceList = useMemo(() => {
        const safeList = Array.isArray(balanceList) ? balanceList : [];
        const keyword = searchTerm.trim().toLowerCase();

        let result = [...safeList];

        if (keyword) {
            result = result.filter((row) => {
                const stockName = String(row.stcknm || "").toLowerCase();
                const nationName = String(row.ntnnm || "").toLowerCase();
                return stockName.includes(keyword) || nationName.includes(keyword);
            });
        }

        if (countryFilter !== "all") {
            result = result.filter((row) => row.ntnnm === countryFilter);
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case "balance_desc":
                    return Number(b.balance || 0) - Number(a.balance || 0);
                case "dividend_desc":
                    return Number(b.sum_dlngamt || 0) - Number(a.sum_dlngamt || 0);
                case "country":
                    return String(a.ntnnm || "").localeCompare(String(b.ntnnm || ""), "ko");
                default:
                    return String(a.stcknm || "").localeCompare(String(b.stcknm || ""), "ko");
            }
        });

        return result;
    }, [balanceList, searchTerm, countryFilter, sortBy]);

    if (loading) {
        return <div>조회 중...</div>;
    }

    return (
        <>
            <div className="balance-summary-grid">
                <div className="balance-summary-card">
                    <span className="balance-summary-label">총 보유 수량</span>
                    <strong>{summary.totalHoldingCount.toLocaleString()}</strong>
                </div>
                <div className="balance-summary-card">
                    <span className="balance-summary-label">총 배당금</span>
                    <strong>{formatCurrency(summary.totalDividend, "한국")}</strong>
                </div>
                <div className="balance-summary-card">
                    <span className="balance-summary-label">평균 배당금</span>
                    <strong>{formatCurrency(summary.averageDividend, "한국")}</strong>
                </div>
                <div className="balance-summary-card">
                    <span className="balance-summary-label">보유 국가</span>
                    <strong>{summary.countryCount}개</strong>
                </div>
            </div>

            <div className="balance-toolbar">
                <div className="balance-search-box">
                    <input
                        className="input"
                        type="text"
                        placeholder="종목명 또는 국가 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="balance-filter-box">
                    <select
                        className="select"
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                    >
                        <option value="all">전체 국가</option>
                        {countryOptions.map((country) => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div className="balance-filter-box">
                    <select
                        className="select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name">종목명순</option>
                        <option value="country">국가순</option>
                        <option value="balance_desc">수량 많은 순</option>
                        <option value="dividend_desc">배당금 많은 순</option>
                    </select>
                </div>

                <button
                    type="button"
                    className="btn btn-gray"
                    onClick={() => {
                        setSearchTerm("");
                        setCountryFilter("all");
                        setSortBy("name");
                    }}
                >
                    초기화
                </button>
            </div>

            <div className="table-header-panel">
                <h3>보유 종목 목록 ({filteredBalanceList.length}건)</h3>
                <CommonExcelDownloadButton
                    rows={filteredBalanceList}
                    headers={headers}
                    fileName={`보유_종목_현황_${new Date().toISOString().slice(0, 10)}.xlsx`}
                    sheetName="보유종목"
                    disabled={loading || filteredBalanceList.length === 0}
                />
            </div>

            {countryDividendData.length > 0 && (
                <div className="m3-card" style={{ marginBottom: 20, padding: 20 }}>
                    <h3 style={{ marginBottom: 16 }}>국가별 누적 배당금</h3>
                    <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countryDividendData} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const nation = props?.payload?.name || "한국";
                                        return [formatCurrency(value, nation), nation];
                                    }}
                                />
                                <Bar dataKey="value" name="누적 배당금" fill="#2563eb" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <CommonTable
                headers={headers}
                rows={filteredBalanceList}
                rowKey="stcknm"
                onRowClick={(row) => setSelectedStock(row)}
            />

            <CommonModal
                open={Boolean(selectedStock)}
                title={`${selectedStock?.stcknm || "종목"} 상세 정보`}
                onClose={() => setSelectedStock(null)}
            >
                {selectedStock && (
                    <div style={{ display: "grid", gap: 12 }}>
                        <div className="detail-row">
                            <span>국가</span>
                            <strong>{selectedStock.ntnnm}</strong>
                        </div>
                        <div className="detail-row">
                            <span>종목명</span>
                            <strong>{selectedStock.stcknm}</strong>
                        </div>
                        <div className="detail-row">
                            <span>매수 수량</span>
                            <strong>{Number(selectedStock.buy_cnt || 0).toLocaleString()}주</strong>
                        </div>
                        <div className="detail-row">
                            <span>매도 수량</span>
                            <strong>{Number(selectedStock.sell_cnt || 0).toLocaleString()}주</strong>
                        </div>
                        <div className="detail-row">
                            <span>현재 보유 수량</span>
                            <strong>{Number(selectedStock.balance || 0).toLocaleString()}주</strong>
                        </div>
                        <div className="detail-row">
                            <span>평균 배당금</span>
                            <strong>{formatCurrency(selectedStock.avg_dlngamt, selectedStock.ntnnm)}</strong>
                        </div>
                        <div className="detail-row">
                            <span>누적 배당금</span>
                            <strong>{formatCurrency(selectedStock.sum_dlngamt, selectedStock.ntnnm)}</strong>
                        </div>
                    </div>
                )}
            </CommonModal>
        </>
    );
}
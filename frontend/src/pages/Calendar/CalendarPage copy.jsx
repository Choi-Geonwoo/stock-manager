import { useEffect, useState } from "react";
import "../styles/calendar.css";
import { dividendsService } from "../../api/dividend/dividendApi";
import { getCurrencySymbol } from "../../utils/comUtils";

export default function CalendarPage() {

    const [dividends, setDividends] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [current, setCurrent] = useState(new Date());
    const [showMonthTotal, setShowMonthTotal] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await dividendsService.getDividends();
            setDividends(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );
        } catch (err) {
            console.error("배당 데이터 로드 실패:", err);
            setDividends([]);
        }
    };

    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= lastDate; i++) cells.push(i);

    const formatDateStr = (day) => {
        if (!day) return "";
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const getDividend = (day) => {
        const date = formatDateStr(day);
        return dividends.filter(d => d.dlngymd === date);
    };

    const selectedDividends = dividends.filter(
        d => d.dlngymd === selectedDate
    );

    const currentMonthDividends = dividends.filter(d => {
        if (!d.dlngymd) return false;
        const [dYear, dMonth] = d.dlngymd.split("-");
        return parseInt(dYear) === year && parseInt(dMonth) === (month + 1);
    });

    // 🛠️ 공용 유틸의 통화 기호를 사용합니다.
    const formatCurrency = (amount, ntncd) => {
        const symbol = getCurrencySymbol(ntncd);
        const formattedAmount = amount?.toLocaleString() || 0;
        
        if (symbol === "$") {
            return `${symbol}${formattedAmount}`;
        }
        return `${formattedAmount} ${symbol === "₩" ? "원" : symbol}`;
    };

    return (
        <div className="admin-page-layout">

            <h2>배당 캘린더</h2>

            <div className="calendar-nav">
                <button
                    className="btn btn-gray"
                    onClick={() => {
                        setCurrent(new Date(year, month - 1));
                        setSelectedDate("");
                    }}
                >
                    ◀
                </button>

                <h3>
                    {year}년 {month + 1}월
                </h3>

                <button
                    className="btn btn-gray"
                    onClick={() => {
                        setCurrent(new Date(year, month + 1));
                        setSelectedDate("");
                    }}
                >
                    ▶
                </button>
            </div>

            <div className="calendar-layout">

                {/* 달력 */}
                <div className="calendar-main">
                    <div className="calendar-grid m3-card search-section">
                        {[
                            "일", "월", "화", "수", "목", "금", "토"
                        ].map(d => (
                            <div
                                key={d}
                                className="calendar-head"
                                style={{ color: (d === "일" || d === "토") ? "red" : "black" }}
                            >
                                {d}
                            </div>
                        ))}

                        {cells.map((day, idx) => {
                            const date = formatDateStr(day);
                            const items = day ? getDividend(day) : [];

                            return (
                                <div
                                    key={idx}
                                    className={
                                        selectedDate === date
                                            ? "calendar-cell active"
                                            : "calendar-cell"
                                    }
                                    onClick={() => day && setSelectedDate(date)}
                                >
                                    <div className="calendar-day-number">
                                        {day}
                                    </div>

                                    {items.map(item => (
                                        <div
                                            key={item.alctndlngdsctn_no}
                                            className="dividend-badge"
                                            style={{ 
                                                backgroundColor: item.ntncd === "US" ? "#e8f0fe" : "#e6f4ea",
                                                color: item.ntncd === "US" ? "#1a73e8" : "#137333" 
                                            }}
                                        >
                                            {item.stcktea}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 오른쪽 사이드 영역 */}
                <div className="calendar-side-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px", width: "320px" }}>
                    
                    {/* 1. 선택한 날짜 상세 */}
                    <div className="calendar-side m3-card">
                        <h3>📌 {selectedDate || "날짜 선택"} 내역</h3>

                        {selectedDividends.length === 0 ? (
                            <p className="no-data">선택된 날짜의 내역이 없습니다.</p>
                        ) : (
                            selectedDividends.map(d => (
                                <div key={d.alctndlngdsctn_no} className="side-item">
                                    <div className="side-item-title">
                                        <strong>{d.stcktea}</strong> 
                                        <span style={{ fontSize: "12px", color: "#666", marginLeft: "6px" }}>
                                            ({d.bncd} / {d.ntncd || "KR"})
                                        </span>
                                    </div>
                                    <hr style={{ border: "0.5px solid #eee", margin: "8px 0" }} />
                                    {/* 🛠️ 화폐 포맷팅 반영 */}
                                    <div>• 거래금액: {formatCurrency(d.dlngamt, d.ntncd)}</div>
                                    <div>• 배당금: <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{formatCurrency(d.dvdnd, d.ntncd)}</span></div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 2. 이번 달 전체 거래내역 패널 */}
                    <div className="calendar-side m3-card" style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 style={{ margin: 0 }}>📊 {month + 1}월 전체 내역 ({currentMonthDividends.length}건)</h3>
                            <button 
                                className="btn btn-gray" 
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                                onClick={() => setShowMonthTotal(!showMonthTotal)}
                            >
                                {showMonthTotal ? "접기" : "펼치기"}
                            </button>
                        </div>

                        {showMonthTotal && (
                            <>
                                {/* 💡 안내: 이종 통화(원화/달러)가 섞여있어 합계는 생략하거나 원화 환산이 필요하므로 리스트 가독성에 집중합니다 */}
                                <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {currentMonthDividends.length === 0 ? (
                                        <p className="no-data">이번 달 거래 내역이 없습니다.</p>
                                    ) : (
                                        currentMonthDividends.map(d => (
                                            <div 
                                                key={d.alctndlngdsctn_no} 
                                                className="side-item"
                                                style={{ 
                                                    padding: "8px", 
                                                    background: "#f8f9fa", 
                                                    borderLeft: d.ntncd === "US" ? "4px solid #1a73e8" : "4px solid #34a853", 
                                                    cursor: "pointer" 
                                                }}
                                                onClick={() => setSelectedDate(d.dlngymd)}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                                    <strong>{d.stcktea} <span style={{ fontSize: "11px", fontWeight: "normal", color: "#888" }}>({d.ntncd || "KR"})</span></strong>
                                                    <span style={{ color: "#666", fontSize: "11px" }}>{d.dlngymd}</span>
                                                </div>
                                                {/* 🛠️ 리스트 우측 금액에도 화폐 포맷팅 반영 */}
                                                <div style={{ fontSize: "12px", color: "#2e7d32", textAlign: "right", fontWeight: "500", marginTop: "4px" }}>
                                                    +{formatCurrency(d.dvdnd, d.ntncd)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div> {/* 사이드 영역 끝 */}

            </div>
        </div>
    );
}
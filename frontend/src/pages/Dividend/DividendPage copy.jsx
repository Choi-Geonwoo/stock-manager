import { useEffect, useState } from "react";
import { CommonSelect } from "../components";
import { dividendsService } from "../../api/dividend/dividendApi";
import { bankService } from "../../api/bank/bankApi";
import { stockService } from "../../api/stock/stockApi";

// 새로 분리한 컴포넌트 import
import DividendList from "./DividendList";
import DividendChart from "./DividendChart";

export default function DividendPage() {
    const emptyForm = {
        alctndlngdsctn_no: "",
        bncd: "",
        stcktea: "",
        dlngymd: "",
        dlngamt: "",
        dvdnd: "",
        filenm: ""
    };

    const [dividends, setDividends] = useState([]);
    const [banks, setBanks] = useState([]);
    const [stocks, setStocks] = useState([]);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [openSave, setOpenSave] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);

    const [detail, setDetail] = useState({});
    const [form, setForm] = useState(emptyForm);

    const [tab, setTab] = useState("list");

    const [monthlyData, setMonthlyData] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [nationData, setNationData] = useState([]);

    const [searchYear, setSearchYear] = useState("");
    const [searchMonth, setSearchMonth] = useState("");
    const [searchBank, setSearchBank] = useState("");
    const [searchStock, setSearchStock] = useState("");

    const changeForm = (key, value) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const changeDetail = (key, value) =>
        setDetail(prev => ({ ...(prev || {}), [key]: value }));

    const resetForm = () => {
        setForm(emptyForm);
        setFile(null);
        setPreview(null);
    };

    // 🛠️ 2차원 배열 데이터 형식 파싱 및 매핑 방어 코드 적용
    const buildChartData = (rows) => {
        const monthly = {};
        const stock = {};
        const nation = {};

        // 💡 stocks의 2차원 배열 데이터와 객체 데이터를 모두 호환하도록 안전하게 수정
        const stockMap = Object.fromEntries(
            stocks.map(s => {
                const ticker = Array.isArray(s) ? s[2] : (s.stcktea || s.ticker);
                const nationCd = Array.isArray(s) ? s[1] : (s.ntncd || "");
                return [ticker, { ticker, ntncd: nationCd }];
            })
        );

        rows.forEach((r) => {
            const month = r.dlngymd ? r.dlngymd.substring(0, 4) + "-" + r.dlngymd.substring(4, 6) : "";
            const amount = Number(r.dvdnd) || 0;
            const ticker = r.stcktea || "";

            if (month) monthly[month] = (monthly[month] || 0) + amount;
            if (ticker) stock[ticker] = (stock[ticker] || 0) + amount;

            const stockInfo = stockMap[ticker];
            const nationCd = stockInfo?.ntncd;
            if (nationCd) nation[nationCd] = (nation[nationCd] || 0) + amount;
        });

        setMonthlyData(
            Object.keys(monthly).sort().map(k => ({ month: k, value: monthly[k] }))
        );
        setStockData(
            Object.keys(stock).map(k => ({ name: k, value: stock[k] }))
        );
        setNationData(
            Object.keys(nation).map(k => ({ name: k, value: nation[k] }))
        );
    };

    const loadDividends = async () => {
        try {
            const res = await dividendsService.getDividends();
            const rows = Array.isArray(res.data) ? res.data : [];
            setDividends(rows);
            buildChartData(rows);
        } catch (err) {
            console.error(err);
            alert("배당 목록 조회 실패");
        }
    };

    const loadBanks = async () => {
        const res = await bankService.getBanks();
        if (Array.isArray(res.data)) setBanks(res.data);
    };

    const loadStocks = async () => {
        const res = await stockService.getStocks();
        if (Array.isArray(res.data?.data)) {
            setStocks(res.data.data);
        } else {
            setStocks([]);
        }
    };

    useEffect(() => {
        loadBanks();
        loadStocks();
    }, []);

    useEffect(() => {
        if (stocks.length > 0) {
            loadDividends();
        }
    }, [stocks]);

    const save = async () => {
        try {
            let uploadedFileName = null;

            // 💡 1. 파일이 존재하면 이미지 업로드 API 먼저 처리
            if (file) {
                const cleanDate = String(form.dlngymd).replace(/[^0-9]/g, ""); // YYYYMMDD
                const uploadRes = await dividendsService.uploadDividendFile(file, cleanDate);
                
                if (uploadRes.data && uploadRes.data.filename) {
                    uploadedFileName = uploadRes.data.filename;
                }
            }

            // 💡 2. 업로드 성공해서 받은 파일명(없으면 null)을 얹어서 데이터 등록
            const savePayload = {
                bncd: form.bncd,
                stcktea: form.stcktea, // 진짜 티커 코드
                dlngymd: form.dlngymd,
                dlngamt: Number(form.dlngamt),
                dvdnd: Number(form.dvdnd),
                filenm: uploadedFileName // 백엔드가 돌려준 파일명 매핑
            };

            const response = await dividendsService.createDividend(savePayload);
            
            if (response.data.result === "success") {
                alert("등록완료");
                setOpenSave(false);
                setFile(null);
                setPreview(null);
                await dividendsService.getDividends(); // 목록 새로고침 (함수명이 다르면 본인 코드로 매핑)
            } else {
                alert(`등록 실패: ${response.data.message}`);
            }
        } catch (error) {
            console.error("등록 중 오류 발생:", error);
            alert("등록 중 문제가 발생했습니다.");
        }
    };

    const update = async () => {
        try {
            // 기본값은 기존에 가지고 있던 파일명
            let uploadedFileName = detail.filenm || null;

            // 💡 1. 사용자가 새 이미지를 모달에서 바꿨을(추가했을) 때만 업로드 진행
            console.log(file);
            if (file) {
                const cleanDate = String(detail.dlngymd).replace(/[^0-9]/g, ""); // YYYYMMDD
                
                // 💡 중요: 파일 객체, 정제된 날짜, 그리고 상세창의 '거래번호'를 순서대로 전달!
                const uploadRes = await dividendsService.uploadDividendFile(
                    file, 
                    cleanDate, 
                    detail.alctndlngdsctn_no
                );
                
                if (uploadRes.data && uploadRes.data.filename) {
                    uploadedFileName = uploadRes.data.filename;
                }
            }

            // 💡 2. 변경되었거나 유지된 파일명을 꽂아서 최종 수정 API 호출
            const updatePayload = {
                alctndlngdsctn_no: detail.alctndlngdsctn_no,
                bncd: detail.bncd,
                stcktea: detail.stcktea,
                dlngymd: detail.dlngymd,
                dlngamt: Number(detail.dlngamt),
                dvdnd: Number(detail.dvdnd),
                filenm: uploadedFileName || ""
            };
            console.log("서버로 보내는 데이터:", detail); // 👈 F12 콘솔에서 이 값이 어떻게 찍히는지 보세요!
            const response = await dividendsService.updateDividend(updatePayload);

            if (response.data.result === "success") {
                alert("수정완료");
                setOpenDetail(false);
                setFile(null);
                setPreview(null);
                await dividendsService.getDividends(); // 목록 새로고침
            } else {
                alert(`수정 실패: ${response.data.message}`);
            }
        } catch (error) {
            console.error("수정 중 오류 발생:", error);
            alert("수정 중 문제가 발생했습니다.");
        }
    };

    const remove = async (id) => {
        try {
            if (!confirm(`[${id}] 삭제하시겠습니까?`)) return;
            await dividendsService.deleteDividend(id);

            if (searchYear || searchMonth || searchBank || searchStock) {
                await search();
            } else {
                await loadDividends();
            }
            alert("삭제되었습니다.");
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    const search = async () => {
        try {
            const res = await dividendsService.searchDividends(searchYear, searchMonth, searchBank, searchStock);
            const rows = Array.isArray(res.data) ? res.data : [];
            setDividends(rows);
            buildChartData(rows);
        } catch (err) {
            console.error(err);
            alert("검색 실패");
        }
    };

    return (
        <div className="admin-page-layout">
            <h2>배당 거래 관리</h2>

            <div className="m3-card">
                <div className="form-row">
                    <CommonSelect
                        label="년도"
                        value={searchYear}
                        onChange={(e) => setSearchYear(e.target.value)}
                        options={Array.from({ length: 10 }, (_, i) => {
                            const y = String(2020 + i);
                            return { value: y, label: y + "년" };
                        })}
                    />
                    <CommonSelect
                        label="월"
                        value={searchMonth}
                        onChange={(e) => setSearchMonth(e.target.value)}
                        options={Array.from({ length: 12 }, (_, i) => {
                            const m = String(i + 1).padStart(2, "0");
                            return { value: m, label: m + "월" };
                        })}
                    />
                </div>

                <div className="form-row">
                    <CommonSelect
                        label="은행"
                        value={searchBank}
                        onChange={(e) => setSearchBank(e.target.value)}
                        options={banks.map((b) => {
                            const code = Array.isArray(b) ? b[1] : (b.bncd || b.bnkcd);
                            const name = Array.isArray(b) ? b[2] : (b.bnnm || b.bnknm);
                            return { value: code || "", label: name || code || "" };
                        })}
                    />
                    <CommonSelect
                        label="주식"
                        value={searchStock}
                        onChange={(e) => setSearchStock(e.target.value)}
                        options={stocks.map((s) => {
                            const ticker = Array.isArray(s) ? s[2] : (s.stcktea || s.ticker);
                            const name = Array.isArray(s) ? s[3] : (s.stcknm || s.stck_nm);
                            return { value: ticker || "", label: name || ticker || "" };
                        })}
                    />
                </div>

                <div className="form-actions">
                    <button className="btn btn-primary" onClick={search}>검색</button>
                    <button className="btn btn-gray" onClick={async () => {
                        setSearchYear("");
                        setSearchMonth("");
                        setSearchBank("");
                        setSearchStock("");
                        await loadDividends();
                    }}>전체</button>
                    <button className="btn btn-success" onClick={() => setOpenSave(true)}>등록</button>
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button className={tab === "list" ? "btn btn-primary" : "btn btn-gray"} onClick={() => setTab("list")}>거래내역</button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button className={tab === "chart" ? "btn btn-primary" : "btn btn-gray"} onClick={() => setTab("chart")}>그래프</button>
            </div>

            {tab === "list" && (
                <DividendList
                    dividends={dividends}
                    openSave={openSave}
                    setOpenSave={setOpenSave}
                    openDetail={openDetail}
                    setOpenDetail={setOpenDetail}
                    form={form}
                    changeForm={changeForm}
                    detail={detail}
                    setDetail={setDetail}
                    changeDetail={changeDetail} // 💡 자식 컴포넌트에 누락되었던 핵심 함수 주입 완료!
                    banks={banks}
                    stocks={stocks}
                    file={file}
                    setFile={setFile}
                    preview={preview}
                    setPreview={setPreview}
                    save={save}
                    update={update}
                    remove={remove}
                />
            )}

            {tab === "chart" && (
                <DividendChart
                    monthlyData={monthlyData}
                    stockData={stockData}
                    nationData={nationData}
                />
            )}
        </div>
    );
}
import { useEffect, useState } from "react";
import {
    CrudButtons,
    CommonInput,
    CommonSelect,
    CommonTable,
    CommonPagination // 🛠️ 공통 페이징 컴포넌트 임포트
} from "../../components";
import { stockService } from "../../api/stock/stockApi";
import { nationService } from "../../api/nation/nationApi";

const initialForm = {
    ntncd: "",
    stcktea: "",
    stcknm: "",
    alctn: "",
    useyn: "Y"
};

export default function StockPage() {
    const [stocks, setStocks] = useState([]);
    const [nations, setNations] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [keyword, setKeyword] = useState("");

    // 페이징 상태
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const loadNations = async () => {
        try {
            const res = await nationService.getNations();
            if (Array.isArray(res.data)) setNations(res.data);
            else setNations([]);
        } catch (err) {
            console.error(err);
            setNations([]);
        }
    };

    const loadStocks = async (currentPage = 1) => {
        try {
            const res = await stockService.getStocks(currentPage, pageSize);
            if (res.data && Array.isArray(res.data.data)) {
                setStocks(res.data.data);
                setTotal(res.data.total);
                setPage(currentPage);
            } else {
                setStocks([]);
                setTotal(0);
            }
        } catch (err) {
            console.error(err);
            setStocks([]);
            setTotal(0);
        }
    };

    useEffect(() => {
        loadStocks(1);
        loadNations();
    }, []);

    const validateForm = () => {
        if (!form.ntncd) return alert("국가를 선택하세요."), false;
        if (!form.stcktea.trim()) return alert("주식 티커를 입력하세요."), false;
        if (!form.stcknm.trim()) return alert("주식명을 입력하세요."), false;
        if (!form.alctn) return alert("배당주기를 선택하세요."), false;
        if (!form.useyn) return alert("사용여부를 선택하세요."), false;
        return true;
    };

    const save = async () => {
        if (!validateForm()) return;
        try {
            const res = await stockService.createStock(form);
            alert(res.data.message || "저장되었습니다.");
            if (res.data.result === "success" || res.status === 200) {
                setForm(initialForm);
                await loadStocks(1);
            }
        } catch (err) {
            console.error(err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            await stockService.deleteStock(id);
            alert("삭제되었습니다.");
            await loadStocks(page);
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    const reset = async () => {
        try {
            await stockService.resetStock();
            setForm(initialForm);
            setKeyword(""); 
            await loadStocks(1);
        } catch (err) {
            console.error(err);
            alert("초기화 실패");
        }
    };

    const handleSearch = () => {
        if (!keyword.trim()) { loadStocks(1); return; }
        const filtered = stocks.filter(stock => 
            (stock.stcknm && stock.stcknm.includes(keyword)) || 
            (stock.stcktea && stock.stcktea.includes(keyword.toUpperCase()))
        );
        setStocks(filtered);
    };

    // 가상 일련번호 매핑
    const computedStocks = stocks.map((stock, index) => ({
        ...stock,
        row_index: (page - 1) * pageSize + index + 1
    }));

    const headers = [
        { key: "row_index", label: "순번" },
        { key: "ntncd", label: "국가코드" },
        { key: "stcktea", label: "티커" },
        { key: "stcknm", label: "주식명" },
        { key: "alctn", label: "배당주기" },
        { key: "useyn", label: "사용여부", render: (val) => val === "Y" ? "사용" : "미사용" }
    ];

    return (
        <div className="admin-page-layout">
            <h2>주식 정보 관리</h2>

            {/* 검색 영역 */}
            <div className="m3-card search-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>주식 검색</h3>
                <div className="form-row">
                    <CommonInput
                        label="검색어"
                        placeholder="주식명 또는 티커 입력"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    />
                </div>
                <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSearch}>검색</button>
                    <button className="btn btn-gray" onClick={() => { setKeyword(""); loadStocks(1); }}>전체</button>
                </div>
            </div>

            {/* 등록 영역 */}
            <div className="m3-card register-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>주식 등록</h3>
                <div className="form-row">
                    <CommonSelect
                        label="국가"
                        value={form.ntncd}
                        onChange={(e) => setForm({ ...form, ntncd: e.target.value })}
                        options={nations.map((n) => ({
                            value: n[1] || n.ntncd,
                            label: n[2] ? `${n[1]} - ${n[2]}` : `${n.ntncd} - ${n.ntnnm}`
                        }))}
                    />
                    <CommonInput
                        label="티커"
                        placeholder="티커"
                        value={form.stcktea}
                        onChange={(e) => setForm({ ...form, stcktea: e.target.value.toUpperCase() })}
                    />
                    <CommonInput
                        label="주식명"
                        placeholder="주식명"
                        value={form.stcknm}
                        onChange={(e) => setForm({ ...form, stcknm: e.target.value })}
                    />
                </div>
                <div className="form-row">
                    <CommonSelect
                        label="배당주기"
                        value={form.alctn}
                        onChange={(e) => setForm({ ...form, alctn: e.target.value })}
                        options={[
                            { value: "월", label: "월" },
                            { value: "02,05,08,11", label: "02,05,08,11" },
                            { value: "03,06,09,12", label: "03,06,09,12" },
                            { value: "04,07,10,12", label: "04,07,10,12" },
                            { value: "반기", label: "반기" },
                            { value: "년", label: "년" }
                        ]}
                    />
                    <CommonSelect
                        label="사용여부"
                        value={form.useyn}
                        onChange={(e) => setForm({ ...form, useyn: e.target.value })}
                        options={[
                            { value: "Y", label: "사용" },
                            { value: "N", label: "미사용" }
                        ]}
                    />
                    <div className="horizontal-form-group display_hidden">
                        <span className="form-text-label">1</span>
                        <div className="input-block"><input className="input" disabled /></div>
                    </div>
                </div>
                <div className="form-actions">
                    <CrudButtons onSave={save} onReset={reset} canSearch={false} />
                </div>
            </div>

            {/* 목록 영역 */}
            <div className="m3-card result-section">
                <div className="table-header-panel" style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0, color: "#44474e" }}>
                        주식 목록 (총 {total}건 / {page}페이지)
                    </h3>
                </div>

                <CommonTable
                    headers={headers}
                    rows={computedStocks}
                    rowKey="stckinfo_no"
                    onDelete={remove}
                />

                {/* 🛠️ [수정] 복잡한 연산 구문을 날려버리고 공통 컴포넌트로 깔끔하게 대체 */}
                <CommonPagination 
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={(targetPage) => loadStocks(targetPage)}
                />
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";

import {
    CrudButtons,
    CommonInput,
    CommonSelect,
    CommonTable,
    CommonExcelUploadModal,
    CommonPagination 
} from "../components";

import { tradeService } from "../../api/trade/tradeApi";
import { bankService } from "../../api/bank/bankApi";
import { stockService } from "../../api/stock/stockApi";

export default function TradePage() {

    const [trades, setTrades] = useState([]);
    const [banks, setBanks] = useState([]);
    const [stocks, setStocks] = useState([]);
    
    // 🛠️ 페이징 상태 연동
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // 🔍 기간 및 다중 콤보박스 검색을 위한 상태 정의
    const initialSearchState = {
        startDate: "",  // 시작 거래일자
        endDate: "",    // 종료 거래일자
        bncd: "",       // 은행코드
        stcktea: "",    // 티커
        clsf: "",       // 항목구분
        byngyn: ""      // 매수여부
    };
    const [searchForm, setSearchForm] = useState(initialSearchState);

    // 등록 폼 상태
    const initialFormState = {
        dlngymd: "",
        bncd: "",
        stcktea: "",
        dlngamt: "",
        clsf: "1",
        byngyn: "Y",
        stckcnt: ""
    };
    const [form, setForm] = useState(initialFormState);

    // 🛠️ [수정] 거래 내역 조회 (서버 사이드 페이징 파라미터 적용)
    const loadTrades = async (currentPage = 1) => {
        try {
            const res = await tradeService.getTrades(currentPage, pageSize);
            
            // 백엔드 반환 포맷 { data: [...], total: 100 } 구조 동기화
            if (res.data && Array.isArray(res.data.data)) {
                setTrades(res.data.data);
                setTotal(res.data.total);
                setPage(currentPage);
            } else {
                setTrades([]);
                setTotal(0);
            }
        } catch (err) {
            console.error(err);
            setTrades([]);
            setTotal(0);
        }
    };

    const loadBanks = async () => {
        try {
            const res = await bankService.getBanks();
            if (Array.isArray(res.data)) {
                setBanks(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // 🛠️ [수정] 등록 컴포넌트 콤보박스용 주식 데이터 로드
    // 셀렉트박스 안에는 모든 주식이 나와야 하므로 임의로 큰 사이즈(9999)를 주어 전체 목록을 수집합니다.
    const loadStocks = async () => {
        try {
            const res = await stockService.getStocks(1, 9999);
            if (res.data && Array.isArray(res.data.data)) {
                setStocks(res.data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadTrades(1);
        loadBanks();
        loadStocks();
    }, []);

    // 🔍 다중 조건 검색 처리 핸들러
    const handleSearch = async () => {
        try {

            const params = {
                page: 1,
                size: pageSize,
                startDate: searchForm.startDate,
                endDate: searchForm.endDate,
                bncd: searchForm.bncd,
                stcktea: searchForm.stcktea,
                clsf: searchForm.clsf,
                byngyn: searchForm.byngyn
            };

            const res = await tradeService.searchTrades(params);

            console.log("검색결과", res.data);

            if (res.data && Array.isArray(res.data.data)) {

                setTrades(res.data.data);
                setTotal(res.data.total);
                setPage(res.data.page);

            } else {

                setTrades([]);
                setTotal(0);
                setPage(1);

            }

        } catch (err) {

            console.error(err);
            alert("검색 중 오류가 발생했습니다.");

        }
    };

    // 🔍 검색 조건 초기화
    const handleSearchAll = () => {
        setSearchForm(initialSearchState);
        loadTrades(1);
    };

    // 폼 검증
    const validateForm = () => {
        if (!form.dlngymd) return "거래일자를 입력해주세요.";
        if (!form.bncd) return "은행/증권을 선택해주세요.";
        if (!form.stcktea) return "티커를 선택해주세요.";
        if (!form.dlngamt || isNaN(form.dlngamt)) return "올바른 거래금액을 입력해주세요.";
        if (!form.stckcnt || isNaN(form.stckcnt)) return "올바른 주식수를 입력해주세요.";
        if (!form.clsf) return "항목구분을 선택해주세요.";
        if (!form.byngyn) return "매수여부를 선택해주세요.";
        return null;
    };

    // 등록 저장
    const save = async () => {
        const errorMsg = validateForm();
        if (errorMsg) {
            alert(errorMsg);
            return;
        }

        try {
            const res = await tradeService.createTrade(form);
            alert(res.data.message || "저장되었습니다.");

            if (res.data.result === "success" || res.status === 200) {
                setForm(initialFormState);
                loadTrades(1); // 첫 페이지로 이동하여 새로고침
            }
        } catch (err) {
            console.error(err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // 삭제
    const remove = async (id) => {
        const ok = confirm("삭제하시겠습니까?");
        if (!ok) return;

        try {
            await tradeService.deleteTrade(id);
            alert("삭제되었습니다.");
            loadTrades(page); // 현재 보던 페이지 유지하며 갱신
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    // 초기화
    const reset = async () => {
        if (!confirm("데이터 전체를 리셋하시겠습니까?")) return;
        try {
            await tradeService.resetTrade();
            setForm(initialFormState);
            loadTrades(1);
        } catch (err) {
            console.error(err);
            alert("초기화 실패");
        }
    };

    // 🛠️ 페이징과 유기적으로 작동하는 가상 일련번호 부여 계산식 추가
    const computedTrades = trades.map((trade, index) => ({
        ...trade,
        row_index: (page - 1) * pageSize + index + 1
    }));

    // 테이블 헤더 명세 (trade_no 대신 가상 순번 row_index 바인딩)
    const tableHeaders = [
        { key: "row_index", label: "순번" },
        { key: "dlngymd"
        , label: "거래일자" 
        , render: (val) => val && val.length === 8 ? val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : val
        },
        { key: "bnnm", label: "은행/증권명" },
        { key: "stcknm", label: "종목명" },
        { 
            key: "dlngamt", 
            label: "거래금액",
            render: (val) => val ? Number(val).toLocaleString() : "0"
        },
        { 
            key: "clsf", 
            label: "구분",
            render: (val) => {
                if (val === "3") return "일반계좌";
                if (val === "2") return "퇴직연금";
                if (val === "1") return "연금저축";
                return val;
            }
        },
        { 
            key: "byngyn", 
            label: "매수여부",
            render: (val) => (val === "Y" ? "매수" : "매도")
        },
        { 
            key: "stckcnt", 
            label: "주식수",
            render: (val) => val ? Number(val).toLocaleString() : "0"
        }
    ];

    return (
        <div className="admin-page-layout">

            <h2>주식 거래 내역 관리</h2>

            {/* 1. 검색 조건 영역 */}
            <div className="m3-card search-section">
                <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 20px 0', color: '#44474e' }}>
                    거래내역 조건 검색
                </h3>
                
                <div className="form-row">
                    <CommonInput
                        label="시작일자"
                        type="date"
                        value={searchForm.startDate}
                        onChange={(e) => setSearchForm({ ...searchForm, startDate: e.target.value })}
                    />
                    <CommonInput
                        label="종료일자"
                        type="date"
                        value={searchForm.endDate}
                        onChange={(e) => setSearchForm({ ...searchForm, endDate: e.target.value })}
                    />
                    <CommonSelect
                        label="은행/증권"
                        value={searchForm.bncd}
                        onChange={(e) => setSearchForm({ ...searchForm, bncd: e.target.value })}
                        options={banks.map((b) => ({
                            value: b.bncd || b[1],
                            label: b.bnnm ? `${b.bncd} - ${b.bnnm}` : `${b[1]} - ${b[2]}`
                        }))}
                    />
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                    <CommonSelect
                        label="주식티커"
                        value={searchForm.stcktea}
                        onChange={(e) => setSearchForm({ ...searchForm, stcktea: e.target.value })}
                        options={stocks.map((s) => ({
                            value: s.stcktea || s[2],
                            label: s.stcknm ? `${s.stcktea} - ${s.stcknm}` : `${s[2]} - ${s[3]}`
                        }))}
                    />
                    <CommonSelect
                        label="항목구분"
                        value={searchForm.clsf}
                        onChange={(e) => setSearchForm({ ...searchForm, clsf: e.target.value })}
                        options={[
                            { value: "4", label: "ISA계좌" },
                            { value: "3", label: "일반계좌" },
                            { value: "2", label: "퇴직연금" },
                            { value: "1", label: "연금저축" }
                        ]}
                    />
                    <CommonSelect
                        label="매수여부"
                        value={searchForm.byngyn}
                        onChange={(e) => setSearchForm({ ...searchForm, byngyn: e.target.value })}
                        options={[
                            { value: "Y", label: "매수" },
                            { value: "N", label: "매도" }
                        ]}
                    />
                </div>

                <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="btn btn-primary" onClick={handleSearch}>검색</button>
                    <button className="btn btn-gray" onClick={handleSearchAll}>전체 초기화</button>
                </div>
            </div>

            {/* 2. 신규 등록 영역 */}
            <div className="m3-card search-section">
                <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 20px 0', color: '#44474e' }}>
                    거래내역 등록
                </h3>

                <div className="form-row">
                    <CommonInput
                        label="거래일자"
                        type="date"
                        value={form.dlngymd}
                        onChange={(e) => setForm({ ...form, dlngymd: e.target.value })}
                    />
                    <CommonSelect
                        label="은행/증권"
                        value={form.bncd}
                        onChange={(e) => setForm({ ...form, bncd: e.target.value })}
                        options={banks.map((b) => ({
                            value: b.bncd || b[1],
                            label: b.bnnm ? `${b.bncd} - ${b.bnnm}` : `${b[1]} - ${b[2]}`
                        }))}
                    />
                    <CommonSelect
                        label="티커"
                        value={form.stcktea}
                        onChange={(e) => setForm({ ...form, stcktea: e.target.value })}
                        options={stocks.map((s) => ({
                            value: s.stcktea || s[2],
                            label: s.stcknm ? `${s.stcktea} - ${s.stcknm}` : `${s[2]} - ${s[3]}`
                        }))}
                    />
                    <CommonInput
                        label="거래금액"
                        placeholder="거래금액"
                        value={form.dlngamt}
                        onChange={(e) => setForm({ ...form, dlngamt: e.target.value })}
                    />
                </div>

                <div className="form-row">
                    <CommonInput
                        label="주식수"
                        placeholder="주식수"
                        value={form.stckcnt}
                        onChange={(e) => setForm({ ...form, stckcnt: e.target.value })}
                    />
                    <CommonSelect
                        label="항목구분"
                        value={form.clsf}
                        onChange={(e) => setForm({ ...form, clsf: e.target.value })}
                        options={[
                            { value: "4", label: "ISA계좌" },
                            { value: "3", label: "일반계좌" },
                            { value: "2", label: "퇴직연금" },
                            { value: "1", label: "연금저축" }
                        ]}
                    />
                    <CommonSelect
                        label="매수여부"
                        value={form.byngyn}
                        onChange={(e) => setForm({ ...form, byngyn: e.target.value })}
                        options={[
                            { value: "Y", label: "매수" },
                            { value: "N", label: "매도" }
                        ]}
                    />
                    <div className="horizontal-form-group display_hidden">
                        <span className="form-text-label">1</span>
                        <div className="input-block">
                            <input className="input" disabled />
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    <CrudButtons
                        onSave={save}
                        onReset={reset}
                        canSearch={false}
                    />
                </div>
            </div>

            {/* 3. 결과 목록 영역 */}
            <div className="m3-card result-section">
                <div className="table-header-panel" style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0, color: "#44474e" }}>
                        주식 거래 목록 (총 {total}건 / {page}페이지)
                    </h3>
                </div>

                <CommonTable
                    rowKey="trade_no" // 내부 삭제 연동용 key 유지
                    headers={tableHeaders}
                    rows={computedTrades} // 🛠️ 순번 연산이 완료된 가공 리스트 바인딩
                    onDelete={remove}
                />
                
                {/* 🛠️ [수정 완료] 거래 데이터를 로드하는 loadTrades 로 연동 타겟 교체 */}
                <CommonPagination 
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={(targetPage) => loadTrades(targetPage)}
                />
            </div>
        </div>
    );
}
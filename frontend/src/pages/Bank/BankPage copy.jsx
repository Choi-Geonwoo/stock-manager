import { useEffect, useState } from "react";
import {
    CrudButtons,
    CommonInput,
    CommonSelect,
    CommonTable,
    CommonExcelUploadModal // 사용 여부에 따라 활성화 필요
} from "../components";
import { bankService } from "../../api/bank/bankApi";

export default function BankPage() {
    const [banks, setBanks] = useState([]);
    const [form, setForm] = useState({
        bncd: "",
        bnnm: "",
        useyn: "Y"
    });
    const [searchField, setSearchField] = useState("bncd");
    const [keyword, setKeyword] = useState("");
    const [openExcelUpload, setOpenExcelUpload] = useState(false);

    // 1. 은행 목록 조회 (공통 에러 핸들링 추가)
    const loadBanks = async () => {
        try {
            const res = await bankService.getBanks();
            if (Array.isArray(res.data)) {
                setBanks(res.data);
            } else {
                console.error(res.data?.message || "데이터 형식이 올바르지 않습니다.");
                setBanks([]);
            }
        } catch (err) {
            console.error("은행 목록 로드 실패:", err);
            setBanks([]);
        }
    };

    useEffect(() => {
        loadBanks();
    }, []);

    // 2. 은행 검색 (try-catch 예외 처리 및 검증 추가)
    const search = async () => {
        try {
            const res = await bankService.searchBanks(searchField, keyword.trim());
            if (Array.isArray(res.data)) {
                setBanks(res.data);
            } else {
                setBanks([]);
            }
        } catch (err) {
            console.error("검색 실패:", err);
            alert("검색 중 오류가 발생했습니다.");
        }
    };

    // 3. 은행 정보 저장
    const save = async () => {
        if (!form.bncd.trim()) {
            alert("은행/증권코드를 입력하세요.");
            return;
        }
        if (!form.bnnm.trim()) {
            alert("은행/증권명을 입력하세요.");
            return;
        }

        try {
            const res = await bankService.createBank(form);
            alert(res.data?.message || "저장되었습니다.");
            
            // 폼 초기화 및 재조회
            setForm({ bncd: "", bnnm: "", useyn: "Y" });
            loadBanks();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // 4. 은행 정보 삭제
    const remove = async (id) => {
        const ok = confirm(`[${id}] 삭제하시겠습니까?`);
        if (!ok) return;

        try {
            await bankService.deleteBank(id);
            alert("삭제되었습니다.");
            loadBanks();
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    // 5. 등록 폼 초기화 (서버 reset이 아닌 클라이언트 UI 초기화로 유추 시 수정)
    const resetForm = () => {
        setForm({
            bncd: "",
            bnnm: "",
            useyn: "Y"
        });
    };

    const headers = [
        { key: "bninfr_no", label: "거래번호" },
        { key: "bncd", label: "은행/증권코드" },
        { key: "bnnm", label: "은행/증권명" },
        { key: "useyn", label: "사용여부" , render: (value) => (value === "Y" ? "사용" : "미사용")  },
        { key: "delyn", label: "삭제여부" , render: (value) => (value === "Y" ? "삭제" : "미삭제")  }
        // { key: "regdt", label: "등록일자" },
        //{ key: "upddt", label: "수정일자" }
    ];

    return (
        <div className="admin-page-layout">
            <h2>은행 정보 관리</h2>

            {/* 검색 영역 */}
            <div className="m3-card search-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>
                    은행/증권 검색
                </h3>
                <div className="form-row">
                    <CommonSelect
                        label="검색조건"
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                        options={[
                            { value: "bncd", label: "은행/증권코드" },
                            { value: "bnnm", label: "은행/증권명" }
                        ]}
                    />
                    <CommonInput
                        label="검색어"
                        placeholder="검색어 입력"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") search();
                        }}
                    />
                </div>
                <div className="form-actions">
                    <CrudButtons
                        canSearch={true}
                        canSave={false}
                        onSearch={search}
                        onReset={() => { setKeyword(""); loadBanks(); }} // 검색 초기화 시 키워드도 비움
                    />
                </div>
            </div>

            {/* 엑셀 업로드 버튼 */}
            <div className="form-actions" style={{ margin: "10px 0" }}>
                <button className="btn btn-success" onClick={() => setOpenExcelUpload(true)}>
                    엑셀 업로드
                </button>
            </div>

            {/* 등록 영역 */}
            <div className="m3-card register-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>
                    은행/증권 정보 등록
                </h3>
                <div className="form-row">
                    <CommonInput
                        label="은행코드"
                        placeholder="은행코드"
                        value={form.bncd}
                        onChange={(e) => setForm({ ...form, bncd: e.target.value })}
                    />
                    <CommonInput
                        label="은행/증권명"
                        placeholder="은행/증권명"
                        value={form.bnnm}
                        onChange={(e) => setForm({ ...form, bnnm: e.target.value })}
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
                </div>
                <div className="form-actions">
                    <CrudButtons
                        onSave={save}
                        onReset={resetForm} // 등록 폼 초기화 바인딩
                        canSearch={false}
                    />
                </div>
            </div>

            {/* 결과 영역 */}
            <div className="m3-card result-section">
                <div className="table-header-panel" style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0, color: "#44474e" }}>
                        은행/증권 목록 ({banks.length}건) {/* ⚠️ 크리티컬 버그 수정 */}
                    </h3>
                </div>

                <CommonTable
                    headers={headers}
                    rows={banks}
                    rowKey="bninfr_no"
                    onDelete={remove}
                />
            </div>

            {/* 엑셀 업로드 모달 컴포너트가 있다면 여기에 배치 필요 */}
            {openExcelUpload && (
                <CommonExcelUploadModal 
                    onClose={() => setOpenExcelUpload(false)} 
                    onSuccess={loadBanks}
                />
            )}
        </div>
    );
}
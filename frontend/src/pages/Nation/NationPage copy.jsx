import { useEffect, useState } from "react";
import {
    CrudButtons,
    CommonInput,
    CommonSelect,
    CommonTable,
    CommonExcelUploadModal
} from "../../components";
import { nationService } from "../../api/nation/nationApi";

export default function NationPage() {
    const [nations, setNations] = useState([]);
    const [openExcelUpload, setOpenExcelUpload] = useState(false);
    
    // 검색용 State 추가
    const [keyword, setKeyword] = useState("");

    const [form, setForm] = useState({
        ntncd: "",
        ntnnm: "",
        useyn: "Y"
    });

    // 1. 국가 목록 조회 (try-catch 예외 처리 추가)
    const loadNations = async () => {
        try {
            const res = await nationService.getNations();
            if (Array.isArray(res.data)) {
                setNations(res.data);
            } else {
                console.error(res.data?.message || "데이터 형식이 올바르지 않습니다.");
                setNations([]);
            }
        } catch (err) {
            console.error("국가 목록 로드 실패:", err);
            setNations([]);
        }
    };

    useEffect(() => {
        loadNations();
    }, []);

    // 2. 국가 검색 함수 구현
    const search = async () => {
        try {
            // API 스펙에 따라 검색 조건(필드)이 필요하다면 추가 파라미터로 전달하세요.
            const res = await nationService.searchNations(keyword.trim());
            if (Array.isArray(res.data)) {
                setNations(res.data);
            } else {
                setNations([]);
            }
        } catch (err) {
            console.error("검색 실패:", err);
            alert("검색 중 오류가 발생했습니다.");
        }
    };

    // 3. 국가 정보 저장
    const save = async () => {
        if (!form.ntncd.trim()) {
            alert("국가코드를 입력하세요.");
            return;
        }
        if (!form.ntnnm.trim()) {
            alert("국가명을 입력하세요.");
            return;
        }

        try {
            const res = await nationService.createNation(form);
            alert(res.data?.message || "저장되었습니다.");

            setForm({
                ntncd: "",
                ntnnm: "",
                useyn: "Y"
            });
            loadNations();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // 4. 국가 정보 삭제
    const remove = async (id) => {
        const ok = confirm(`[${id}] 삭제하시겠습니까?`);
        if (!ok) return;

        try {
            await nationService.deleteNation(id);
            alert("삭제되었습니다.");
            loadNations();
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    // 5. 등록 폼 입력값 초기화
    const resetForm = () => {
        setForm({
            ntncd: "",
            ntnnm: "",
            useyn: "Y"
        });
    };

    // 공통 테이블 헤더 정의 객체 배열 구조로 통일 (이전 BankPage와 동일 스펙 가정)
    const headers = [
        { key: "ntninfo_no", label: "거래번호" }, 
        { key: "ntncd", label: "국가코드" },
        { key: "ntnnm", label: "국가명" },
        { 
            key: "useyn", 
            label: "사용여부",
            // 💡 공통 테이블에 수정한 구조를 이용해 국가 페이지 입맛에 맞게 가공 처리!
            render: (value) => (value === "Y" ? "사용" : "미사용") 
        }
    ];

    return (
        <div className="admin-page-layout">
            <h2>국가 정보 관리</h2>

            {/* 검색 영역 */}
            <div className="m3-card search-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>
                    국가 정보 검색
                </h3>
                <div className="form-row">
                    <CommonInput
                        label="검색어"
                        placeholder="검색어 입력"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") search();
                        }}
                    />
                    <div className="form-actions">
                        <button className="btn btn-primary" onClick={search}>
                            검색
                        </button>
                        <button className="btn btn-gray" onClick={() => { setKeyword(""); loadNations(); }}>
                            전체
                        </button>
                    </div>
                </div>
            </div>

            {/* 등록 영역 */}
            <div className="m3-card register-section">
                <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 20px 0", color: "#44474e" }}>
                    국가 정보 등록
                </h3>
                <div className="form-row">
                    <CommonInput
                        label="국가코드"
                        placeholder="국가코드"
                        value={form.ntncd}
                        onChange={(e) => setForm({ ...form, ntncd: e.target.value })}
                    />
                    <CommonInput
                        label="국가명"
                        placeholder="국가명"
                        value={form.ntnnm}
                        onChange={(e) => setForm({ ...form, ntnnm: e.target.value })}
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
                        onReset={resetForm}
                        canSearch={false}
                    />
                </div>
            </div>

            {/* 테이블 결과 영역 */}
            <div className="m3-card result-section">
                <div className="table-header-panel" style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0, color: "#44474e" }}>
                        국가 목록 ({nations.length}건)
                    </h3>
                </div>

                <CommonTable
                    headers={headers}
                    rows={nations}
                    rowKey="ntninfo_no" // 테이블 매핑용 고유 키 전달 (예시: 국가코드)
                    onDelete={remove}
                />
            </div>
        </div>
    );
}
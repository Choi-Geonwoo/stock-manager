import React, { useState, useEffect } from "react";
import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
  CommonPagination,
} from "../../components";
import CommonModal from "../../components/CommonModal";
import { formatCurrency } from "../../utils/comUtils";
import { useImageUpload } from "../../hooks/dividend/useImageUpload";

export default function DividendDetailModal({
    open,
    onClose,
    detail,
    changeDetail,
    banks = [],
    stocks = [],
    setFile,
    preview,
    setPreview,
    update,
    remove
}) {
    // 💡 부모 상태(detail)와 동기화할 로컬 독립 상태 선언 (세팅 유실 원천 차단)
    const [localDetail, setLocalDetail] = useState(null);
    const {
        fileInputRef,
        selectedFileName,
        selectFile,
    } = useImageUpload({
        setFile,
        setPreview,
        fileName: detail?.filenm,
        open,
    });
    // 💡 팝업창이 열리거나 외부 detail 데이터가 유입될 때 로컬 상태로 복사 유도
    useEffect(() => {
        if (detail && Object.keys(detail).length > 0) {
            // HTML date 규격 대응 (YYYYMMDD -> YYYY-MM-DD)
            const dateRaw = detail.dlngymd || "";
            let cleanDate = String(dateRaw).replace(/[^0-9]/g, "");
            if (cleanDate.length === 8) {
                cleanDate = cleanDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            } else {
                cleanDate = dateRaw;
            }

            setLocalDetail({
                ...detail,
                bncd: detail.bncd ? String(detail.bncd).trim() : "",
                stcktea: detail.stcktea ? String(detail.stcktea).trim() : "",
                dlngymd: cleanDate,
                dlngamt: detail.dlngamt !== undefined && detail.dlngamt !== null ? String(detail.dlngamt) : "",
                dvdnd: detail.dvdnd !== undefined && detail.dvdnd !== null ? String(detail.dvdnd) : ""
            });
        }
    }, [detail, open]);

    // 방어 코드
    if (!open || !localDetail) return null;

    // 💡 내부 값 변경 핸들러 (부모 changeDetail 함수가 고장 났을 때를 대비한 2중 안전장치)
    const handleLocalChange = (key, value) => {
        setLocalDetail(prev => ({
            ...prev,
            [key]: value
        }));
        // 부모 컴포넌트의 상태도 동시 업데이트 시도
        if (typeof changeDetail === "function") {
            changeDetail(key, value);
        }
    };

    return (
        <CommonModal open={open} title="상세보기" onClose={onClose}>
            <p className="detail-no-text" style={{ fontWeight: 'bold', marginBottom: '15px' , display: 'none' }} >
                거래번호 : {localDetail.alctndlngdsctn_no}
            </p>

            {/* ⭕ 은행/증권 선택 */}
            <CommonSelect
                label="은행"
                value={localDetail.bncd || ""}
                onChange={(e) => handleLocalChange("bncd", e.target.value)}
                options={banks.map((b, idx) => {
                    let code = "";
                    let name = "";
                    if (Array.isArray(b)) {
                        code = b[1] !== undefined ? b[1] : b[0];
                        name = b[2] !== undefined ? b[2] : (b[1] || b[0]);
                    } else if (b && typeof b === "object") {
                        code = b.bncd || b.bnkcd || b.bank_code || b.code || Object.values(b)[0];
                        name = b.bnnm || b.bnknm || b.bank_name || b.name || Object.values(b)[1];
                    }
                    const parsedCode = code ? String(code).trim() : `BANK_${idx}`;
                    return { value: parsedCode, label: `${parsedCode} - ${name || parsedCode}` };
                })}
            />
            <br />

            {/* ⭕ 주식 티커 선택 */}
            <CommonSelect
                label="티커"
                value={localDetail.stcktea || ""}
                onChange={(e) => handleLocalChange("stcktea", e.target.value)}
                options={stocks.map((s, idx) => {
                    let ticker = "";
                    let name = "";
                    if (Array.isArray(s)) {
                        ticker = s.length > 2 ? s[2] : s[0];
                        name = s.length > 3 ? s[3] : (s[1] || s[0]);
                    } else if (s && typeof s === "object") {
                        ticker = s.stcktea || s.ticker || s.stck_cd || s.code || Object.values(s)[0];
                        name = s.stcknm || s.stckNm || s.stck_nm || s.name || Object.values(s)[1];
                    }

                    const parsedTicker = ticker ? String(ticker).trim() : `STCK_${idx}`;
                    const parsedName = name ? String(name).trim() : parsedTicker;
                    const currentValue = String(localDetail.stcktea || "").trim();
                    const isTargetMatch = currentValue === parsedTicker || currentValue === parsedName;

                    return {
                        value: parsedTicker,
                        label: `${parsedTicker} - ${parsedName}`
                    };
                })}
            />
            <br />

            {/* ⭕ 거래일자 */}
            <CommonInput
                label="거래일자"
                type="date"
                value={localDetail.dlngymd}
                onChange={(e) => handleLocalChange("dlngymd", e.target.value)}
            />
            <br />

            {/* ⭕ 거래금액 */}
            <CommonInput
                label="거래금액"
                value={formatCurrency(localDetail.dlngamt, localDetail.ntnnm)}
                onChange={(e) => handleLocalChange("dlngamt", e.target.value)}
            />
            <br />

            {/* ⭕ 배당금 */}
            <CommonInput
                label="배당금"
                value={formatCurrency(localDetail.dvdnd, localDetail.ntnnm)}
                onChange={(e) => handleLocalChange("dvdnd", e.target.value)}
            />
            <br />

            <div className="file-upload-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <label className="form-label" style={{ flex: '0 0 80px' }}>파일</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        selectFile(e.target.files?.[0]);
                    }}
                />
                {/* 화면에 보이는 버튼 */}
                    <button 
                        type="button" 
                        className="file-btn" 
                        onClick={() => fileInputRef.current.click()}
                        // 💡 선택된 파일이 있으면 파일명을, 없으면 '파일 선택' 표시
                        title={localDetail ? localDetail.filenm : (localDetail.filenm || "파일 선택")}
                    >
                        {selectedFileName || localDetail?.filenm || "파일 선택"}
                    </button>
            </div>

            {(preview || localDetail.filenm) && (
                <div className="image-preview-wrapper" style={{ marginBottom: '20px' }}>
                    <img
                        src={
                            preview
                                ? preview
                                : `http://127.0.0.1:8000/uploads/${String(localDetail.dlngymd).replace(/[^0-9]/g, "").slice(0, 4)}/${String(localDetail.dlngymd).replace(/[^0-9]/g, "").slice(4, 6)}/${localDetail.filenm}`
                        }
                        alt="preview"
                        style={{
                            width: "100%",
                            maxHeight: 350,
                            objectFit: "contain",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0"
                        }}
                    />
                </div>
            )}

            <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => {
                        if (typeof update === "function") update();
                    }} 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                >
                    수정
                </button>
                <button 
                    onClick={() => {
                        if (typeof remove === "function") remove(localDetail.alctndlngdsctn_no);
                    }} 
                    className="btn btn-danger" 
                    style={{ flex: 1 }}
                >
                    삭제
                </button>
            </div>
        </CommonModal>
    );
}
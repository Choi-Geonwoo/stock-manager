import { useImageUpload } from "../../hooks/dividend/useImageUpload";
import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
  CommonPagination,
} from "../../components";
import CommonModal from "../../components/CommonModal";

export default function DividendSaveModal({
    open,
    onClose,
    form = {}, // 💡 1. 기본값 빈 객체 처리
    changeForm,
    banks = [],
    stocks = [],
    setFile,
    preview,
    setPreview,
    save
}) {
    const {
        fileInputRef,
        selectedFileName,
        isDragging,
        selectFile,
        dragHandlers,
    } = useImageUpload({ setFile, setPreview, open });

    return (
        <CommonModal open={open} title="배당 등록" onClose={onClose}>
            {/* ⭕ 은행/증권명 드롭다운 방어 코드 반영 */}
            <CommonSelect
                label="은행/증권명"
                value={form.bncd || ""}
                onChange={(e) => changeForm("bncd", e.target.value)}
                options={banks.map((b) => {
                    const code = Array.isArray(b) ? b[1] : (b.bncd || b.bnkcd);
                    const name = Array.isArray(b) ? b[2] : (b.bnnm || b.bnknm);
                    const normalizedCode = code ? String(code).trim() : "";
                    return {
                        value: normalizedCode,
                        label: normalizedCode && name ? `${normalizedCode} - ${name}` : (name || normalizedCode || "선택")
                    };
                })}
            />
            <br />

            {/* ⭕ 티커 드롭다운 방어 코드 반영 */}
            <CommonSelect
                label="티커"
                value={form.stcktea || ""}
                onChange={(e) => changeForm("stcktea", e.target.value)}
                options={stocks.map((s) => {
                    const ticker = Array.isArray(s) ? s[2] : (s.stcktea || s.ticker);
                    const name = Array.isArray(s) ? s[3] : (s.stcknm || s.stck_nm);
                    const normalizedTicker = ticker ? String(ticker).trim() : "";
                    return {
                        value: normalizedTicker,
                        label: normalizedTicker && name ? `${normalizedTicker} - ${name}` : (name || normalizedTicker || "선택")
                    };
                })}
            />
            <br />

            <CommonInput
                label="배당일자"
                type="date"
                value={form.dlngymd || ""}
                onChange={(e) =>
                    changeForm("dlngymd", e.target.value)
                }
            />
            <br />

            <CommonInput
                label="거래금액"
                value={form.dlngamt || ""}
                onChange={(e) =>
                    changeForm("dlngamt", e.target.value)
                }
            />
            <br />

            <CommonInput
                label="배당금"
                value={form.dvdnd || ""}
                onChange={(e) =>
                    changeForm("dvdnd", e.target.value)
                }
            />
            <br />

            <div
                className="file-upload-wrapper"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px"
                }}
            >
                <label
                    className="form-label"
                    style={{ flex: "0 0 80px" }}
                >
                    파일
                </label>

                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => {
                        selectFile(e.target.files?.[0]);
                    }}
                />

                <div
                    className={`file-drop-zone${isDragging ? " is-dragging" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    {...dragHandlers}
                >
                    <strong>{selectedFileName || "이미지를 끌어놓거나 클릭해서 선택"}</strong>
                    <span>PNG, JPG, GIF</span>
                </div>
            </div>

            {preview && (
                <div className="image-preview-wrapper" style={{ marginBottom: '20px' }}>
                    <img
                        src={preview}
                        alt="preview"
                        style={{
                            width: "100%",
                            maxHeight: 300,
                            objectFit: "contain",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0"
                        }}
                    />
                </div>
            )}

            <div className="form-actions">
                <button
                    onClick={save}
                    className="btn btn-gray"
                >
                    저장
                </button>
            </div>
        </CommonModal>
    );
}
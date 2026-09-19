import { useState } from "react";

export default function CommonExcelUpload({
    uploadApi,
    onSuccess,
    buttonText = "엑셀 업로드"
}) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const upload = async () => {
        if (!file) {
            alert("엑셀 파일을 선택해주세요.");
            return;
        }

        try {
            setLoading(true);

            const res = await uploadApi(file);

            alert(res.data.message || "업로드 완료");

            setFile(null);

            if (onSuccess) {
                await onSuccess();
            }
        } catch (err) {
            console.error(err);
            alert("엑셀 업로드 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                gap: "8px",
                alignItems: "center"
            }}
        >
            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) =>
                    setFile(e.target.files[0])
                }
            />

            <button
                className="btn btn-success"
                onClick={upload}
                disabled={loading}
            >
                {loading
                    ? "업로드중..."
                    : buttonText}
            </button>
        </div>
    );
}
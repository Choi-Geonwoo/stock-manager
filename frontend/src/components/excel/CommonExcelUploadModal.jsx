import { useState } from "react";

import CommonModal from "../CommonModal";

export default function CommonExcelUploadModal({
    open,
    onClose,
    uploadApi,
    onSuccess,
    title = "엑셀 업로드",
    columns = []
}) {

    const [file, setFile] = useState(null);

    const [loading, setLoading] =
        useState(false);

    const upload = async () => {

        if (!file) {
            alert(
                "엑셀 파일을 선택해주세요."
            );
            return;
        }

        try {

            setLoading(true);

            const res = await uploadApi(file);

            alert(
                res.data.message ||
                "업로드 완료"
            );

            setFile(null);

            if (onSuccess) {
                await onSuccess();
            }

            onClose();

        } catch (err) {

            console.error(err);

            alert("업로드 실패");

        } finally {

            setLoading(false);
        }
    };

    const close = () => {

        setFile(null);

        onClose();
    };

    return (
        <CommonModal
            open={open}
            title={title}
            onClose={close}
        >

            {/* ====================================================== */}
            {/* 업로드 규격 안내 */}
            {/* ====================================================== */}

            <div
                className="m3-card"
                style={{
                    marginBottom: "20px",
                    padding: "16px"
                }}
            >

                <h4
                    style={{
                        marginBottom: "12px"
                    }}
                >
                    업로드 항목
                </h4>

                <table
                    style={{
                        width: "100%",
                        borderCollapse:
                            "collapse"
                    }}
                >
                    <thead>
                        <tr>
                            <th>필드</th>
                            <th>설명</th>
                            <th>필수</th>
                        </tr>
                    </thead>

                    <tbody>

                        {columns.map((col) => (

                            <tr key={col.key}>

                                <td>{col.key}</td>

                                <td>{col.label}</td>

                                <td>
                                    {col.required
                                        ? "Y"
                                        : "N"}
                                </td>

                            </tr>

                        ))}

                    </tbody>
                </table>

            </div>

            {/* ====================================================== */}
            {/* 파일 선택 */}
            {/* ====================================================== */}

            <div className="form-row">

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                        setFile(
                            e.target.files[0]
                        )
                    }
                />

            </div>

            <br />

            {/* ====================================================== */}
            {/* 버튼 */}
            {/* ====================================================== */}

            <div className="form-actions">

                <button
                    className="btn btn-primary"
                    onClick={upload}
                    disabled={loading}
                >
                    {loading
                        ? "업로드중..."
                        : "업로드"}
                </button>

                <button
                    className="btn btn-gray"
                    onClick={close}
                >
                    닫기
                </button>

            </div>

        </CommonModal>
    );
}
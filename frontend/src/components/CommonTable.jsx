export default function CommonTable({
    headers = [],
    rows = [],
    rowKey = "id",
    onDelete,
    onRowClick
}) {
    // 특정 화면의 도메인(매수/매도) 필터를 제거하고 안전한 문자열 변환만 유지
    const renderValue = (value) => {
        if (value === null || value === undefined) return "";
        
        // 💡 리액트 자식 에러 방지용 안전장치: 혹시라도 객체가 들어오면 문자열로 강제 변환하거나 빈 값을 줍니다.
        if (typeof value === "object") {
            console.error("CommonTable 에러: 렌더링하려는 값은 객체일 수 없습니다.", value);
            return ""; 
        }
        
        return String(value);
    };

    return (
        <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table className="table" style={{ background: "#fff" }}>
                <thead>
                    <tr>
                        {headers.map((header, idx) => (
                            <th key={`${header.key}_${idx}`}>{header.label}</th>
                        ))}
                        {onDelete && <th>삭제</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={headers.length + (onDelete ? 1 : 0)}
                                style={{ textAlign: "center", padding: "20px" }}
                            >
                                조회된 데이터가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, idx) => {
                            const currentKey = row[rowKey] || idx;
                            return (
                                <tr
                                    key={`${currentKey}_${idx}`}
                                    onClick={() => onRowClick?.(row)}
                                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                                >
                                    {headers.map((header, hIdx) => (
                                        <td key={`${header.key}_${hIdx}`}>
                                            {/* 💡 각 헤더에 custom 렌더러 함수가 있다면 그걸 쓰고, 없으면 기본값 출력 */}
                                            {header.render 
                                                ? header.render(row[header.key], row) 
                                                : renderValue(row[header.key])
                                            }
                                        </td>
                                    ))}
                                    {onDelete && (
                                        <td>
                                            <button
                                                className="btn btn-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(row[rowKey]);
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
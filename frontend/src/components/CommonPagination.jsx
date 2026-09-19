import React from "react";

export default function CommonPagination({ page, total, pageSize, onChange }) {
    // 1. 총 페이지 수 계산
    if (!total || !pageSize || pageSize <= 0) return null;

    const totalPages = Math.ceil(total / pageSize);

    // 데이터가 없으면 페이징 바를 표시하지 않음
    if (total <= 0) return null;

    // 🔥 [핵심 추가] 한 화면에 보여줄 페이지 버튼 개수 제한
    const pageBlockSize = 10; 

    // 2. 현재 페이지가 속한 '블록'의 시작 번호와 끝 번호 계산
    // 예: page가 1~10이면 currentBlock은 0 -> startPage는 1, endPage는 10
    //     page가 11~20이면 currentBlock은 1 -> startPage는 11, endPage는 20
    const currentBlock = Math.floor((page - 1) / pageBlockSize);
    const startPage = currentBlock * pageBlockSize + 1;
    
    // 끝 페이지가 전체 페이지 수보다 커지지 않도록 방어 처리
    const endPage = Math.min(startPage + pageBlockSize - 1, totalPages);

    // 3. 현재 블록에 표시할 숫자 배열 생성 (ex: [1, 2, 3, ..., 10]) - Array.from 사용
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div 
            className="pagination-wrapper" 
            style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                gap: "4px", 
                marginTop: "20px" 
            }}
        >
            {/* [처음] 버튼: 첫 페이지로 점프 (현재 1페이지면 비활성화) */}
            <button 
                className="btn btn-gray" 
                disabled={page === 1}
                onClick={() => onChange(1)}
                style={{ padding: "4px 8px", fontSize: "13px" }}
            >
                &lt;&lt; 처음
            </button>

            {/* [이전] 버튼: 현재 블록의 이전 블록 끝 페이지로 이동 (예: 11페이지에서 누르면 10페이지로) */}
            <button 
                className="btn btn-gray" 
                disabled={startPage === 1}
                onClick={() => onChange(startPage - 1)}
                style={{ padding: "4px 8px", fontSize: "13px" }}
            >
                &lt; 이전
            </button>

            {/* 숫자 버튼 영역: 계산된 10개의 숫자만 반복문(map)으로 출력 */}
            {pageNumbers.map((p) => (
                <button
                    key={p}
                    className={`btn ${page === p ? "btn-primary" : "btn-gray"}`}
                    style={{ 
                        fontWeight: page === p ? "bold" : "normal", 
                        minWidth: "34px",
                        height: "34px",
                        padding: "0"
                    }}
                    onClick={() => onChange(p)}
                >
                    {p}
                </button>
            ))}

            {/* [다음] 버튼: 다음 블록의 첫 페이지로 이동 (예: 10페이지에서 누르면 11페이지로) */}
            <button 
                className="btn btn-gray" 
                disabled={endPage === totalPages}
                onClick={() => onChange(endPage + 1)}
                style={{ padding: "4px 8px", fontSize: "13px" }}
            >
                다음 &gt;
            </button>

            {/* [끝] 버튼: 맨 마지막 페이지로 점프 (현재 마지막 페이지면 비활성화) */}
            <button 
                className="btn btn-gray" 
                disabled={page === totalPages}
                onClick={() => onChange(totalPages)}
                style={{ padding: "4px 8px", fontSize: "13px" }}
            >
                끝 &gt;&gt;
            </button>
        </div>
    );
}
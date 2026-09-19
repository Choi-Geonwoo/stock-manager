import { CommonExcelDownloadButton } from "../../components";
import CommonTable from "../../components/CommonTable";
import DividendSaveModal from "./DividendSaveModal";
import DividendDetailModal from "./DividendDetailModal";
import CommonPagination from "../../components/CommonPagination";

export default function DividendList({
    openSave,
    setOpenSave,
    openDetail,
    setOpenDetail,
    form,
    changeForm,
    detail,
    setDetail,
    changeDetail,
    banks = [],
    stocks = [],
    setFile,
    preview,
    setPreview,
    save,
    update,
    remove,
    // 페이징 부분
    computedDividends,
    headers,
    page,
    total,
    pageSize,
    loadDividends,
    searchYear = "",
    searchMonth = "",
    searchBank = "",
    searchStock = "",
    fetchAllDividendsForDownload,
    // 페이징 부분
}) {


    // 💡 2. 행 클릭 시 팝업창 강제 오픈 및 데이터 완벽 분해 세팅
    // 💡 2. 행 클릭 시 팝업창 강제 오픈 및 데이터 완벽 분해 세팅 (백엔드 SQL 오염 우회 버전)
    const handleRowClick = (row) => {
        if (!row) return;

        console.log("👉 클릭된 행(row)의 실제 데이터 구조:", row);

        let alctndlngdsctn_no = "";
        let bncd = "";
        let stcktea = "";
        let dlngymd = "";
        let dlngamt = "";
        let dvdnd = "";
        let filenm = "";

        // 1. 데이터 추출 (배열/객체 무관 대응)
        if (Array.isArray(row)) {
            alctndlngdsctn_no = row[0] || "";
            bncd = row[1] || "";
            stcktea = row[2] || "";
            dlngymd = row[3] || "";
            dlngamt = row[4] || "";
            dvdnd = row[5] || "";
            filenm = row[6] || "";
        } else if (typeof row === "object") {
            alctndlngdsctn_no = row.alctndlngdsctn_no || row.id || Object.values(row)[0] || "";
            bncd = row.bncd || row.bnkcd || Object.values(row)[1] || "";
            stcktea = row.stcktea || row.ticker || Object.values(row)[2] || "";
            dlngymd = row.dlngymd || row.date || Object.values(row)[3] || "";
            dlngamt = row.dlngamt || row.amount || Object.values(row)[4] || "";
            dvdnd = row.dvdnd || row.dividend || Object.values(row)[5] || "";
            filenm = row.filenm || row.file_name || "";
        }

        // 2. 🚨 [핵심 해결] 백엔드가 가짜 티커(종목명)를 줬으므로, stocks 마스터 배열에서 진짜 티커 코드를 매칭
        const cleanStck = String(stcktea).trim();
        const matchedStock = stocks.find(s => {
            if (Array.isArray(s)) {
                // [id, ticker, name] 구조 검사
                return String(s[2]).trim() === cleanStck || String(s[3]).trim() === cleanStck;
            } else if (s && typeof s === 'object') {
                return String(s.stcktea).trim() === cleanStck || String(s.stcknm).trim() === cleanStck || String(s.name).trim() === cleanStck;
            }
            return false;
        });

        // 매칭된 진짜 주식 마스터 정보가 있다면 그 정보의 '진짜 코드(PK)'로 교체합니다.
        if (matchedStock) {
            stcktea = Array.isArray(matchedStock) 
                ? matchedStock[2] 
                : (matchedStock.stcktea || matchedStock.ticker || matchedStock.code || Object.values(matchedStock)[0]);
        }

        // 3. 은행코드 문자열 정제
        if (typeof bncd === 'string' && bncd.includes('(')) {
            bncd = bncd.split('(')[0].trim();
        } else if (typeof bncd === 'string' && bncd.includes('-')) {
            bncd = bncd.split('-')[0].trim();
        }

        // 4. HTML5 날짜 인풋창 포맷 가공 (YYYYMMDD -> YYYY-MM-DD)
        let formattedDate = String(dlngymd).replace(/[^0-9]/g, "");
        if (formattedDate.length === 8) {
            formattedDate = formattedDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        } else {
            formattedDate = String(dlngymd);
        }

        // 5. 콤보박스 및 인풋에 에러 없이 꽂히도록 최종 세팅 주입
        setDetail({
            alctndlngdsctn_no: String(alctndlngdsctn_no).trim(),
            bncd: String(bncd).trim(),
            stcktea: String(stcktea).trim(), // 👈 이제 종목명이 아니라 데이터베이스가 원하는 진짜 '1111111' 코드가 드갑니다!
            dlngymd: formattedDate,
            dlngamt: String(dlngamt),
            dvdnd: String(dvdnd),
            filenm: filenm || ""
        });
        
        // 팝업창 열기
        setOpenDetail(true);
    };
    //console.log(headers);
    return (
        <div className="dividend-list-wrapper">
            <div className="m3-card result-section">
            <div className="table-header-panel">
                <h3>배당 내역 (총 {total}건 / {page}페이지)</h3>
                <CommonExcelDownloadButton
                    rows={computedDividends}
                    headers={headers}
                    fileName={`배당_내역_${searchYear || "전체"}_${searchMonth || "전체"}.xlsx`}
                    sheetName="배당내역"
                    disabled={computedDividends.length === 0}
                    fetchRows={fetchAllDividendsForDownload}
                />
            </div>

            <CommonTable 
                headers={headers} 
                rows={computedDividends} 
                rowKey="alctndlngdsctn_no"
                onRowClick={handleRowClick} 
            />
            {/* 페이징 부분 */}
            <CommonPagination
                page={page}
                total={total}
                pageSize={pageSize}
                onChange={(nextPage) =>
                    loadDividends({
                        currentPage: nextPage,
                        year: searchYear,
                        month: searchMonth,
                        bank: searchBank,
                        stock: searchStock,
                    })
                }
            />
            </div>
            {/* 페이징 부분 */}
            {/* 1. 배당 등록 모달 */}
            {openSave && (
                <DividendSaveModal
                    open={openSave}
                    onClose={() => {
                        setOpenSave(false);
                        setFile(null);
                        setPreview(null);
                    }}
                    // 💡 등록 모달은 form 데이터를 사용합니다!
                    form={form}
                    detail={detail || {}} 
                    // 💡 중요: 부모인 DividendPage.jsx에서 정의된 진짜 함수를 확실히 전달
                    changeDetail={changeDetail} 
                    changeForm={changeForm}
                    banks={banks}
                    stocks={stocks}
                    setFile={setFile}
                    preview={preview}
                    setPreview={setPreview}
                    update={update}
                    remove={remove}
                    save={save} // 💡 등록 모달은 update가 아니라 save를 사용합니다!
                />
            )}

            {/* 2. 배당 상세 보기 모달 */}
            {openDetail && (
                <DividendDetailModal
                    open={openDetail}
                    onClose={() => {
                        setOpenDetail(false);
                        setFile(null);
                        setPreview(null);
                    }}
                    detail={detail}
                    changeDetail={changeDetail}
                    banks={banks}
                    stocks={stocks}
                    setFile={setFile}
                    preview={preview}
                    setPreview={setPreview}
                    update={update}
                    remove={remove}
                />
            )}
        </div>
    );
}
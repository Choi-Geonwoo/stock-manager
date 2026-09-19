import { CommonSelect } from "../../components";

import DividendList from "./DividendList";
import DividendChart from "./DividendChart";

export default function DividendView(props) {
  const {
    search,
    save,
    update,
    remove,
    loadDividends,
    dividends,
    banks,
    stocks,
    tab,
    setTab,
    searchYear,
    setSearchYear,
    searchMonth,
    setSearchMonth,
    searchBank,
    setSearchBank,
    searchStock,
    setSearchStock,
    monthlyData,
    openSave,
    setOpenSave,
    openDetail,
    setOpenDetail,
    form,
    changeForm,
    detail,
    setDetail,
    changeDetail,
    file,
    setFile,
    preview,
    setPreview,
    
    page,
    total,
    pageSize,
    headers,
    computedDividends,
    monthlyTable,
    fetchAllDividendsForDownload,
    
  } = props;

  return (
    <div className="admin-page-layout">
      <h2>배당 거래 관리</h2>

    
            <div className="m3-card">
                    <div className="form-row">
                        <CommonSelect
                            label="년도"
                            value={searchYear}
                            onChange={(e) => setSearchYear(e.target.value)}
                            options={Array.from({ length: 10 }, (_, i) => {
                                const y = String(2020 + i);
                                return { value: y, label: y + "년" };
                            })}
                        />
                        <CommonSelect
                            label="월"
                            value={searchMonth}
                            onChange={(e) => setSearchMonth(e.target.value)}
                            options={Array.from({ length: 12 }, (_, i) => {
                                const m = String(i + 1).padStart(2, "0");
                                return { value: m, label: m + "월" };
                            })}
                        />
                    </div>
    
                    <div className="form-row">
                        <CommonSelect
                            label="은행"
                            value={searchBank}
                            onChange={(e) => setSearchBank(e.target.value)}
                            options={banks.map((b) => {
                                const code = Array.isArray(b) ? b[1] : (b.bncd || b.bnkcd);
                                const name = Array.isArray(b) ? b[2] : (b.bnnm || b.bnknm);
                                return { value: code || "", label: name || code || "" };
                            })}
                        />
                        <CommonSelect
                            label="주식"
                            value={searchStock}
                            onChange={(e) => setSearchStock(e.target.value)}
                            options={stocks.map((s) => {
                                const ticker = Array.isArray(s) ? s[2] : (s.stcktea || s.ticker);
                                const name = Array.isArray(s) ? s[3] : (s.stcknm || s.stck_nm);
                                return { value: ticker || "", label: name || ticker || "" };
                            })}
                        />
                    </div>
    
                    <div className="form-actions">
                        <button className="btn btn-primary" onClick={search}>검색</button>
                        <button className="btn btn-gray" onClick={async () => {
                            setSearchYear("");
                            setSearchMonth("");
                            setSearchBank("");
                            setSearchStock("");
                            await loadDividends();
                        }}>전체</button>
                        <button className="btn btn-success" onClick={() => setOpenSave(true)}>등록</button>
                    </div>
                </div>
    
                <div style={{ marginBottom: 20 }}>
                    <button className={tab === "list" ? "btn btn-primary" : "btn btn-gray"} onClick={() => setTab("list")}>거래내역</button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button className={tab === "chart" ? "btn btn-primary" : "btn btn-gray"} onClick={() => setTab("chart")}>그래프</button>
                </div>
    
                {tab === "list" && (
                    <DividendList
                        dividends={dividends}
                        openSave={openSave}
                        setOpenSave={setOpenSave}
                        openDetail={openDetail}
                        setOpenDetail={setOpenDetail}
                        form={form}
                        changeForm={changeForm}
                        detail={detail}
                        setDetail={setDetail}
                        changeDetail={changeDetail} // 💡 자식 컴포넌트에 누락되었던 핵심 함수 주입 완료!
                        banks={banks}
                        stocks={stocks}
                        file={file}
                        setFile={setFile}
                        preview={preview}
                        setPreview={setPreview}
                        save={save}
                        update={update}
                        remove={remove}
                        
                        page={page}
                        total={total}
                        pageSize={pageSize}
                        headers={headers}
                        computedDividends={computedDividends}
                        loadDividends={loadDividends}
                        searchYear={searchYear}
                        searchMonth={searchMonth}
                        searchBank={searchBank}
                        searchStock={searchStock}
                        fetchAllDividendsForDownload={fetchAllDividendsForDownload}

                    />
                    
                )}
    
                {tab === "chart" && (
                    <DividendChart
                        monthlyTable={monthlyTable}
                        monthlyData={monthlyData}
                        selectedYear={searchYear}
                        selectedMonth={searchMonth}
                    />
                )}
        </div>
  );
}
import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
  CommonPagination,
} from "../../components";

const ALCTN_OPTIONS = [
  { value: "월", label: "월" },
  { value: "02,05,08,11", label: "02,05,08,11" },
  { value: "03,06,09,12", label: "03,06,09,12" },
  { value: "04,07,10,12", label: "04,07,10,12" },
  { value: "반기", label: "반기" },
  { value: "년", label: "년" },
];

const USE_OPTIONS = [
  { value: "Y", label: "사용" },
  { value: "N", label: "미사용" },
];

export default function StockView({
  nations,
  form,
  setForm,
  searchNtncd,
  setSearchNtncd,
  searchStcktea,
  setSearchStcktea,
  searchAlctn,
  setSearchAlctn,
  searchStcknm,
  setSearchStcknm,

  page,
  total,
  pageSize,

  computedStocks,
  headers,

  save,
  remove,
  reset,
  handleSearch,
  loadStocks,
}) {
  const handleFormChange =
    (field, convert) =>
    (e) => {
      const value = convert
        ? convert(e.target.value)
        : e.target.value;

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const nationOptions = nations.map((n) => ({
    value: n.ntncd,
    label: `${n.ntncd} - ${n.ntnnm}`,
  }));

  const tickerOptions = Array.from(
    new Set(computedStocks.map((row) => row.stcktea).filter(Boolean))
  ).map((value) => ({ value, label: value }));

  return (
    <div className="admin-page-layout" style={{ display: "flex", flexDirection: "column" }}>
      <h2>주식 정보 관리</h2>

      {/* 검색 */}
      <div className="m3-card search-section" style={{ order: 2 }}>
        <h3>주식 검색</h3>

        <div className="form-row" style={{ display: "flex", flexWrap: "nowrap", gap: "12px", alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <CommonSelect
              label="국가"
              value={searchNtncd}
              onChange={(e) => setSearchNtncd(e.target.value)}
              options={nationOptions}
            />
          </div>

          <div style={{ flex: 1 }}>
            <CommonSelect
              label="티커"
              value={searchStcktea}
              onChange={(e) => setSearchStcktea(e.target.value.toUpperCase())}
              options={tickerOptions}
            />
          </div>

          <div style={{ flex: 1 }}>
            <CommonSelect
              label="배당주기"
              value={searchAlctn}
              onChange={(e) => setSearchAlctn(e.target.value)}
              options={ALCTN_OPTIONS}
            />
          </div>

          <div style={{ flex: 1 }}>
            <CommonInput
              label="주식명"
              placeholder="주식명"
              value={searchStcknm}
              onChange={(e) => setSearchStcknm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleSearch}
          >
            검색
          </button>

          <button
            className="btn btn-gray"
            onClick={() => {
              setSearchNtncd("");
              setSearchStcktea("");
              setSearchAlctn("");
              setSearchStcknm("");
              loadStocks(1);
            }}
          >
            전체
          </button>
        </div>
      </div>

      {/* 등록 */}
      <div className="m3-card register-section" style={{ order: 1 }}>
        <h3>주식 등록</h3>

        <div className="form-row">
          <CommonSelect
            label="국가"
            value={form.ntncd}
            onChange={handleFormChange("ntncd")}
            options={nationOptions}
          />

          <CommonInput
            label="티커"
            placeholder="티커"
            value={form.stcktea}
            onChange={handleFormChange(
              "stcktea",
              (v) => v.toUpperCase()
            )}
          />

          <CommonInput
            label="주식명"
            placeholder="주식명"
            value={form.stcknm}
            onChange={handleFormChange("stcknm")}
          />
        </div>

        <div className="form-row">
          <CommonSelect
            label="배당주기"
            value={form.alctn}
            onChange={handleFormChange("alctn")}
            options={ALCTN_OPTIONS}
          />

          <CommonSelect
            label="사용여부"
            value={form.useyn}
            onChange={handleFormChange("useyn")}
            options={USE_OPTIONS}
          />

          {/* 레이아웃 유지용 */}
          <div className="horizontal-form-group display_hidden">
            <span className="form-text-label">
              1
            </span>

            <div className="input-block">
              <input
                className="input"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <CrudButtons
            onSave={save}
            onReset={reset}
            canSearch={false}
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="m3-card result-section" style={{ order: 3 }}>
        <div className="table-header-panel">
          <h3>주식 목록 (총 {total}건 / {page}페이지)</h3>
        </div>

        <CommonTable
          headers={headers}
          rows={computedStocks}
          rowKey="stckinfo_no"
          onDelete={remove}
        />

        <CommonPagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={(targetPage) =>
            loadStocks(targetPage, {
              ntncd: searchNtncd,
              stcktea: searchStcktea,
              alctn: searchAlctn,
              stcknm: searchStcknm,
            })
          }
        />
      </div>
    </div>
  );
}
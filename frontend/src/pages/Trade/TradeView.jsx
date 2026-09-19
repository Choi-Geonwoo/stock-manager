import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
  CommonPagination,
  CommonExcelDownloadButton,
} from "../../components";

import { formatCurrency } from "../../utils/comUtils";

export default function TradeView({
  banks,
  stocks,

  page,
  total,
  pageSize,

  searchForm,
  setSearchForm,

  form,
  setForm,

  handleSearch,
  handleSearchAll,

  save,
  remove,
  reset,

  loadTrades,

  computedTrades,
  fetchAllTradesForDownload,
}) {
  const tableHeaders = [
    {
      key: "row_index",
      label: "순번",
    },
    {
      key: "dlngymd",
      label: "거래일자",
      render: (val) =>
        val && val.length === 8
          ? val.replace(
              /(\d{4})(\d{2})(\d{2})/,
              "$1-$2-$3"
            )
          : val,
    },
    {
      key: "bnnm",
      label: "은행/증권명",
    },
    {
      key: "stcknm",
      label: "종목명",
    },
    {
      key: "dlngamt",
      label: "거래금액",
      render: (val, row) =>
        formatCurrency(val, row.ntnnm)
    },
    {
      key: "clsf",
      label: "구분",
      render: (val) => {
        if (val === "4") return "ISA계좌";
        if (val === "3") return "일반계좌";
        if (val === "2") return "퇴직연금";
        if (val === "1") return "연금저축";
        return val;
      },
    },
    {
      key: "byngyn",
      label: "매수여부",
      render: (val) =>
        val === "Y"
          ? "매수"
          : "매도",
    },
    {
      key: "stckcnt",
      label: "주식수",
      render: (val) =>
        val
          ? Number(val).toLocaleString()
          : "0",
    },
  ];

  const excelHeaders = tableHeaders.map(({ key, label }) => ({ key, label }));

  return (
    <div className="admin-page-layout" style={{ display: "flex", flexDirection: "column" }}>
      <h2>주식 거래 내역 관리</h2>

      {/* 검색 영역 */}
      <div className="m3-card search-section" style={{ order: 2 }}>
        <h3>거래내역 조건 검색</h3>

        <div className="form-row">
          <CommonInput
            label="시작일자"
            type="date"
            value={searchForm.startDate}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                startDate: e.target.value,
              })
            }
          />

          <CommonInput
            label="종료일자"
            type="date"
            value={searchForm.endDate}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                endDate: e.target.value,
              })
            }
          />

          <CommonSelect
            label="은행/증권"
            value={searchForm.bncd}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                bncd: e.target.value,
              })
            }
            options={banks.map((b) => ({
              value: b.bncd || b[1],
              label: b.bnnm
                ? `${b.bncd} - ${b.bnnm}`
                : `${b[1]} - ${b[2]}`,
            }))}
          />
        </div>

        <div
          className="form-row"
          style={{ marginTop: "12px" }}
        >
          <CommonSelect
            label="주식티커"
            value={searchForm.stcktea}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                stcktea: e.target.value,
              })
            }
            options={stocks.map((s) => ({
              value:
                s.stcktea || s[2],
              label: s.stcknm
                ? `${s.stcktea} - ${s.stcknm}`
                : `${s[2]} - ${s[3]}`,
            }))}
          />

          <CommonSelect
            label="항목구분"
            value={searchForm.clsf}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                clsf: e.target.value,
              })
            }
            options={[
              {
                value: "4",
                label: "ISA계좌",
              },
              {
                value: "3",
                label: "일반계좌",
              },
              {
                value: "2",
                label: "퇴직연금",
              },
              {
                value: "1",
                label: "연금저축",
              },
            ]}
          />

          <CommonSelect
            label="매수여부"
            value={searchForm.byngyn}
            onChange={(e) =>
              setSearchForm({
                ...searchForm,
                byngyn: e.target.value,
              })
            }
            options={[
              {
                value: "Y",
                label: "매수",
              },
              {
                value: "N",
                label: "매도",
              },
            ]}
          />
        </div>

        <div
          className="form-actions"
          style={{ marginTop: "20px" }}
        >
          <button
            className="btn btn-primary"
            onClick={handleSearch}
          >
            검색
          </button>

          <button
            className="btn btn-gray"
            onClick={handleSearchAll}
          >
            전체 초기화
          </button>
        </div>
      </div>

      {/* 등록 영역 */}
      <div className="m3-card register-section" style={{ order: 1 }}>
        <h3>거래내역 등록</h3>

        <div className="form-row">
          <CommonInput
            label="거래일자"
            type="date"
            value={form.dlngymd}
            onChange={(e) =>
              setForm({
                ...form,
                dlngymd:
                  e.target.value,
              })
            }
          />

          <CommonSelect
            label="은행증권"
            value={form.bncd}
            onChange={(e) =>
              setForm({
                ...form,
                bncd:
                  e.target.value,
              })
            }
            options={banks.map((b) => ({
              value:
                b.bncd || b[1],
              label: b.bnnm
                ? `${b.bncd} - ${b.bnnm}`
                : `${b[1]} - ${b[2]}`,
            }))}
          />

          <CommonSelect
            label="티커"
            value={form.stcktea}
            onChange={(e) =>
              setForm({
                ...form,
                stcktea:
                  e.target.value,
              })
            }
            options={stocks.map((s) => ({
              value:
                s.stcktea || s[2],
              label: s.stcknm
                ? `${s.stcktea} - ${s.stcknm}`
                : `${s[2]} - ${s[3]}`,
            }))}
          />

          <CommonInput
            label="거래금액"
            placeholder="거래금액"
            value={form.dlngamt}
            onChange={(e) =>
              setForm({
                ...form,
                dlngamt:
                  e.target.value,
              })
            }
          />
        </div>

        <div className="form-row">
          <CommonInput
            label="주식수"
            placeholder="주식수"
            value={form.stckcnt}
            onChange={(e) =>
              setForm({
                ...form,
                stckcnt:
                  e.target.value,
              })
            }
          />

          <CommonSelect
            label="항목구분"
            value={form.clsf}
            onChange={(e) =>
              setForm({
                ...form,
                clsf:
                  e.target.value,
              })
            }
            options={[
              {
                value: "4",
                label: "ISA계좌",
              },
              {
                value: "3",
                label: "일반계좌",
              },
              {
                value: "2",
                label: "퇴직연금",
              },
              {
                value: "1",
                label: "연금저축",
              },
            ]}
          />

          <CommonSelect
            label="매수여부"
            value={form.byngyn}
            onChange={(e) =>
              setForm({
                ...form,
                byngyn:
                  e.target.value,
              })
            }
            options={[
              {
                value: "Y",
                label: "매수",
              },
              {
                value: "N",
                label: "매도",
              },
            ]}
          />

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

      {/* 결과 영역 */}
      <div className="m3-card result-section" style={{ order: 3 }}>
        <div
          className="table-header-panel"
          style={{
            marginBottom: "16px",
          }}
        >
            <h3>주식 거래 목록 (총 {total}건 / {page}페이지)</h3>
            <CommonExcelDownloadButton
              rows={computedTrades}
              headers={excelHeaders}
              fileName={`거래내역_${new Date().toISOString().slice(0, 10)}.xlsx`}
              sheetName="거래내역"
              disabled={computedTrades.length === 0}
              fetchRows={fetchAllTradesForDownload}
            />
        </div>

        <CommonTable
          rowKey="trade_no"
          headers={tableHeaders}
          rows={computedTrades}
          onDelete={remove}
        />

        <CommonPagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={(targetPage) =>
            loadTrades(targetPage, searchForm)
          }
        />
      </div>
    </div>
  );
}
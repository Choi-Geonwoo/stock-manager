import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
} from "../../components";

export default function BankView({
  banks,
  form,
  setForm,
  searchField,
  setSearchField,
  keyword,
  setKeyword,
  search,
  save,
  remove,
  resetForm,
  loadBanks,
  headers,
}) {
  return (
    <div className="admin-page-layout" style={{ display: "flex", flexDirection: "column" }}>
      <h2>은행 정보 관리</h2>

      {/* 검색 */}
      <div className="m3-card search-section" style={{ order: 2 }}>
        <h3>은행/증권 검색</h3>

        <div className="form-row">
          <CommonSelect
            label="검색조건"
            value={searchField}
            onChange={(e) =>
              setSearchField(
                e.target.value
              )
            }
            options={[
              {
                value: "bncd",
                label:
                  "은행/증권코드",
              },
              {
                value: "bnnm",
                label:
                  "은행/증권명",
              },
            ]}
          />

          <CommonInput
            label="검색어"
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) =>
              setKeyword(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                search();
              }
            }}
          />
        </div>

        <div className="form-actions">
          <CrudButtons
            canSearch
            canSave={false}
            onSearch={search}
            onReset={() => {
              setKeyword("");
              loadBanks();
            }}
          />
        </div>
      </div>

      {/* 등록 */}
      <div className="m3-card register-section" style={{ order: 1 }}>
        <h3>
          은행/증권 정보 등록
        </h3>

        <div className="form-row">
          <CommonInput
            label="은행코드"
            value={form.bncd}
            onChange={(e) =>
              setForm({
                ...form,
                bncd:
                  e.target.value,
              })
            }
          />

          <CommonInput
            label="은행/증권명"
            value={form.bnnm}
            onChange={(e) =>
              setForm({
                ...form,
                bnnm:
                  e.target.value,
              })
            }
          />

          <CommonSelect
            label="사용여부"
            value={form.useyn}
            onChange={(e) =>
              setForm({
                ...form,
                useyn:
                  e.target.value,
              })
            }
            options={[
              {
                value: "Y",
                label: "사용",
              },
              {
                value: "N",
                label: "미사용",
              },
            ]}
          />
        </div>

        <div className="form-actions">
          <CrudButtons
            onSave={save}
            onReset={resetForm}
            canSearch={false}
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="m3-card result-section" style={{ order: 3 }}>
        <div className="table-header-panel">
          <h3>은행/증권 목록 (총 {banks.length}건)</h3>
        </div>

        <CommonTable
          headers={headers}
          rows={banks}
          rowKey="bninfr_no"
          onDelete={remove}
        />
      </div>

    </div>
  );
}
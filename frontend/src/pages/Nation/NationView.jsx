import {
  CrudButtons,
  CommonInput,
  CommonSelect,
  CommonTable,
} from "../../components";

export default function NationView({
  nations,
  searchNtncd,
  setSearchNtncd,
  searchNtnnm,
  setSearchNtnnm,
  searchUseyn,
  setSearchUseyn,
  form,
  setForm,
  search,
  save,
  remove,
  resetForm,
  resetSearch,
  headers,
}) {
  return (
    <div className="admin-page-layout" style={{ display: "flex", flexDirection: "column" }}>
      <h2>국가 정보 관리</h2>

      {/* 검색 영역 */}
      <div className="m3-card search-section" style={{ order: 2 }}>
        <h3>국가 정보 검색</h3>

        <div className="form-row">
          <CommonInput label="국가코드" placeholder="국가코드" value={searchNtncd} onChange={(e) => setSearchNtncd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <CommonInput label="국가명" placeholder="국가명" value={searchNtnnm} onChange={(e) => setSearchNtnnm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <CommonSelect label="사용여부" value={searchUseyn} onChange={(e) => setSearchUseyn(e.target.value)} options={[{ value: "", label: "전체" }, { value: "Y", label: "사용" }, { value: "N", label: "미사용" }]} />
        </div>

        <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={search}
            >
              검색
            </button>

            <button
              className="btn btn-gray"
              onClick={resetSearch}
            >
              초기화
            </button>
        </div>
      </div>

      {/* 등록 영역 */}
      <div className="m3-card register-section" style={{ order: 1 }}>
        <h3>국가 정보 등록</h3>

        <div className="form-row">
          <CommonInput
            label="국가코드"
            placeholder="국가코드"
            value={form.ntncd}
            onChange={(e) =>
              setForm({
                ...form,
                ntncd: e.target.value,
              })
            }
          />

          <CommonInput
            label="국가명"
            placeholder="국가명"
            value={form.ntnnm}
            onChange={(e) =>
              setForm({
                ...form,
                ntnnm: e.target.value,
              })
            }
          />

          <CommonSelect
            label="사용여부"
            value={form.useyn}
            onChange={(e) =>
              setForm({
                ...form,
                useyn: e.target.value,
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

      {/* 목록 영역 */}
      <div className="m3-card result-section" style={{ order: 3 }}>
        <div className="table-header-panel">
          <h3>국가 목록 (총 {nations.length}건)</h3>
        </div>

        <CommonTable
          headers={headers}
          rows={nations}
          rowKey="ntninfo_no"
          onDelete={remove}
        />
      </div>
    </div>
  );
}
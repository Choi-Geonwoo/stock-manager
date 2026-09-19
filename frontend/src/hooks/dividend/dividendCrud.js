import { bankService } from "../../api/bank/bankApi";
import { stockService } from "../../api/stock/stockApi";
import { dividendsService } from "../../api/dividend/dividendApi";

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

// =========================================
// 은행 조회
// =========================================
export const loadBanks = async (setBanks) => {
  try {
    const res = await bankService.getBanks();
    setBanks(normalizeRows(res?.data));
  } catch (err) {
    console.error(err);
    setBanks([]);
  }
};

// =========================================
// 종목 조회
// =========================================
export const loadStocks = async (setStocks) => {
  try {
    const res = await stockService.getStocks(1, 9999);
    setStocks(normalizeRows(res?.data));
  } catch (err) {
    console.error(err);
    setStocks([]);
  }
};

// =========================================
// 배당 목록 조회
// =========================================
export const loadDividends = async ({
  currentPage = 1,
  pageSize = 10,
  year = "",
  month = "",
  bank = "",
  stock = "",
}) => {
  const res = await dividendsService.getDividends(
    currentPage,
    pageSize,
    year,
    month,
    bank,
    stock
  );

  const payload = res?.data ?? {};

  return {
    rows: Array.isArray(payload.data) ? payload.data : [],
    total: payload.total ?? 0,
  };
};

// =========================================
// 월별 차트 조회
// =========================================
export const loadMonthlyChart = async (
  year = "",
  month = "",
  bank = "",
  stock = ""
) => {
  const res = await dividendsService.getMonthlyChart(
    year,
    month,
    bank,
    stock
  );

  return res?.data?.data ?? [];
};

// =========================================
// 등록
// =========================================
export const saveDividend = async ({
  form,
  file,
}) => {
  window.confirm(`등록하시겠습니까?`) || (() => { throw new Error("등록 취소"); })();

  const payload = {
    ...form,
    filenm: file?.name || form?.filenm || "",
  };

  const res = await dividendsService.createDividend(payload);
  const createdId = res?.data?.alctndlngdsctn_no || res?.data?.id || form?.alctndlngdsctn_no || "";

  if (file && createdId) {
    await dividendsService.uploadDividendFile(
      file,
      form.dlngymd,
      createdId,
      file.name
    );
  }

  return res;
};

// =========================================
// 수정
// =========================================
export const updateDividend = async ({
  detail,
  file,
}) => {
  window.confirm(`[${detail.alctndlngdsctn_no}] 수정하시겠습니까?`) || (() => { throw new Error("수정 취소"); })();

  const payload = {
    ...detail,
    filenm: file?.name || detail?.filenm || "",
  };

  const res = await dividendsService.updateDividend(payload);

  if (file && detail?.alctndlngdsctn_no) {
    await dividendsService.uploadDividendFile(
      file,
      detail.dlngymd,
      detail.alctndlngdsctn_no,
      file.name
    );
  }

  return res;
};

// =========================================
// 삭제
// =========================================
export const deleteDividend = async (id) => {
  window.confirm(`[${id}] 삭제하시겠습니까?`) || (() => { throw new Error("삭제 취소"); })();
  return await dividendsService.deleteDividend(id);
};
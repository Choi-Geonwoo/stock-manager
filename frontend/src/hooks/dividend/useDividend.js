import { useEffect, useState, useCallback, useMemo } from "react";

import {
  loadBanks,
  loadStocks,
  loadDividends as fetchDividends,
  loadMonthlyChart,
  saveDividend,
  updateDividend,
  deleteDividend,
} from "./dividendCrud";

import { buildChartData } from "./dividendChart";
import { formatCurrency } from "../../utils/comUtils";

const PAGE_SIZE = 10;

export function useDividend() {
  const emptyForm = {
    alctndlngdsctn_no: "",
    bncd: "",
    stcktea: "",
    dlngymd: "",
    dlngamt: "",
    dvdnd: "",
    filenm: "",
  };

  // ===============================
  // State
  // ===============================
  const [dividends, setDividends] = useState([]);
  const [banks, setBanks] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [monthlyData, setMonthlyData] = useState([]);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [openSave, setOpenSave] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  const [detail, setDetail] = useState({});
  const [form, setForm] = useState(emptyForm);

  const [tab, setTab] = useState("list");

  const [searchYear, setSearchYear] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchBank, setSearchBank] = useState("");
  const [searchStock, setSearchStock] = useState("");

  // Paging
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = PAGE_SIZE;

  const [monthlyTable, setMonthlyTable] = useState([]);

  // ===============================
  // Form
  // ===============================
  const changeForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const changeDetail = (key, value) => {
    setDetail((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
  };

    // ===============================
  // 배당 목록 조회
  // ===============================
  const loadDividendList = useCallback(
    async (
      currentPageOrOptions = 1,
      year = "",
      month = "",
      bank = "",
      stock = ""
    ) => {
      try {
        const options =
          typeof currentPageOrOptions === "object" && currentPageOrOptions !== null
            ? currentPageOrOptions
            : {
                currentPage: currentPageOrOptions,
                year,
                month,
                bank,
                stock,
              };

        const currentPage = options.currentPage ?? 1;
        const activeYear = options.year ?? year ?? searchYear;
        const activeMonth = options.month ?? month ?? searchMonth;
        const activeBank = options.bank ?? bank ?? searchBank;
        const activeStock = options.stock ?? stock ?? searchStock;

        // 목록 조회
        const { rows, total } = await fetchDividends({
          currentPage,
          pageSize,
          year: activeYear,
          month: activeMonth,
          bank: activeBank,
          stock: activeStock,
        });

        setDividends(rows);
        setTotal(total);
        setPage(currentPage);

        const nextChartData = buildChartData(rows, stocks);
        setMonthlyData(nextChartData.monthlyData);

        const monthly = await loadMonthlyChart(
          activeYear,
          activeMonth,
          activeBank,
          activeStock
        );

        setMonthlyTable(monthly);
      } catch (err) {
        console.error(err);

        setDividends([]);
        setMonthlyData([]);
        setMonthlyTable([]);
        setTotal(0);
      }
    },
    [
      pageSize,
      searchYear,
      searchMonth,
      searchBank,
      searchStock,
      stocks,
    ]
  );

  // ===============================
  // 검색
  // ===============================
  const search = async () => {
    await loadDividendList(
      1,
      searchYear,
      searchMonth,
      searchBank,
      searchStock
    );
  };

    // ===============================
  // 등록
  // ===============================
  const save = async () => {
    try {
      const res = await saveDividend({
        form,
        file,
      });

      if (res.data.result === "success") {
        alert("등록완료");

        setOpenSave(false);
        resetForm();

        await loadDividendList();
      }
    } catch (err) {
      console.error(err);
      alert("등록 실패");
    }
  };

  // ===============================
  // 수정
  // ===============================
  const update = async () => {
    try {
      const res = await updateDividend({
        detail,
        file,
      });

      if (res.data.result === "success") {
        alert("수정완료");

        setOpenDetail(false);
        setFile(null);
        setPreview(null);

        await loadDividendList();
      }
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    }
  };

  // ===============================
  // 삭제
  // ===============================
  const remove = async (id) => {
    try {
      if (!confirm(`[${id}] 삭제하시겠습니까?`)) {
        return;
      }

      await deleteDividend(id);

      setOpenDetail(false);
      setFile(null);
      setPreview(null);
      setDetail({});

      await loadDividendList();

      alert("삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  // ===============================
  // 테이블 데이터
  // ===============================
  const computedDividends = useMemo(() => {
    return dividends.map((dividend, index) => ({
      ...dividend,
      row_index: (page - 1) * PAGE_SIZE + index + 1,
    }));
  }, [dividends, page]);

  const fetchAllDividendsForDownload = useCallback(async () => {
    try {
      const { rows } = await fetchDividends({
        currentPage: 1,
        pageSize: 9999,
        year: searchYear,
        month: searchMonth,
        bank: searchBank,
        stock: searchStock,
      });

      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [searchYear, searchMonth, searchBank, searchStock]);

  // ===============================
  // 테이블 컬럼
  // ===============================
  const headers = [
    {
      label: "순번",
      key: "row_index",
    },
    {
      label: "은행명",
      key: "bnnm",
    },
    {
      label: "주식종목",
      key: "stcknm",
      render: (val, row) => val || row.stcktea || "-",
    },
    {
      label: "거래일자",
      key: "dlngymd",
      render: (val) => {
        if (!val) return "-";

        const clean = String(val).replace(/[^0-9]/g, "");

        if (clean.length !== 8) {
          return val;
        }

        return clean.replace(
          /(\d{4})(\d{2})(\d{2})/,
          "$1-$2-$3"
        );
      },
    },
    {
      label: "거래금액",
      key: "dlngamt",
      render: (val, row) =>
        formatCurrency(val, row.ntnnm),
    },
    {
      label: "배당금",
      key: "dvdnd",
      render: (val, row) =>
        formatCurrency(val, row.ntnnm),
    },
  ];

    // ===============================
  // 초기 데이터 조회
  // ===============================
  useEffect(() => {
    loadBanks(setBanks);
    loadStocks(setStocks);
  }, []);

  // ===============================
  // 종목 조회 후 목록 조회
  // ===============================
  useEffect(() => {
    if (stocks.length > 0) {
      Promise.resolve().then(() => loadDividendList());
    }
  }, [stocks, loadDividendList]);

  return {
    // 데이터
    dividends,
    banks,
    stocks,

    // 차트
    monthlyData,

    // 파일
    file,
    setFile,
    preview,
    setPreview,

    // Dialog
    openSave,
    setOpenSave,
    openDetail,
    setOpenDetail,

    // Detail
    detail,
    setDetail,

    // Form
    form,
    setForm,

    // Tab
    tab,
    setTab,

    // Search
    searchYear,
    setSearchYear,
    searchMonth,
    setSearchMonth,
    searchBank,
    setSearchBank,
    searchStock,
    setSearchStock,

    // Form Function
    changeForm,
    changeDetail,
    resetForm,

    // CRUD
    search,
    save,
    update,
    remove,

    // Table
    computedDividends,
    headers,
    fetchAllDividendsForDownload,

    // Paging
    page,
    total,
    pageSize,
    monthlyTable,
    // 목록 조회
    loadDividends: loadDividendList,
  };
}
import { useEffect, useState } from "react";
import { tradeService } from "../../api/trade/tradeApi";
import { bankService } from "../../api/bank/bankApi";
import { stockService } from "../../api/stock/stockApi";

export function useTrade() {
  const [trades, setTrades] = useState([]);
  const [banks, setBanks] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const initialSearchState = {
    startDate: "",
    endDate: "",
    bncd: "",
    stcktea: "",
    clsf: "",
    byngyn: "",
  };

  const initialFormState = {
    dlngymd: "",
    bncd: "",
    stcktea: "",
    dlngamt: "",
    clsf: "1",
    byngyn: "Y",
    stckcnt: "",
    ntnnm: "",
  };

  const [searchForm, setSearchForm] =
    useState(initialSearchState);

  const [form, setForm] =
    useState(initialFormState);

  const loadTrades = async (
    currentPage = 1,
    searchValues = null
  ) => {
    try {
      const activeSearch = searchValues ?? {
        startDate: searchForm.startDate,
        endDate: searchForm.endDate,
        bncd: searchForm.bncd,
        stcktea: searchForm.stcktea,
        clsf: searchForm.clsf,
        byngyn: searchForm.byngyn,
      };

      const hasSearchValues = Object.values(activeSearch).some(
        (value) => String(value ?? "").trim() !== ""
      );

      const res = hasSearchValues
        ? await tradeService.searchTrades({
            page: currentPage,
            size: pageSize,
            ...activeSearch,
          })
        : await tradeService.getTrades(
            currentPage,
            pageSize
          );

      if (
        res.data &&
        Array.isArray(res.data.data)
      ) {
        setTrades(res.data.data);
        setTotal(res.data.total);
        setPage(currentPage);
      } else {
        setTrades([]);
        setTotal(0);
      }
    } catch (err) {
      console.error(err);
      setTrades([]);
      setTotal(0);
    }
  };

  const loadBanks = async () => {
    try {
      const res =
        await bankService.getBanks();

      if (
        Array.isArray(res.data)
      ) {
        setBanks(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStocks = async () => {
    try {
      const res =
        await stockService.getStocks(
          1,
          9999
        );

      if (
        res.data &&
        Array.isArray(res.data.data)
      ) {
        setStocks(
          res.data.data
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTrades(1);
    loadBanks();
    loadStocks();
  }, []);

  const handleSearch = async () => {
    try {
      const params = {
        page: 1,
        size: pageSize,
        ...searchForm,
      };

      const res =
        await tradeService.searchTrades(
          params
        );

      if (
        res.data &&
        Array.isArray(res.data.data)
      ) {
        setTrades(
          res.data.data
        );
        setTotal(
          res.data.total
        );
        setPage(
          res.data.page
        );
      } else {
        setTrades([]);
        setTotal(0);
        setPage(1);
      }
    } catch (err) {
      console.error(err);
      alert(
        "검색 중 오류가 발생했습니다."
      );
    }
  };

  const handleSearchAll =
    () => {
      setSearchForm(
        initialSearchState
      );
      loadTrades(1);
    };

  const save = async () => {
    try {

      if (!validateForm()) {
        return;
      }

      const res =
        await tradeService.createTrade(
          form
        );

      alert(
        res.data.message ||
          "저장되었습니다."
      );

      setForm(
        initialFormState
      );

      loadTrades(1);
    } catch (err) {
      console.error(err);
      alert(
        "저장 중 오류가 발생했습니다."
      );
    }
  };

  const remove = async (id) => {
    if (
      !window.confirm(
        "삭제하시겠습니까?"
      )
    )
      return;

    try {
      await tradeService.deleteTrade(
        id
      );

      alert("삭제되었습니다.");
      loadTrades(page);
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const reset = async () => {
    if (
      !window.confirm(
        "데이터 전체를 리셋하시겠습니까?"
      )
    )
      return;

    try {
      await tradeService.resetTrade();

      setForm(
        initialFormState
      );

      loadTrades(1);
    } catch (err) {
      console.error(err);
      alert("초기화 실패");
    }
  };

  const computedTrades =
    trades.map(
      (trade, index) => ({
        ...trade,
        row_index:
          (page - 1) *
            pageSize +
          index +
          1,
      })
    );

  const fetchAllTradesForDownload = async (searchValues = null) => {
    try {
      const activeSearch = searchValues ?? {
        startDate: searchForm.startDate,
        endDate: searchForm.endDate,
        bncd: searchForm.bncd,
        stcktea: searchForm.stcktea,
        clsf: searchForm.clsf,
        byngyn: searchForm.byngyn,
      };

      const hasSearchValues = Object.values(activeSearch).some(
        (value) => String(value ?? "").trim() !== ""
      );

      const res = hasSearchValues
        ? await tradeService.searchTrades({
            page: 1,
            size: 9999,
            ...activeSearch,
          })
        : await tradeService.getTrades(1, 9999);

      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ===============================
  // 입력값 검증
  // ===============================
  const validateForm = () => {
    if (!form.dlngymd) {
      alert("거래일자를 입력해주세요.");
      return false;
    }

    if (!form.bncd) {
      alert("은행을 선택하세요.");
      return false;
    }

    if (!form.stcktea) {
      alert("종목을 선택하세요.");
      return false;
    }
    if (!form.dlngamt) {
      alert("거래금액을 입력해주세요.");
      return false; 
    }
    if (!form.stckcnt) {
      alert("수량을 입력해주세요.");
      return false;
    }

    if (!form.clsf) {
      alert("거래구분을 선택하세요.");
      return false;
    }
    if (!form.byngyn) {
      alert("매수매도를 선택하세요.");
      return false;
    }

    return true;
  }

  return {
    trades,
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
  };
}
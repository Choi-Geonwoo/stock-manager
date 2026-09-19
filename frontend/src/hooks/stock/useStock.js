import { useEffect, useMemo, useState, useCallback } from "react";
import { stockService } from "../../api/stock/stockApi";
import { nationService } from "../../api/nation/nationApi";

const PAGE_SIZE = 10;

const initialForm = {
  ntncd: "",
  stcktea: "",
  stcknm: "",
  alctn: "",
  useyn: "Y",
};

export function useStock() {
  const [stocks, setStocks] = useState([]);
  const [nations, setNations] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [searchNtncd, setSearchNtncd] = useState("");
  const [searchStcktea, setSearchStcktea] = useState("");
  const [searchAlctn, setSearchAlctn] = useState("");
  const [searchStcknm, setSearchStcknm] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ===============================
  // 국가 조회
  // ===============================
  const loadNations = useCallback(async () => {
    try {
      const res = await nationService.getNations();

      setNations(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(err);

      setNations([]);
    }
  }, []);

  // ===============================
  // 주식 조회
  // ===============================
  const loadStocks = useCallback(
    async (currentPage = 1, searchValues = null) => {

      try {
        const activeSearchValues = searchValues ?? {
          ntncd: searchNtncd,
          stcktea: searchStcktea,
          alctn: searchAlctn,
          stcknm: searchStcknm,
        };

        const res =
          await stockService.getStocks(
            currentPage,
            PAGE_SIZE,
            activeSearchValues.ntncd,
            activeSearchValues.stcktea,
            activeSearchValues.alctn,
            activeSearchValues.stcknm
          );

        if (
          res.data &&
          Array.isArray(res.data.data)
        ) {

          setStocks(res.data.data);
          setTotal(res.data.total);
          setPage(currentPage);

        } else {

          setStocks([]);
          setTotal(0);

        }

      } catch (err) {

        console.error(err);

        setStocks([]);
        setTotal(0);

      }
    },
    [searchNtncd, searchStcktea, searchAlctn, searchStcknm]
  );

  useEffect(() => {

    loadStocks(1);
    loadNations();

  }, [loadNations]);

  // ===============================
  // 입력값 검증
  // ===============================
  const validateForm = () => {

    if (!form.ntncd) {
      alert("국가를 선택하세요.");
      return false;
    }

    if (!form.stcktea.trim()) {
      alert("티커를 입력하세요.");
      return false;
    }

    if (!form.stcknm.trim()) {
      alert("주식명을 입력하세요.");
      return false;
    }

    return true;
  };

  // ===============================
  // 저장
  // ===============================
  const save = async () => {

    if (!validateForm()) {
      return;
    }

    try {

      const res =
        await stockService.createStock(
          form
        );

      alert(
        res.data.message ??
        "저장되었습니다."
      );

      setForm(initialForm);

      await loadStocks(1);

    } catch (err) {

      console.error(err);

      alert("저장 실패");
    }
  };

  // ===============================
  // 삭제
  // ===============================
  const remove = async (id) => {

    if (
      !window.confirm(
        "삭제하시겠습니까?"
      )
    ) {
      return;
    }

    try {

      await stockService.deleteStock(id);

      alert("삭제되었습니다.");

      await loadStocks(page);

    } catch (err) {

      console.error(err);

      alert("삭제 실패");
    }
  };

  // ===============================
  // 초기화
  // ===============================
  const reset = async () => {

    try {

      await stockService.resetStock();

      setForm(initialForm);
      setSearchNtncd("");
      setSearchStcktea("");
      setSearchAlctn("");
      setSearchStcknm("");

      await loadStocks(1);

    } catch (err) {

      console.error(err);

      alert("초기화 실패");
    }
  };

  // ===============================
  // 검색
  // ===============================
  const handleSearch = () => {
    loadStocks(1);
  };

  // ===============================
  // 테이블 데이터
  // ===============================
  const computedStocks = useMemo(() => {
    return stocks.map((stock, index) => ({
      ...stock,
      row_index:
        (page - 1) * PAGE_SIZE +
        index +
        1,
    }));
  }, [stocks, page]);

  // ===============================
  // 테이블 헤더
  // ===============================
  const headers = useMemo(
    () => [
      {
        key: "row_index",
        label: "순번",
      },
      {
        key: "ntncd",
        label: "국가코드",
      },
      {
        key: "stcktea",
        label: "티커",
      },
      {
        key: "stcknm",
        label: "주식명",
      },
      {
        key: "alctn",
        label: "배당주기",
      },
      {
        key: "useyn",
        label: "사용여부",
        render: (value) =>
          value === "Y"
            ? "사용"
            : "미사용",
      },
    ],
    []
  );

  // ===============================
  // 반환
  // ===============================
  return {
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
    pageSize: PAGE_SIZE,

    computedStocks,
    headers,

    save,
    remove,
    reset,

    handleSearch,
    loadStocks,
  };
}
import { useEffect, useMemo, useState } from "react";
import { calendarService } from "../../api/calendar/calendarApi";

export function useCalendar() {
  const [dividends, setDividends] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [current, setCurrent] = useState(new Date());
  const [showMonthTotal, setShowMonthTotal] = useState(true);

  const year = current.getFullYear();
  const month = current.getMonth();

  const yyyymm = `${year}${String(month + 1).padStart(2, "0")}`;

  // ==========================
  // 데이터 조회
  // ==========================
  useEffect(() => {
    load();
  }, [yyyymm]);

  const load = async () => {
    try {
      const res = await calendarService.getCalendar(yyyymm);

      const list = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      setDividends(
        list.map((item) => ({
          ...item,
          dlngymd: formatApiDate(item.dlngymd),
        }))
      );

      setSelectedDate("");
    } catch (err) {
      console.error("캘린더 조회 실패", err);
      setDividends([]);
    }
  };

  // ==========================
  // 날짜 변환
  // ==========================
  const formatApiDate = (value) => {
    if (!value) return "";

    const str = String(value);

    if (/^\d{8}$/.test(str)) {
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    }

    return str;
  };

  const formatDateStr = (day) => {
    if (!day) return "";

    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // ==========================
  // 달력 셀
  // ==========================
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let i = 1; i <= lastDate; i++) {
    cells.push(i);
  }

  // ==========================
  // 해당 날짜 배당
  // ==========================
  const getDividend = (day) => {
    const date = formatDateStr(day);

    return dividends.filter(
      (item) => item.dlngymd === date
    );
  };

  // ==========================
  // 선택 날짜
  // ==========================
  const selectedDividends = useMemo(() => {
    return dividends.filter(
      (item) => item.dlngymd === selectedDate
    );
  }, [dividends, selectedDate]);

  // ==========================
  // 월 전체
  // ==========================
  const currentMonthDividends = useMemo(() => {
    return dividends;
  }, [dividends]);

  // ==========================
  // 통화
  // ==========================
  const getCurrencySymbol = (ntncd) => {
    switch (ntncd?.toUpperCase()) {
      case "US":
      case "USA":
        return "$";

      case "JP":
      case "JPN":
        return "¥";

      case "KR":
      case "KOR":
      default:
        return "₩";
    }
  };

  const formatCurrency = (amount, ntncd) => {
    const symbol = getCurrencySymbol(ntncd);
    const value = Number(amount ?? 0).toLocaleString();

    return symbol === "$"
      ? `${symbol}${value}`
      : `${value} ${symbol === "₩" ? "원" : symbol}`;
  };

  return {
    year,
    month,
    cells,

    current,
    setCurrent,

    selectedDate,
    setSelectedDate,

    showMonthTotal,
    setShowMonthTotal,

    getDividend,
    formatDateStr,

    selectedDividends,
    currentMonthDividends,

    formatCurrency,
  };
}
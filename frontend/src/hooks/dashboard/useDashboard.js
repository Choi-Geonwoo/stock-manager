import { useEffect, useMemo, useState } from "react";
import { dividendsService } from "../../api/dividend/dividendApi";
import { stockService } from "../../api/stock/stockApi";
import { nationService } from "../../api/nation/nationApi";
import { tradeService } from "../../api/trade/tradeApi";
import { balanceApi } from "../../api/balance/balanceApi";
import {
  getDividendMonthKey,
  getMonthKey,
  normalizeList,
} from "../../utils/comUtils";

const normalizeNationName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, "").toLowerCase();

  if (normalized.includes("미국") || normalized.includes("usa") || normalized.includes("us")) {
    return "미국";
  }

  if (normalized.includes("한국") || normalized.includes("korea") || normalized.includes("kr")) {
    return "한국";
  }

  return null;
};

const getChartCountry = (countryName) => {
  const normalized = String(countryName || "").replace(/\s+/g, "").toLowerCase();

  if (normalized.includes("미국") || normalized.includes("usa") || normalized.includes("us")) {
    return "usa";
  }

  if (normalized.includes("한국") || normalized.includes("korea") || normalized.includes("kr")) {
    return "korea";
  }

  return null;
};

export function useDashboard() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyCumulativeData, setMonthlyCumulativeData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [nationData, setNationData] = useState([]);
  const [rows, setRows] = useState([]);
  const [thisMonthByNation, setThisMonthByNation] = useState([]);
  const [totalDividendByNation, setTotalDividendByNation] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [nationMap, setNationMap] = useState({});
  const [countryStockDividendData, setCountryStockDividendData] = useState([]);
  const [monthlyCountryDividendData, setMonthlyCountryDividendData] = useState([]);
  const [monthlyDividendData, setMonthlyDividendData] = useState([]);
  const [monthlyInvestmentData, setMonthlyInvestmentData] = useState([]);
  const [holdingCount, setHoldingCount] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalInvestment: { krw: 0, usd: 0 },
    annualDividendByNation: [],
    averageMonthlyDividendByNation: [],
    dividendChangeRate: null,
    dividendPaymentCount: 0,
    averageDividend: 0,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [dividendRes, stockRes, nationRes, tradeRes, balanceRes] = await Promise.all([
        dividendsService.getDividends(1, 9999),
        stockService.getStocks(1, 9999),
        nationService.getNations(),
        tradeService.getTrades(1, 9999),
        balanceApi.getBalanceList(),
      ]);

      const dividendRows = normalizeList(dividendRes?.data);
      const tradeRows = normalizeList(tradeRes?.data);
      const stocks = normalizeList(stockRes?.data);
      const nations = normalizeList(nationRes?.data);
      const balances = normalizeList(balanceRes?.data);

      setRows(dividendRows);
      setHoldingCount(balances.length);

      const stockMapByTicker = {};
      const nationMapByCode = {};
      stocks.forEach((stock) => {
        if (stock?.stcktea) {
          stockMapByTicker[stock.stcktea] = {
            ntncd: stock.ntncd,
            ntnnm: stock.ntnnm || "",
          };
        }
      });

      nations.forEach((nation) => {
        if (nation?.ntncd) {
          nationMapByCode[nation.ntncd] = nation.ntnnm || "";
        }
      });

      setStockMap(stockMapByTicker);
      setNationMap(nationMapByCode);

      const monthly = {};
      const stockTotals = {};
      const totalByNation = {};
      const annualByNation = {};
      const monthlyByNation = {};
      const countryByMonth = {};
      const countryStockTotals = {};
      const currentYear = getMonthKey().slice(0, 4);
      const currentMonthKey = getMonthKey();
      const previousMonthDate = new Date(`${currentMonthKey}-01T00:00:00Z`);
      previousMonthDate.setUTCMonth(previousMonthDate.getUTCMonth() - 1);
      const previousMonthKey = previousMonthDate.toISOString().slice(0, 7);

      dividendRows.forEach((row) => {
        const amount = Number(row.dlngamt || 0);
        const ticker = row.stcktea || "";
        const month = getDividendMonthKey(row.dlngymd);
        const stockInfo = stockMapByTicker[ticker] || {};
        const resolvedNationName = normalizeNationName(
          nationMapByCode[stockInfo.ntncd] || stockInfo.ntnnm || row.ntnnm || ""
        );

        if (!resolvedNationName) {
          return;
        }

        totalByNation[resolvedNationName] = (totalByNation[resolvedNationName] || 0) + amount;

        if (month) {
          monthly[month] = (monthly[month] || 0) + amount;

          if (month.startsWith(currentYear)) {
            annualByNation[resolvedNationName] =
              (annualByNation[resolvedNationName] || 0) + amount;
          }

          if (!monthlyByNation[resolvedNationName]) {
            monthlyByNation[resolvedNationName] = {};
          }

          monthlyByNation[resolvedNationName][month] =
            (monthlyByNation[resolvedNationName][month] || 0) + amount;

          const chartCountry = getChartCountry(resolvedNationName);
          if (chartCountry) {
            if (!countryByMonth[month]) {
              countryByMonth[month] = {};
            }

            countryByMonth[month][chartCountry] =
              (countryByMonth[month][chartCountry] || 0) + amount;
          }
        }

        if (ticker) {
          stockTotals[ticker] = (stockTotals[ticker] || 0) + amount;
        }

        const stockName = String(row.stcknm || ticker || "기타");
        const stockKey = `${resolvedNationName}::${stockName}`;
        countryStockTotals[stockKey] = (countryStockTotals[stockKey] || 0) + amount;
      });

      const nextMonthlyData = Object.keys(monthly)
        .sort()
        .map((monthKey) => ({ month: monthKey, value: monthly[monthKey] }));

      let cumulativeValue = 0;
      const nextMonthlyCumulativeData = nextMonthlyData.map((item) => {
        cumulativeValue += item.value;
        return { month: item.month, value: cumulativeValue };
      });

      const nextCountryStockDividendData = Object.entries(countryStockTotals)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => {
          const [country, stockName] = key.split("::");
          return {
            name: stockName,
            country,
            korea: country === "한국" ? value : 0,
            usa: country === "미국" ? value : 0,
          };
        })
        .sort((a, b) => (b.korea + b.usa) - (a.korea + a.usa));

      const runningTotals = {};
      const nextMonthlyCountryDividendData = Object.keys(countryByMonth)
        .sort()
        .map((monthKey) => {
          const monthEntry = { month: monthKey };
          const countries = Object.keys(countryByMonth[monthKey] || {});

          countries.forEach((country) => {
            runningTotals[country] =
              (runningTotals[country] || 0) + (countryByMonth[monthKey][country] || 0);
          });

          monthEntry.korea = runningTotals.korea || 0;
          monthEntry.usa = runningTotals.usa || 0;

          return monthEntry;
        })
        .filter((entry) => entry.korea > 0 || entry.usa > 0);

      const monthlyDividendData = Array.from(
        { length: Number(getMonthKey().slice(5, 7)) },
        (_, index) => {
          const monthKey = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
          const monthEntry = countryByMonth[monthKey] || {};
          return {
            month: monthKey,
            krw: monthEntry.korea || 0,
            usd: monthEntry.usa || 0,
          };
        }
      );

      const monthlyInvestmentMap = {};
      tradeRows.forEach((row) => {
        const monthKey = getDividendMonthKey(row.dlngymd);
        const amount = Number(row.dlngamt || 0);

        if (!monthKey || row.byngyn !== "Y") {
          return;
        }

        const nationName = normalizeNationName(row.ntnnm || "");
        const bucket = nationName === "미국" ? "usd" : "krw";

        if (!monthlyInvestmentMap[monthKey]) {
          monthlyInvestmentMap[monthKey] = { month: monthKey, krw: 0, usd: 0 };
        }

        monthlyInvestmentMap[monthKey][bucket] += amount;
      });

      const allMonthlyInvestmentData = Object.keys(monthlyInvestmentMap)
        .sort()
        .map((monthKey) => ({
          month: monthKey,
          krw: Number(monthlyInvestmentMap[monthKey].krw || 0),
          usd: Number(monthlyInvestmentMap[monthKey].usd || 0),
        }))
        .filter((entry) => entry.krw > 0 || entry.usd > 0);

      const currentMonthNumber = Number(getMonthKey().slice(5, 7));
      const nextMonthlyInvestmentData = Array.from(
        { length: currentMonthNumber },
        (_, index) => {
          const monthKey = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
          const entry = monthlyInvestmentMap[monthKey] || {};
          return {
            month: monthKey,
            krw: Number(entry.krw || 0),
            usd: Number(entry.usd || 0),
          };
        }
      );

      const totalInvestment = allMonthlyInvestmentData.reduce(
        (totals, item) => ({
          krw: totals.krw + item.krw,
          usd: totals.usd + item.usd,
        }),
        { krw: 0, usd: 0 }
      );

      const currentMonthDividend = monthly[currentMonthKey] || 0;
      const previousMonthDividend = monthly[previousMonthKey] || 0;
      const currentYearDividendRows = dividendRows.filter((row) =>
        getDividendMonthKey(row.dlngymd).startsWith(currentYear)
      );
      const currentYearDividendTotal = currentYearDividendRows.reduce(
        (sum, row) => sum + Number(row.dlngamt || 0),
        0
      );
      const dividendChangeRate = previousMonthDividend === 0
        ? (currentMonthDividend > 0 ? null : 0)
        : ((currentMonthDividend - previousMonthDividend) / previousMonthDividend) * 100;

      setDashboardSummary({
        totalInvestment,
        annualDividendByNation: Object.entries(annualByNation)
          .filter(([, amount]) => amount > 0)
          .map(([country, amount]) => ({ country, amount })),
        averageMonthlyDividendByNation: Object.entries(monthlyByNation)
          .map(([country, months]) => {
            const values = Object.values(months);
            const total = values.reduce((sum, value) => sum + value, 0);
            return {
              country,
              amount: values.length ? total / values.length : 0,
            };
          })
          .filter(({ amount }) => amount > 0),
        dividendChangeRate,
        dividendPaymentCount: currentYearDividendRows.length,
        averageDividend: currentYearDividendRows.length
          ? currentYearDividendTotal / currentYearDividendRows.length
          : 0,
      });

      setMonthlyData(nextMonthlyData);
      setMonthlyCumulativeData(nextMonthlyCumulativeData);
      setCountryStockDividendData(nextCountryStockDividendData);
      setMonthlyCountryDividendData(nextMonthlyCountryDividendData);
      setMonthlyDividendData(monthlyDividendData);
      setMonthlyInvestmentData(nextMonthlyInvestmentData);
      setTotalDividendByNation(
        Object.entries(totalByNation)
          .filter(([, value]) => value > 0)
          .map(([country, value]) => ({ country, amount: value }))
      );

      setStockData(
        Object.keys(stockTotals).map((ticker) => ({
          name: ticker,
          value: stockTotals[ticker],
        }))
      );

      setNationData(
        Object.keys(totalByNation).map((country) => ({
          name: country,
          value: totalByNation[country],
        }))
      );

      const monthTotalByNation = {};

      dividendRows.forEach((row) => {
        const dividendMonthKey = getDividendMonthKey(row.dlngymd);
        if (!dividendMonthKey || dividendMonthKey !== currentMonthKey) {
          return;
        }

        const ticker = row.stcktea || "";
        const stockInfo = stockMapByTicker[ticker] || {};
        const nationName = normalizeNationName(
          nationMapByCode[stockInfo.ntncd] || stockInfo.ntnnm || row.ntnnm || ""
        );

        if (!nationName) {
          return;
        }

        monthTotalByNation[nationName] =
          (monthTotalByNation[nationName] || 0) + Number(row.dlngamt || 0);
      });

      setThisMonthByNation(
        Object.entries(monthTotalByNation)
          .filter(([, amount]) => amount > 0)
          .map(([country, amount]) => ({ country, amount }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const totalDividend = useMemo(
    () => totalDividendByNation.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [totalDividendByNation]
  );

  const thisMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

  return {
    monthlyData,
    monthlyCumulativeData,
    stockData,
    nationData,
    rows,
    totalDividend,
    totalDividendByNation,
    thisMonth,
    thisMonthByNation,
    stockMap,
    nationMap,
    COLORS,
    countryStockDividendData,
    monthlyCountryDividendData,
    monthlyInvestmentData,
    monthlyDividendData,
    holdingCount,
    dashboardSummary,
  };
}
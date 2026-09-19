export const buildChartData = (rows = [], stocks = []) => {
  const monthly = {};
  const stock = {};
  const nation = {};

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      monthlyData: [],
      stockData: [],
      nationData: [],
    };
  }

  const stockMap = Object.fromEntries(
    (Array.isArray(stocks) ? stocks : []).map((s) => {
      const ticker = Array.isArray(s)
        ? s[2]
        : (s?.stcktea || s?.stcknm || s?.ticker || s?.symbol || "");
      const nationCd = Array.isArray(s)
        ? s[1]
        : (s?.ntncd || "");

      return [ticker, { ticker, ntncd: nationCd }];
    })
  );

  rows.forEach((r) => {
    const rawDate = String(r?.dlngymd ?? "").replace(/[^0-9]/g, "");
    const month = rawDate.length >= 6
      ? `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}`
      : "";

    const amount = Number(r?.dvdnd ?? r?.dvdn ?? 0) || 0;
    const ticker = r?.stcktea || r?.stcknm || r?.ticker || r?.symbol || "";

    if (month) {
      monthly[month] = (monthly[month] || 0) + amount;
    }

    if (ticker) {
      stock[ticker] = (stock[ticker] || 0) + amount;
    }

    const nationCd = stockMap[ticker]?.ntncd;

    if (nationCd) {
      nation[nationCd] = (nation[nationCd] || 0) + amount;
    }
  });

  return {
    monthlyData: Object.keys(monthly)
      .sort()
      .map((k) => ({
        month: k,
        value: monthly[k],
      })),

    stockData: Object.keys(stock).map((k) => ({
      name: k,
      value: stock[k],
    })),

    nationData: Object.keys(nation).map((k) => ({
      name: k,
      value: nation[k],
    })),
  };
};
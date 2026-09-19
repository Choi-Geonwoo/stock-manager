export const buildChartData = (rows, stocks) => {
  const monthly = {};
  const stock = {};
  const nation = {};

  const stockMap = Object.fromEntries(
    stocks.map((s) => [s.stcktea, s])
  );

  rows.forEach((r) => {
    const digits = String(r.dlngymd || "").replace(/[^0-9]/g, "");
    const month = digits.length >= 6 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}` : "";
    const amount = Number(r.dvdnd) || 0;
    const ticker = r.stcktea || "";

    if (month) {
      monthly[month] =
        (monthly[month] || 0) + amount;
    }

    if (ticker) {
      stock[ticker] =
        (stock[ticker] || 0) + amount;
    }

    const nationCd =
      stockMap[ticker]?.ntncd;

    if (nationCd) {
      nation[nationCd] =
        (nation[nationCd] || 0) + amount;
    }
  });

  return {
    monthlyData: Object.keys(monthly)
      .sort()
      .map((k) => ({
        month: k,
        value: monthly[k],
      })),

    stockData: Object.keys(stock).map(
      (k) => ({
        name: k,
        value: stock[k],
      })
    ),

    nationData: Object.keys(nation).map(
      (k) => ({
        name: k,
        value: nation[k],
      })
    ),
  };
};
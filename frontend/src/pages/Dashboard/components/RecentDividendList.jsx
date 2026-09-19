import { formatCurrency, formatDate } from "../../../utils/comUtils";

export default function RecentDividendList({ rows }) {
  if (rows.length === 0) {
    return <div>배당 데이터 없음</div>;
  }

  return rows
    .slice(-5)
    .reverse()
    .map((row) => (
      <div key={row.alctndlngdsctn_no} className="recent-row">
        <div>{formatDate(row.dlngymd)}</div>
        <div>{row.stcktea}</div>
        <div>{formatCurrency(row.dvdnd)}</div>
      </div>
    ));
}

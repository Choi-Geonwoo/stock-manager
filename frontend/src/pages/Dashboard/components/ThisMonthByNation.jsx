import { formatCurrency, getCurrencySymbol } from "../../../utils/comUtils";

export default function ThisMonthByNation({ items, emptyText = "이번달 배당 데이터 없음" }) {
  if (!items || items.length === 0) {
    return <div>{emptyText}</div>;
  }

  return (
    <div className="country-amount-list">
      {items.map((item) => (
        <div key={item.country} className="country-amount-item">
          <span>{item.country}</span>
          <strong>
            {getCurrencySymbol(item.country)} {formatCurrency(item.amount)}
          </strong>
        </div>
      ))}
    </div>
  );
}

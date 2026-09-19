import { useStock } from "../../hooks/stock/useStock";
import StockView from "./StockView";

export default function StockPage() {
  const stock = useStock();

  return <StockView {...stock} />;
}
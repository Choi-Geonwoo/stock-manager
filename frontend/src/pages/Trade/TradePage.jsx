import { useTrade } from "../../hooks/trade/useTrade";
import TradeView from "./TradeView";

export default function TradePage() {
  const trade = useTrade();

  return <TradeView {...trade} />;
}
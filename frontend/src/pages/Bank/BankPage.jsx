import { useBank } from "../../hooks/bank/useBank";
import BankView from "./BankView";

export default function BankPage() {
  const bank = useBank();

  return <BankView {...bank} />;
}
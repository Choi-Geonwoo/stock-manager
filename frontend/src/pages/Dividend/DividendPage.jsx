import { useDividend } from "../../hooks/dividend/useDividend";
import DividendView from "./DividendView";

export default function DividendPage() {
  const dividend = useDividend();

  return <DividendView {...dividend} />;
}
import { useNation } from "../../hooks/nation/useNation";
import NationView from "./NationView";

export default function NationPage() {
  const nation = useNation();

  return <NationView {...nation} />;
}
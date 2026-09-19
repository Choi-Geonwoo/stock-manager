import { useDashboard } from "../../hooks/dashboard/useDashboard";
import DashboardView from "./DashboardView";

export default function DashboardPage() {
  const dashboard = useDashboard();

  return <DashboardView {...dashboard} />;
}
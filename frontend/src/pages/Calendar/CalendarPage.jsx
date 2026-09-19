import { useCalendar } from "../../hooks/calendar/useCalendar";
import CalendarView from "./CalendarView";

export default function CalendarPage() {
  const calendar = useCalendar();

  return <CalendarView {...calendar} />;
}
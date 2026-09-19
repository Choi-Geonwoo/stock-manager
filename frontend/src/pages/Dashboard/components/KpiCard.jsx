export default function KpiCard({ title, children }) {
  return (
    <div className="kpi-card">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

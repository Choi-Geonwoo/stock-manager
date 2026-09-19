import "../../styles/dashboard.css";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import KpiCard from "./components/KpiCard";
import SectionCard from "./components/SectionCard";
import ThisMonthByNation from "./components/ThisMonthByNation";
import { formatCurrency } from "../../utils/comUtils";

export default function DashboardView({
  countryStockDividendData = [],
  monthlyCountryDividendData = [],
  monthlyInvestmentData = [],
  monthlyDividendData = [],
  holdingCount = 0,
  stockData = [],
  totalDividendByNation = [],
  thisMonthByNation = [],
  dashboardSummary = {},
}) {
  const totalInvestment = dashboardSummary.totalInvestment || { krw: 0, usd: 0 };
  const annualDividendByNation = dashboardSummary.annualDividendByNation || [];
  const averageMonthlyDividendByNation = dashboardSummary.averageMonthlyDividendByNation || [];
  const dividendChangeRate = dashboardSummary.dividendChangeRate;
  const dividendChangeText = dividendChangeRate === null
    ? "전월 데이터 없음"
    : `${dividendChangeRate >= 0 ? "+" : ""}${dividendChangeRate.toFixed(1)}%`;

  return (
    <div className="dashboard-page">
      <h1>배당 대시보드</h1>

      <div className="kpi-grid">
        <KpiCard title="총 배당금">
          <ThisMonthByNation items={totalDividendByNation} emptyText="총 배당 데이터 없음" />
        </KpiCard>

        <KpiCard title="보유 종목 수">
          <p>{holdingCount}개</p>
        </KpiCard>

        <KpiCard title="총 투자금액">
          <div className="kpi-amount-list">
            <strong>{formatCurrency(totalInvestment.krw, "한국")}</strong>
            <strong>{formatCurrency(totalInvestment.usd, "미국")}</strong>
          </div>
        </KpiCard>

        <KpiCard title="올해 배당금">
          <ThisMonthByNation items={annualDividendByNation} emptyText="올해 배당 데이터 없음" />
        </KpiCard>

        <KpiCard title="월평균 배당금">
          <ThisMonthByNation items={averageMonthlyDividendByNation} emptyText="월평균 배당 데이터 없음" />
        </KpiCard>

        <KpiCard title="전월 대비 배당금 증감률">
          <p>{dividendChangeText}</p>
        </KpiCard>

        <KpiCard title="배당 지급 횟수 및 평균 배당금">
          <div className="kpi-amount-list">
            <strong>{dashboardSummary.dividendPaymentCount || 0}회</strong>
            <strong>{formatCurrency(dashboardSummary.averageDividend || 0, "한국")}</strong>
          </div>
        </KpiCard>

        <KpiCard title="이번달 국가별 누적 배당금">
          <ThisMonthByNation items={thisMonthByNation} emptyText="이번달 배당 데이터 없음" />
        </KpiCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, margin: "20px 0" }}>
        <SectionCard title="종목별 배당금">
          {countryStockDividendData.length === 0 ? (
            <div style={{ padding: "30px 0", color: "#6b7280" }}>데이터 없음</div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={countryStockDividendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={72} />
                  <YAxis yAxisId="korea" orientation="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="usa" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value, name === "미국" ? "미국" : "한국"),
                      name,
                    ]}
                  />
                  <Legend />
                  <Line yAxisId="korea" type="monotone" dataKey="korea" name="한국" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="usa" type="monotone" dataKey="usa" name="미국" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="월별 누적 배당금 (국가별)">
          {monthlyCountryDividendData.length === 0 ? (
            <div style={{ padding: "30px 0", color: "#6b7280" }}>월별 누적 배당 데이터 없음</div>
          ) : (
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyCountryDividendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="korea" orientation="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="usa" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value, name === "미국" ? "미국" : "한국"),
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="korea" dataKey="korea" name="한국" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="usa" dataKey="usa" name="미국" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="월별 배당 금액">
        {monthlyDividendData.length === 0 ? (
          <div style={{ padding: "30px 0", color: "#6b7280" }}>월별 투자금액 데이터 없음</div>
        ) : (
          <div style={{ width: "100%", height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDividendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "krw") return [formatCurrency(value, "한국"), "원화"];
                    if (name === "usd") return [formatCurrency(value, "미국"), "달러"];
                    return [formatCurrency(value), name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="krw" name="원화" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="usd" name="달러" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
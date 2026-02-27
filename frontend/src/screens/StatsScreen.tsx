import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";

type StatsTab = "my" | "overall";

interface StatsScreenProps {
  tripId: string;
  onBack: () => void;
}

const CHART_COLORS = ["#0f172a", "#2563eb", "#059669", "#f59e0b", "#ef4444", "#7c3aed"];

function StatsScreen({ tripId, onBack }: StatsScreenProps) {
  const [tab, setTab] = useState<StatsTab>("my");
  const stats = useStore((state) => state.stats);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchStats = useStore((state) => state.fetchStats);

  useEffect(() => {
    void fetchStats(tripId);
  }, [tripId, fetchStats]);

  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "RUB";

  const chartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return tab === "my" ? stats.my : stats.overall;
  }, [stats, tab]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.amount, 0),
    [chartData],
  );

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <header className="flex-none z-10 bg-slate-50">
        <Navbar onBack={onBack} title="Статистика" />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
            onClick={() => setTab("my")}
            type="button"
          >
            Моя
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === "overall" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
            onClick={() => setTab("overall")}
            type="button"
          >
            Общая
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-500">Загрузка статистики...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Card>
          <p className="text-sm text-slate-500">Итого</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatMoney(total)} {currency}
          </p>
        </Card>

        <Card>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        key={`${entry.category}-${index}`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, payload) => {
                      const numericValue = Number(value ?? 0);
                      const percent = total > 0 ? (numericValue / total) * 100 : 0;
                      return [
                        `${formatMoney(numericValue)} ${currency} (${formatMoney(percent)}%)`,
                        CATEGORY_LABELS[payload?.payload?.category] ??
                          payload?.payload?.category ??
                          "Категория",
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Нет данных для графика</p>
          )}
        </Card>

        <section className="space-y-3">
          {chartData.map((item, index) => (
            <Card key={`${item.category}-${index}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatMoney(item.amount)} {currency} (
                  {formatMoney(total > 0 ? (item.amount / total) * 100 : 0)}%)
                </span>
              </div>
            </Card>
          ))}
          {!loading && chartData.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Категорий пока нет</p>
            </Card>
          ) : null}
        </section>
        </div>
      </main>
    </div>
  );
}

export default StatsScreen;

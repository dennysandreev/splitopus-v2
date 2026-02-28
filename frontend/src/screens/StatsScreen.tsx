import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";

interface StatsScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

type StatsTab = "my" | "overall";

const CHART_COLORS = ["#6D4AFF", "#8F6DFF", "#8A7DFF", "#5E8BFF", "#38B77B", "#F39C5E", "#E43F5A"];

function StatsScreen({ tripId, onBack, onOpenSettings }: StatsScreenProps) {
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
  const currency = trip?.currency ?? "THB";

  const chartData = useMemo(() => {
    if (!stats) return [];
    return tab === "my" ? stats.my : stats.overall;
  }, [stats, tab]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.amount, 0), [chartData]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Статистика" />
      </header>
      <main className="app-main">
        <div className="space-y-4">
          <div className="rounded-input bg-primary/5 p-1">
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${
                  tab === "my" ? "bg-white text-textMain" : "text-textMuted"
                }`}
                onClick={() => setTab("my")}
                type="button"
              >
                Моя
              </button>
              <button
                className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${
                  tab === "overall" ? "bg-white text-textMain" : "text-textMuted"
                }`}
                onClick={() => setTab("overall")}
                type="button"
              >
                Общая
              </button>
            </div>
          </div>

          <Card className="p-5">
            <p className="text-sm text-textMuted">Итого</p>
            <p className="mt-1 text-3xl font-semibold text-textMain">
              {formatMoney(total)} {currency}
            </p>
          </Card>

          <Card className="p-4">
            {chartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="amount" innerRadius={65} outerRadius={98} paddingAngle={2}>
                      {chartData.map((entry, index) => (
                        <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={`${entry.category}-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, payload) => {
                        const numericValue = Number(value ?? 0);
                        const percent = total > 0 ? (numericValue / total) * 100 : 0;
                        return [
                          `${formatMoney(numericValue)} ${currency} (${formatMoney(percent)}%)`,
                          CATEGORY_LABELS[payload?.payload?.category] ?? payload?.payload?.category ?? "Категория",
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-textMuted">Нет данных для графика</p>
            )}
          </Card>

          <div className="space-y-2">
            {chartData.map((item, index) => (
              <Card key={`${item.category}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-textMain">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-textMain">
                    {formatMoney(item.amount)} {currency} ({formatMoney(total > 0 ? (item.amount / total) * 100 : 0)}%)
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {loading ? <p className="text-sm text-textMuted">Загрузка статистики...</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </main>
    </div>
  );
}

export default StatsScreen;

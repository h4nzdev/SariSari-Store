import { useEffect, useState } from "react";
import { getDashboard, getAnalytics } from "../api";
import { parseTS, peso, pct } from "../utils";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  AlertTriangle,
  BarChart2,
  LayoutDashboard,
} from "lucide-react";
import {
  ComposedChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Shared ───────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
];

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #fed7aa",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-orange-100 p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function DeltaBadge({ now, prev }) {
  const delta = pct(now, prev);
  if (delta === null) return null;
  const up = Number(delta) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      <Icon className="w-3 h-3" />
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor, sub, delta }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
            {delta}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} ml-3 flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function Overview({ data }) {
  // Safety checks with default values
  const todaySales = data?.today_sales ?? 0;
  const yesterdaySales = data?.yesterday_sales ?? 0;
  const todayRevenue = data?.today_revenue ?? 0;
  const yesterdayRevenue = data?.yesterday_revenue ?? 0;
  const totalProducts = data?.total_products ?? 0;
  const lowStockCount = data?.low_stock_count ?? 0;
  const todaySalesList = data?.today_sales_list ?? [];
  const lowStockProducts = data?.low_stock_products ?? [];

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={ShoppingBag}
          label="Today's Sales"
          value={todaySales}
          color="text-orange-600"
          bgColor="bg-orange-100"
          sub="transactions"
          delta={<DeltaBadge now={todaySales} prev={yesterdaySales} />}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Revenue"
          value={peso(todayRevenue)}
          color="text-green-600"
          bgColor="bg-green-100"
          sub={`Yesterday: ${peso(yesterdayRevenue)}`}
          delta={<DeltaBadge now={todayRevenue} prev={yesterdayRevenue} />}
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={totalProducts}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStockCount}
          color="text-red-600"
          bgColor="bg-red-100"
          sub="≤ 10 units"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Today's Sales</h3>
          </div>
          {todaySalesList.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              No sales recorded yet today.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">
                    Sale #
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">
                    Items
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">
                    Time
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todaySalesList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-orange-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-orange-600">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {sale.item_count} item{sale.item_count !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {parseTS(sale.created_at)?.toLocaleString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) ?? "N/A"}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800 text-right">
                      {peso(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-800">Low Stock Alert</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              All products are well-stocked!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">{p.category_name}</p>
                  </div>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      p.quantity === 0
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

const fmtDate = (s) => {
  if (!s) return "";
  try {
    return new Date(s + "T12:00:00").toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
};

const fmtHour = (h) => {
  if (h === 0) return "12AM";
  if (h === 12) return "12PM";
  return h < 12 ? `${h}AM` : `${h - 12}PM`;
};

function WeekBadge({ now, prev, label }) {
  const delta = pct(now, prev);
  if (delta === null)
    return <span className="text-xs text-gray-400">{label}</span>;
  const up = Number(delta) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? "text-green-600" : "text-red-500"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {up ? "+" : ""}
      {delta}% vs last week
    </span>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        // Ensure all required fields exist with defaults
        setData({
          top_products: res?.top_products ?? [],
          peak_hours: res?.peak_hours ?? [],
          daily_revenue: res?.daily_revenue ?? [],
          category_revenue: res?.category_revenue ?? [],
          totals: {
            total_revenue: res?.totals?.total_revenue ?? 0,
            total_sales: res?.totals?.total_sales ?? 0,
          },
          this_week: {
            revenue: res?.this_week?.revenue ?? 0,
            sales_count: res?.this_week?.sales_count ?? 0,
          },
          last_week: {
            revenue: res?.last_week?.revenue ?? 0,
            sales_count: res?.last_week?.sales_count ?? 0,
          },
        });
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setError("Failed to load analytics data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasData = data.top_products.length > 0;

  // Fill store hours 5AM–11PM
  const hoursMap = Object.fromEntries(
    data.peak_hours.map((h) => [h.hour, h.sales_count]),
  );
  const peakHoursData = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 5;
    return { label: fmtHour(hour), sales_count: hoursMap[hour] || 0 };
  });

  const chartedRevenue = data.daily_revenue.map((d) => ({
    ...d,
    date: fmtDate(d.date),
  }));

  const avgPerSale =
    data.totals.total_sales > 0
      ? data.totals.total_revenue / data.totals.total_sales
      : 0;
  const avgPerSaleLastWeek =
    data.last_week.sales_count > 0
      ? data.last_week.revenue / data.last_week.sales_count
      : 0;
  const avgPerSaleThisWeek =
    data.this_week.sales_count > 0
      ? data.this_week.revenue / data.this_week.sales_count
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">This Week Revenue</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {peso(data.this_week.revenue)}
          </p>
          <div className="mt-1.5">
            <WeekBadge
              now={data.this_week.revenue}
              prev={data.last_week.revenue}
              label="No data"
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">This Week Sales</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {data.this_week.sales_count}
          </p>
          <div className="mt-1.5">
            <WeekBadge
              now={data.this_week.sales_count}
              prev={data.last_week.sales_count}
              label="No data"
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Avg per Sale (this week)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {peso(avgPerSaleThisWeek)}
          </p>
          <div className="mt-1.5">
            <WeekBadge
              now={avgPerSaleThisWeek}
              prev={avgPerSaleLastWeek}
              label="No data"
            />
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-sm text-amber-700 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 flex-shrink-0" />
          Complete some sales first — detailed charts will appear here
          automatically.
        </div>
      )}

      {/* Revenue Trend — full width, dual axis: revenue area + sales count bars */}
      {chartedRevenue.length > 0 && (
        <ChartCard
          title="Revenue Trend"
          subtitle="Last 7 days — revenue (area) and number of sales (bars)"
        >
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={chartedRevenue}
              margin={{ left: 10, right: 40, bottom: 0, top: 5 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickFormatter={(v) => `₱${v}`}
                width={64}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                formatter={(v, name) =>
                  name === "revenue"
                    ? [`₱${Number(v).toFixed(2)}`, "Revenue"]
                    : [v, "Sales"]
                }
                contentStyle={tooltipStyle}
              />
              <Bar
                yAxisId="count"
                dataKey="sales_count"
                fill="#fed7aa"
                radius={[3, 3, 0, 0]}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#ea580c" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Two-column row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        {data.top_products.length > 0 && (
          <ChartCard title="Top Products" subtitle="By units sold (all time)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.top_products}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  width={148}
                  tick={{ fontSize: 10, fill: "#374151" }}
                  tickFormatter={(v) =>
                    v?.length > 20 ? v.slice(0, 20) + "…" : (v ?? "")
                  }
                />
                <Tooltip
                  formatter={(v) => [v, "Units sold"]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total_qty" fill="#f97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Revenue by Category */}
        {data.category_revenue.length > 0 && (
          <ChartCard title="Revenue by Category" subtitle="All-time breakdown">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.category_revenue}
                  dataKey="revenue"
                  nameKey="category_name"
                  cx="42%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {data.category_revenue.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [peso(v), "Revenue"]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: "11px", color: "#374151" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Peak Hours — full width */}
      {data.peak_hours.length > 0 && (
        <ChartCard
          title="Peak Hours"
          subtitle="Sales count by hour of day (5 AM – 11 PM)"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={peakHoursData}
              margin={{ left: 0, right: 10, top: 5, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                formatter={(v) => [v, "Sales"]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="sales_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* All-time totals footer */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
        <span>
          <span className="font-semibold text-gray-800">All-time Revenue:</span>{" "}
          {peso(data.totals.total_revenue)}
        </span>
        <span>
          <span className="font-semibold text-gray-800">
            Total Transactions:
          </span>{" "}
          {data.totals.total_sales}
        </span>
        <span>
          <span className="font-semibold text-gray-800">
            Overall Avg per Sale:
          </span>{" "}
          {peso(avgPerSale)}
        </span>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    getDashboard()
      .then((res) => {
        // Ensure all expected fields exist with defaults
        setOverview({
          today_sales: res?.today_sales ?? 0,
          yesterday_sales: res?.yesterday_sales ?? 0,
          today_revenue: res?.today_revenue ?? 0,
          yesterday_revenue: res?.yesterday_revenue ?? 0,
          total_products: res?.total_products ?? 0,
          low_stock_count: res?.low_stock_count ?? 0,
          today_sales_list: res?.today_sales_list ?? [],
          low_stock_products: res?.low_stock_products ?? [],
        });
      })
      .catch((err) => {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here's your store overview.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-white rounded-xl border border-orange-100 shadow-sm p-1 w-fit mb-6 gap-1">
        <button
          onClick={() => setTab("overview")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "overview"
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "analytics"
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {tab === "overview" ? <Overview data={overview} /> : <Analytics />}
    </div>
  );
}

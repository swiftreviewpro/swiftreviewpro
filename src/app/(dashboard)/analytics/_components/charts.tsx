"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// ============================================================================
// Reviews Over Time — Bar Chart
// ============================================================================

interface ReviewsChartProps {
  data: { month: string; count: number }[];
}

export function ReviewsOverTimeChart({ data }: ReviewsChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  if (data.length === 0) {
    return <EmptyChart message="No review data yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Rating Trend — Line Chart
// ============================================================================

interface RatingTrendProps {
  data: { month: string; avg: number }[];
}

export function RatingTrendChart({ data }: RatingTrendProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  if (data.length === 0) {
    return <EmptyChart message="No rating data yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          domain={[1, 5]}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="avg"
          name="Avg Rating"
          strokeWidth={2}
          dot={{ r: 4 }}
          className="stroke-primary"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Status Breakdown — Donut chart
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  draft_generated: "#f59e0b",
  approved: "#10b981",
  posted: "#6b7280",
  needs_attention: "#ef4444",
  archived: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  draft_generated: "Draft Ready",
  approved: "Approved",
  posted: "Posted",
  needs_attention: "Attention",
  archived: "Archived",
};

interface StatusBreakdownProps {
  data: Record<string, number>;
}

export function StatusBreakdownChart({ data }: StatusBreakdownProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? "#6b7280",
    }));

  if (chartData.length === 0) {
    return <EmptyChart message="No reviews to display" />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-muted-foreground">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
      {message}
    </div>
  );
}

"use client";

import { FC } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ChartSpec {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#8b5cf6", // violet
];

const AXIS_STYLE = {
  fontSize: 12,
  fill: "var(--muted-foreground)",
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="mb-1 font-medium text-popover-foreground">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium text-popover-foreground">
            {typeof entry.value === "number"
              ? `$${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : entry.value}
          </span>
          <span>{entry.name}</span>
        </div>
      ))}
    </div>
  );
};

export const ChartRenderer: FC<{ code: string }> = ({ code }) => {
  let spec: ChartSpec;
  try {
    spec = JSON.parse(code);
  } catch {
    return <pre className="rounded-md bg-muted p-3 text-xs">{code}</pre>;
  }

  const colors = spec.colors ?? DEFAULT_COLORS;

  return (
    <div className="my-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      {spec.title && (
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">{spec.title}</h3>
      )}
      <ResponsiveContainer width="100%" height={280}>
        {spec.type === "bar" ? (
          <BarChart data={spec.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey={spec.xKey}
              tick={AXIS_STYLE}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {spec.yKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[i % colors.length]}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        ) : spec.type === "line" ? (
          <LineChart data={spec.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey={spec.xKey}
              tick={AXIS_STYLE}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {spec.yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: colors[i % colors.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={spec.data}
              dataKey={spec.yKeys[0]}
              nameKey={spec.xKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

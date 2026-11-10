import { formatPeso } from "@/lib/money";

export interface MonthlyTrendItem {
  label: string;
  amount: number;
  isCurrent: boolean;
}

export function CollectionsTrendChart({
  data,
}: {
  data: MonthlyTrendItem[];
}) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 3000);
  const totalPeriod = data.reduce((sum, d) => sum + d.amount, 0);
  const avgMonthly = Math.round(totalPeriod / (data.length || 1));

  // Chart layout dimensions for SVG
  const width = 640;
  const height = 220;
  const paddingBottom = 34;
  const paddingTop = 32;
  const paddingLeft = 16;
  const paddingRight = 16;
  const chartHeight = height - paddingTop - paddingBottom;
  const usableWidth = width - paddingLeft - paddingRight;
  const barWidth = Math.min(48, Math.floor(usableWidth / (data.length * 2)));
  const step = usableWidth / data.length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            6-Month Collection Trend
          </p>
          <p className="tabular font-serif text-2xl font-bold text-ink">
            {formatPeso(totalPeriod)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-muted">Monthly Avg: </span>
            <span className="font-semibold text-ink">{formatPeso(avgMonthly)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-forest" />
            <span className="text-muted">Current</span>
            <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-leaf/40" />
            <span className="text-muted">Past</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          style={{ maxHeight: "240px" }}
        >
          {/* Grid lines at 25%, 50%, 75%, 100% */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = paddingTop + chartHeight * (1 - pct);
            return (
              <g key={pct} className="text-line">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="currentColor"
            className="text-line"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = Math.max(
              4,
              Math.round((item.amount / maxAmount) * chartHeight),
            );
            const x =
              paddingLeft + index * step + (step - barWidth) / 2;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={item.label} className="group cursor-pointer">
                {/* Hover backdrop highlight */}
                <rect
                  x={x - 6}
                  y={paddingTop}
                  width={barWidth + 12}
                  height={chartHeight + paddingBottom}
                  fill="transparent"
                  className="transition-colors group-hover:fill-cream/60"
                  rx="6"
                />

                {/* Amount Label Above Bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-ink text-[11px] font-semibold tabular transition-opacity duration-200"
                >
                  {item.amount > 0 ? `₱${(item.amount / 1000).toFixed(1)}k` : "₱0"}
                </text>

                {/* The Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="5"
                  className={`transition-all duration-300 ${
                    item.isCurrent
                      ? "fill-forest group-hover:fill-forest/90"
                      : "fill-leaf/50 group-hover:fill-leaf/70"
                  }`}
                />

                {/* Month Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[12px] ${
                    item.isCurrent
                      ? "fill-forest font-bold"
                      : "fill-muted font-medium"
                  }`}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function CollectionRateMeter({
  collected,
  billed,
  unpaidCount,
  paidCount,
}: {
  collected: number;
  billed: number;
  unpaidCount: number;
  paidCount: number;
}) {
  const percentage =
    billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0;
  const remaining = Math.max(billed - collected, 0);

  // SVG circular gauge properties
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between gap-4">
        {/* Circular Progress Meter */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-line/60"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="text-forest transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-serif text-2xl font-bold text-ink">
              {percentage}%
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted">
              Collected
            </span>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="flex-1 space-y-2">
          <div>
            <span className="text-xs text-muted">Total Billed: </span>
            <span className="font-semibold text-ink">{formatPeso(billed)}</span>
          </div>
          <div>
            <span className="text-xs text-muted">Collected: </span>
            <span className="font-semibold text-forest">{formatPeso(collected)}</span>
          </div>
          <div>
            <span className="text-xs text-muted">Outstanding: </span>
            <span className="font-semibold text-amber">{formatPeso(remaining)}</span>
          </div>
        </div>
      </div>

      {/* Proportional Segment Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5 text-forest font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-forest" />
            {paidCount} Settled
          </span>
          <span className="flex items-center gap-1.5 text-amber font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-amber" />
            {unpaidCount} Unpaid
          </span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-line/60">
          <div
            className="bg-forest transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="bg-amber transition-all duration-500"
            style={{ width: `${100 - percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ProportionBar({
  title,
  segments,
}: {
  title: string;
  segments: {
    label: string;
    value: number;
    color: string;
    textColor?: string;
  }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{title}</span>
        <span className="tabular text-muted">{total} total</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-line/50">
        {segments.map((seg, i) => {
          const widthPct = total > 0 ? (seg.value / total) * 100 : 0;
          return (
            <div
              key={i}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${widthPct}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${seg.color}`} />
            <span className={seg.textColor || "text-ink"}>
              {seg.label}: <strong>{seg.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

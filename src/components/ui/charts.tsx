import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

type Point = { label: string; value: number };

function buildPath(values: number[], width: number, height: number, pad = 2) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(2)},${height - pad} L${pts[0][0].toFixed(2)},${height - pad} Z`;
  return { line, area, pts };
}

/* ------------------------------------------------------------------ */
/*  AreaChart                                                          */
/* ------------------------------------------------------------------ */

export function AreaChart({
  data,
  height = 200,
  className,
  color = "#2563eb",
  showGrid = true,
}: {
  data: Point[];
  height?: number;
  className?: string;
  color?: string;
  showGrid?: boolean;
  valueFormatter?: (v: number) => string;
}) {
  const width = 600;
  const { line, area, pts } = buildPath(
    data.map((d) => d.value),
    width,
    height
  );
  const gradId = React.useId();

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        role="img"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <>
            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1="0"
                x2={width}
                y1={height * g}
                y2={height * g}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
            ))}
          </>
        )}
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BarChart                                                           */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 200,
  className,
  color = "#2563eb",
  horizontal = false,
}: {
  data: Point[];
  height?: number;
  className?: string;
  color?: string;
  horizontal?: boolean;
  valueFormatter?: (v: number) => string;
}) {
  const width = 600;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const labelW = horizontal ? 90 : 0;

  if (horizontal) {
    const innerW = width - labelW - pad * 2 - 4;
    const slotH = (height - pad * 2) / Math.max(data.length, 1);
    const barH = Math.min(slotH * 0.6, 28);
    return (
      <div className={cn("w-full", className)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-auto w-full"
          role="img"
        >
          {data.map((d, i) => {
            const w = (innerW * d.value) / max;
            const y = pad + i * slotH + (slotH - barH) / 2;
            const x = labelW + pad;
            return (
              <g key={d.label}>
                <text
                  x={labelW - 6}
                  y={y + barH / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="currentColor"
                  opacity={0.7}
                >
                  {d.label}
                </text>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(w, 0)}
                  height={barH}
                  rx={4}
                  fill={color}
                  opacity={0.85}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const slot = width / data.length;
  const barW = Math.min(slot * 0.55, 48);

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        role="img"
      >
        {data.map((d, i) => {
          const h = ((height - pad * 2) * d.value) / max;
          const x = i * slot + (slot - barW) / 2;
          const y = height - pad - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 0)}
                rx={4}
                fill={color}
                opacity={0.85}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} style={{ width: `${100 / data.length}%`, textAlign: "center" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LineChart                                                          */
/* ------------------------------------------------------------------ */

export function LineChart({
  data,
  height = 200,
  className,
  color = "#10b981",
}: {
  data: Point[];
  height?: number;
  className?: string;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const width = 600;
  const { line, area, pts } = buildPath(
    data.map((d) => d.value),
    width,
    height
  );
  const gradId = React.useId();

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        role="img"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} style={{ width: `${100 / data.length}%`, textAlign: "center" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DonutChart                                                         */
/* ------------------------------------------------------------------ */

export type DonutSlice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  className,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;

  const segments = data.reduce<{ element: React.ReactNode; offset: number }[]>(
    (acc, d) => {
      const len = (d.value / total) * circ;
      const currentOffset = acc.length > 0 ? acc[acc.length - 1].offset : 0;
      const seg = (
        <circle
          key={d.label}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={d.color}
          strokeWidth={thickness}
          strokeDasharray={`${len} ${circ - len}`}
          strokeDashoffset={-currentOffset}
          strokeLinecap="butt"
        />
      );
      acc.push({ element: seg, offset: currentOffset + len });
      return acc;
    },
    []
  );

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={thickness}
          />
          {segments.map((s) => s.element)}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && (
              <span className="text-2xl font-bold">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline (tiny)                                                   */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  color = "#2563eb",
  width = 80,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const { line } = buildPath(data, width, height, 2);
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function SparkBar({
  value,
  max = 100,
  criticalBelow = 35,
  label,
  width = 72,
  height = 6,
}: {
  value: number;
  max?: number;
  criticalBelow?: number;
  label: string;
  width?: number;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    pct < criticalBelow ? "var(--color-down)" : pct < 50 ? "var(--color-stale)" : "var(--color-fresh)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${label}: ${pct.toFixed(0)} percent of capacity`}
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height / 2}
        fill="var(--color-panel-edge)"
      />
      <rect
        x="0"
        y="0"
        width={(pct / 100) * width}
        height={height}
        rx={height / 2}
        fill={fill}
      />
      {criticalBelow > 0 && (
        <line
          x1={(criticalBelow / 100) * width}
          x2={(criticalBelow / 100) * width}
          y1={0}
          y2={height}
          stroke="var(--color-text-dim)"
          strokeWidth="0.75"
          strokeDasharray="1 1"
          opacity="0.6"
        />
      )}
    </svg>
  );
}

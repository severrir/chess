/**
 * A player's rating over their games, drawn as a single line.
 *
 * Deliberately unlabelled and small: the exact numbers are in the table
 * beside it, and what this answers is only "is it going up". The baseline
 * is the starting rating, so climbing above the line means progress.
 */
export default function RatingSpark({ history, start = 1000, height = 56 }) {
  const points = history.map((h) => h.rating);
  if (points.length < 2) {
    return (
      <p className="text-meta text-ivory-3">
        გრაფიკისთვის ჯერ საკმარისი თამაში არ არის.
      </p>
    );
  }

  const min = Math.min(...points, start) - 20;
  const max = Math.max(...points, start) + 20;
  const span = max - min || 1;
  const W = 300;
  const x = (i) => (i / (points.length - 1)) * W;
  const y = (r) => height - ((r - min) / span) * height;

  const line = points.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const up = last >= start;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="h-14 w-full"
      role="img"
      aria-label={`რეიტინგის დინამიკა: ${start}-დან ${last}-მდე`}
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        x2={W}
        y1={y(start)}
        y2={y(start)}
        stroke="var(--color-board-600)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <path d={area} fill={up ? "var(--color-gold)" : "var(--color-loss)"} opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke={up ? "var(--color-gold)" : "var(--color-loss)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={W}
        cy={y(last)}
        r="3"
        fill={up ? "var(--color-gold)" : "var(--color-loss)"}
      />
    </svg>
  );
}

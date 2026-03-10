import { DESIGN_SYSTEM } from '../constants/designSystem';

/**
 * MiniChart — lightweight SVG sparkline/bar chart.
 * @param {Object} props
 * @param {number[]} props.data — array of numeric values
 * @param {'line'|'bar'} props.type — chart type (default: 'line')
 * @param {string} props.color — stroke/fill color
 * @param {number} props.width — SVG width (default: 120)
 * @param {number} props.height — SVG height (default: 40)
 * @param {string} props.label — optional label below chart
 */
export function MiniChart({ data = [], type = 'line', color = DESIGN_SYSTEM.colors.brand.primary, width = 120, height = 40, label }) {
  if (!data.length) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 10 }}>No data</span>
      </div>
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  if (type === 'bar') {
    const barGap = 2;
    const barW = Math.max(2, (chartW - barGap * (data.length - 1)) / data.length);

    return (
      <div>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {data.map((val, i) => {
            const barH = Math.max(2, ((val - min) / range) * chartH);
            const x = padding + i * (barW + barGap);
            const y = padding + chartH - barH;
            return (
              <rect
                key={i}
                x={x} y={y} width={barW} height={barH}
                rx={1} fill={color}
                opacity={0.3 + (val / max) * 0.7}
              />
            );
          })}
        </svg>
        {label && <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 10, marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>{label}</div>}
      </div>
    );
  }

  // Line chart (sparkline)
  const points = data.map((val, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding + chartH - ((val - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  // Fill area under the line
  const firstX = padding;
  const lastX = padding + chartW;
  const areaPath = `M${firstX},${padding + chartH} ${points.map((p, i) => `L${p}`).join(' ')} L${lastX},${padding + chartH} Z`;

  return (
    <div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
        <polyline
          points={polyline}
          fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* End dot */}
        {data.length > 1 && (
          <circle
            cx={padding + chartW}
            cy={padding + chartH - ((data[data.length - 1] - min) / range) * chartH}
            r="3" fill={color}
          />
        )}
      </svg>
      {label && <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 10, marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>{label}</div>}
    </div>
  );
}

/**
 * HorizontalBarChart — small horizontal bar chart for distributions.
 * @param {{ label: string, value: number, color?: string }[]} props.items
 * @param {number} props.maxWidth — default 200
 */
export function HorizontalBarChart({ items = [], maxWidth = 200 }) {
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 11, width: 80, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
            {item.label}
          </span>
          <div style={{ flex: 1, maxWidth, height: 14, background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.value / maxVal) * 100}%`,
              height: '100%',
              background: item.color || DESIGN_SYSTEM.colors.brand.primary,
              borderRadius: 3,
              transition: 'width 0.4s ease',
              minWidth: item.value > 0 ? 4 : 0,
            }} />
          </div>
          <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, width: 30, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

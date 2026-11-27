import type { ChartBlock, ChartItem } from '../schema/types.js';

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export interface RenderChartOptions {
  isDark?: boolean;
  accentColor?: string;
  width?: number;
  height?: number;
}

/**
 * Deterministic offline vector SVG chart renderer.
 * Produces self-contained SVG for Bar, Line, Radar, and Pie/Donut charts with zero CDN/runtime dependencies.
 */
export function renderChartSvg(chart: ChartBlock, options: RenderChartOptions = {}): string {
  const width = options.width || 720;
  const height = options.height || 380;
  const isDark = Boolean(options.isDark);
  const accent = options.accentColor || '#3B82F6';

  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const titleSvg = chart.title
    ? `<text x="40" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${textColor}">${escapeXml(chart.title)}</text>`
    : '';

  const topOffset = chart.title ? 50 : 30;

  if (chart.type === 'radar') {
    return renderRadarChart(chart.data, { width, height, topOffset, textColor, mutedColor, gridColor, accent });
  }

  if (chart.type === 'pie') {
    return renderDonutChart(chart.data, { width, height, topOffset, textColor, mutedColor, titleSvg });
  }

  if (chart.type === 'line') {
    return renderLineChart(chart.data, { width, height, topOffset, textColor, mutedColor, gridColor, accent, titleSvg });
  }

  // Default: Bar chart
  return renderBarChart(chart.data, { width, height, topOffset, textColor, mutedColor, gridColor, accent, titleSvg });
}

function renderBarChart(
  data: ChartItem[],
  ctx: {
    width: number;
    height: number;
    topOffset: number;
    textColor: string;
    mutedColor: string;
    gridColor: string;
    accent: string;
    titleSvg: string;
  }
): string {
  const { width, height, topOffset, textColor, mutedColor, gridColor, accent, titleSvg } = ctx;
  const chartBottom = height - 50;
  const chartLeft = 60;
  const chartRight = width - 40;
  const plotWidth = chartRight - chartLeft;
  const plotHeight = chartBottom - topOffset;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(maxVal * 1.15);

  const barCount = data.length || 1;
  const gap = plotWidth * 0.15 / (barCount + 1);
  const barWidth = Math.min(64, (plotWidth - gap * (barCount + 1)) / barCount);

  // Y-axis grid lines (3 tiers)
  const gridLines: string[] = [];
  for (let i = 0; i <= 3; i++) {
    const yVal = (niceMax / 3) * i;
    const yPos = chartBottom - (plotHeight / 3) * i;
    gridLines.push(`
      <line x1="${chartLeft}" y1="${yPos.toFixed(1)}" x2="${chartRight}" y2="${yPos.toFixed(1)}" stroke="${gridColor}" stroke-dasharray="4,4" stroke-width="1" />
      <text x="${chartLeft - 10}" y="${(yPos + 4).toFixed(1)}" font-family="ui-monospace, monospace" font-size="12" fill="${mutedColor}" text-anchor="end">${Math.round(yVal)}</text>
    `);
  }

  const bars = data.map((d, idx) => {
    const h = (d.value / niceMax) * plotHeight;
    const x = chartLeft + gap + idx * (barWidth + gap);
    const y = chartBottom - h;
    const barColor = d.color || PALETTE[idx % PALETTE.length] || accent;

    return `
      <g class="chart-bar">
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${h.toFixed(1)}" rx="6" fill="${barColor}" fill-opacity="0.9" />
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" font-family="ui-monospace, monospace" font-size="13" font-weight="600" fill="${textColor}" text-anchor="middle">${d.value}</text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(chartBottom + 24).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${mutedColor}" text-anchor="middle">${escapeXml(d.label)}</text>
      </g>
    `;
  });

  return `
<svg class="aimake-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
  ${titleSvg}
  ${gridLines.join('')}
  <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="${mutedColor}" stroke-opacity="0.4" stroke-width="1.5" />
  ${bars.join('')}
</svg>`.trim();
}

function renderLineChart(
  data: ChartItem[],
  ctx: {
    width: number;
    height: number;
    topOffset: number;
    textColor: string;
    mutedColor: string;
    gridColor: string;
    accent: string;
    titleSvg: string;
  }
): string {
  const { width, height, topOffset, textColor, mutedColor, gridColor, accent, titleSvg } = ctx;
  const chartBottom = height - 50;
  const chartLeft = 60;
  const chartRight = width - 40;
  const plotWidth = chartRight - chartLeft;
  const plotHeight = chartBottom - topOffset;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(maxVal * 1.15);

  const stepX = plotWidth / Math.max(data.length - 1, 1);
  const points = data.map((d, idx) => {
    const x = chartLeft + idx * stepX;
    const y = chartBottom - (d.value / niceMax) * plotHeight;
    return { x, y, ...d };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPolyStr = `${chartLeft},${chartBottom} ${polylineStr} ${chartRight},${chartBottom}`;

  // Grid
  const gridLines: string[] = [];
  for (let i = 0; i <= 3; i++) {
    const yVal = (niceMax / 3) * i;
    const yPos = chartBottom - (plotHeight / 3) * i;
    gridLines.push(`
      <line x1="${chartLeft}" y1="${yPos.toFixed(1)}" x2="${chartRight}" y2="${yPos.toFixed(1)}" stroke="${gridColor}" stroke-dasharray="4,4" stroke-width="1" />
      <text x="${chartLeft - 10}" y="${(yPos + 4).toFixed(1)}" font-family="ui-monospace, monospace" font-size="12" fill="${mutedColor}" text-anchor="end">${Math.round(yVal)}</text>
    `);
  }

  const dots = points.map((p) => `
    <g class="chart-dot">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${accent}" stroke="${textColor}" stroke-width="2" />
      <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" font-family="ui-monospace, monospace" font-size="13" font-weight="700" fill="${textColor}" text-anchor="middle">${p.value}</text>
      <text x="${p.x.toFixed(1)}" y="${(chartBottom + 24).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${mutedColor}" text-anchor="middle">${escapeXml(p.label)}</text>
    </g>
  `);

  return `
<svg class="aimake-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.0" />
    </linearGradient>
  </defs>
  ${titleSvg}
  ${gridLines.join('')}
  <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="${mutedColor}" stroke-opacity="0.4" stroke-width="1.5" />
  <polygon points="${areaPolyStr}" fill="url(#lineGrad)" />
  <polyline points="${polylineStr}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  ${dots.join('')}
</svg>`.trim();
}

function renderRadarChart(
  data: ChartItem[],
  ctx: {
    width: number;
    height: number;
    topOffset: number;
    textColor: string;
    mutedColor: string;
    gridColor: string;
    accent: string;
  }
): string {
  const { width, height, topOffset, textColor, gridColor, accent } = ctx;
  const centerX = width / 2;
  const centerY = topOffset + (height - topOffset) / 2;
  const radius = Math.min(width, height - topOffset) * 0.38;

  const count = data.length || 3;
  const angleStep = (2 * Math.PI) / count;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  // Web rings (33%, 66%, 100%)
  const rings = [0.33, 0.66, 1.0].map((scale) => {
    const pts = data.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * scale);
      const y = centerY + Math.sin(angle) * (radius * scale);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${gridColor}" stroke-width="1.2" />`;
  });

  // Radial axes and labels
  const axes: string[] = [];
  const dataPoints: Array<{ x: number; y: number }> = [];

  data.forEach((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const endX = centerX + Math.cos(angle) * radius;
    const endY = centerY + Math.sin(angle) * radius;

    axes.push(`<line x1="${centerX}" y1="${centerY}" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" stroke="${gridColor}" stroke-width="1" />`);

    const labelDist = radius + 22;
    const lx = centerX + Math.cos(angle) * labelDist;
    const ly = centerY + Math.sin(angle) * labelDist;
    const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';

    axes.push(`
      <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${textColor}" text-anchor="${anchor}">
        ${escapeXml(d.label)} (${d.value})
      </text>
    `);

    const rVal = (d.value / maxVal) * radius;
    dataPoints.push({
      x: centerX + Math.cos(angle) * rVal,
      y: centerY + Math.sin(angle) * rVal,
    });
  });

  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return `
<svg class="aimake-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
  ${rings.join('')}
  ${axes.join('')}
  <polygon points="${dataPoly}" fill="${accent}" fill-opacity="0.3" stroke="${accent}" stroke-width="2.5" />
  ${dataPoints.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${accent}" stroke="${textColor}" stroke-width="1.5" />`).join('')}
</svg>`.trim();
}

function renderDonutChart(
  data: ChartItem[],
  ctx: {
    width: number;
    height: number;
    topOffset: number;
    textColor: string;
    mutedColor: string;
    titleSvg: string;
  }
): string {
  const { width, height, topOffset, textColor, mutedColor, titleSvg } = ctx;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const centerX = width * 0.38;
  const centerY = topOffset + (height - topOffset) / 2;
  const radius = Math.min(width * 0.35, (height - topOffset) * 0.4);
  const innerRadius = radius * 0.58;

  let startAngle = -Math.PI / 2;
  const slices: string[] = [];
  const legend: string[] = [];

  data.forEach((d, idx) => {
    const fraction = d.value / total;
    const sliceAngle = fraction * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const color = d.color || PALETTE[idx % PALETTE.length];

    const x1 = centerX + Math.cos(startAngle) * radius;
    const y1 = centerY + Math.sin(startAngle) * radius;
    const x2 = centerX + Math.cos(endAngle) * radius;
    const y2 = centerY + Math.sin(endAngle) * radius;

    const ix1 = centerX + Math.cos(endAngle) * innerRadius;
    const iy1 = centerY + Math.sin(endAngle) * innerRadius;
    const ix2 = centerX + Math.cos(startAngle) * innerRadius;
    const iy2 = centerY + Math.sin(startAngle) * innerRadius;

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = `
      M ${x1.toFixed(1)} ${y1.toFixed(1)}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}
      L ${ix1.toFixed(1)} ${iy1.toFixed(1)}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)}
      Z
    `.trim();

    slices.push(`<path d="${pathData}" fill="${color}" fill-opacity="0.9" stroke="transparent" />`);

    const percent = Math.round(fraction * 100);
    const legendY = topOffset + 30 + idx * 28;
    legend.push(`
      <g class="chart-legend-item">
        <rect x="${(width * 0.68).toFixed(1)}" y="${legendY}" width="14" height="14" rx="3" fill="${color}" />
        <text x="${(width * 0.68 + 22).toFixed(1)}" y="${legendY + 12}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="${textColor}">
          ${escapeXml(d.label)} <tspan fill="${mutedColor}">(${percent}%)</tspan>
        </text>
      </g>
    `);

    startAngle = endAngle;
  });

  return `
<svg class="aimake-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
  ${titleSvg}
  ${slices.join('')}
  ${legend.join('')}
</svg>`.trim();
}

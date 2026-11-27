interface MermaidNode {
  id: string;
  label: string;
  shape: 'rect' | 'round' | 'diamond';
  layer: number;
  order: number;
}

interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  dashed: boolean;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseNodeToken(raw: string): { id: string; label?: string; shape: 'rect' | 'round' | 'diamond' } {
  const token = raw.trim();
  const matchRect = token.match(/^([A-Za-z0-9_.-]+)\s*\[([^\]]+)\]$/);
  if (matchRect) {
    return { id: matchRect[1], label: matchRect[2].replace(/^["']|["']$/g, '').trim(), shape: 'rect' };
  }
  const matchRound = token.match(/^([A-Za-z0-9_.-]+)\s*\(\[?([^)\]]+)\]?\)$/);
  if (matchRound) {
    return { id: matchRound[1], label: matchRound[2].replace(/^["']|["']$/g, '').trim(), shape: 'round' };
  }
  const matchDiamond = token.match(/^([A-Za-z0-9_.-]+)\s*\{([^}]+)\}$/);
  if (matchDiamond) {
    return { id: matchDiamond[1], label: matchDiamond[2].replace(/^["']|["']$/g, '').trim(), shape: 'diamond' };
  }
  const bare = token.match(/^([A-Za-z0-9_.-]+)/);
  return { id: bare ? bare[1] : token, shape: 'rect' };
}

export interface MermaidRenderOptions {
  aspect?: string;
  forceDirection?: 'LR' | 'TD';
}

function parseMermaidFlowchart(code: string, options?: MermaidRenderOptions): {
  direction: 'LR' | 'TD';
  nodes: MermaidNode[];
  edges: MermaidEdge[];
} | null {
  const lines = code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  if (lines.length === 0) return null;
  const header = lines[0];
  const headerMatch = header.match(/^(?:flowchart|graph)\s+(LR|RL|TD|TB|BT)\b/i);
  if (!headerMatch) return null;

  const dirRaw = headerMatch[1].toUpperCase();
  let direction: 'LR' | 'TD' = dirRaw === 'LR' || dirRaw === 'RL' ? 'LR' : 'TD';

  // Responsive multi-aspect auto-reflow: portrait aspect ratios reflow horizontal diagrams to vertical stack
  const isNarrow = options?.aspect === '3:4' || options?.aspect === '9:16' || options?.aspect === '4:5';
  if (options?.forceDirection) {
    direction = options.forceDirection;
  } else if (isNarrow && direction === 'LR') {
    direction = 'TD';
  }

  const nodeMap = new Map<string, MermaidNode>();
  const edges: MermaidEdge[] = [];

  const ensureNode = (rawToken: string): MermaidNode => {
    const parsed = parseNodeToken(rawToken);
    const existing = nodeMap.get(parsed.id);
    if (existing) {
      if (parsed.label && existing.label === existing.id) {
        existing.label = parsed.label;
        existing.shape = parsed.shape;
      }
      return existing;
    }
    const created: MermaidNode = {
      id: parsed.id,
      label: parsed.label || parsed.id,
      shape: parsed.shape,
      layer: 0,
      order: nodeMap.size,
    };
    nodeMap.set(parsed.id, created);
    return created;
  };

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].replace(/;+$/, '').trim();
    if (!line || /^(?:subgraph|end|style|classDef|class|linkStyle|click)\b/i.test(line)) {
      continue;
    }

    // Split chained edges while preserving edge operators and optional |label|
    const edgeRe = /(-->|-.->|==>|---)(?:\s*\|([^|]+)\|)?/g;
    const matches = Array.from(line.matchAll(edgeRe));
    if (matches.length === 0) {
      ensureNode(line);
      continue;
    }

    let cursor = 0;
    const segments: string[] = [];
    const ops: Array<{ op: string; label?: string }> = [];
    for (const m of matches) {
      segments.push(line.slice(cursor, m.index).trim());
      ops.push({ op: m[1], label: m[2]?.trim() });
      cursor = (m.index ?? 0) + m[0].length;
    }
    segments.push(line.slice(cursor).trim());

    for (let s = 0; s < ops.length; s += 1) {
      const leftRaw = segments[s];
      const rightRaw = segments[s + 1];
      if (!leftRaw || !rightRaw) continue;
      const fromNode = ensureNode(leftRaw);
      const toNode = ensureNode(rightRaw);
      edges.push({
        from: fromNode.id,
        to: toNode.id,
        label: ops[s].label,
        dashed: ops[s].op === '-.->',
      });
    }
  }

  const nodes = Array.from(nodeMap.values());
  if (nodes.length === 0) return null;

  // Cycle-safe topological layer relaxation
  const maxPasses = nodes.length;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      const src = nodeMap.get(edge.from);
      const dst = nodeMap.get(edge.to);
      if (src && dst && dst.layer <= src.layer && dst.layer < maxPasses) {
        dst.layer = src.layer + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return { direction, nodes, edges };
}

/**
 * Renders Mermaid flowchart definitions into crisp standalone vector SVG cards with zero external network calls.
 */
export function renderMermaidSvg(code: string, options?: MermaidRenderOptions): string {
  const flow = parseMermaidFlowchart(code, options);
  if (!flow) {
    const firstLine = (code.trim().split('\n')[0] || 'mermaid').trim();
    return [
      `<div class="aimake-mermaid-fallback" data-diagram-engine="mermaid">`,
      `<div class="aimake-mermaid-head"><span>MERMAID DIAGRAM</span><span>${escapeXml(firstLine)}</span></div>`,
      `<pre class="aimake-mermaid-code"><code>${escapeXml(code.trim())}</code></pre>`,
      `</div>`,
    ].join('');
  }

  const layers = new Map<number, MermaidNode[]>();
  let maxLayer = 0;
  for (const n of flow.nodes) {
    maxLayer = Math.max(maxLayer, n.layer);
    const list = layers.get(n.layer) || [];
    list.push(n);
    layers.set(n.layer, list);
  }

  const maxPerLayer = Math.max(
    1,
    ...Array.from(layers.values()).map((arr) => arr.length)
  );

  const nodeW = 196;
  const nodeH = 58;
  const gapX = flow.direction === 'LR' ? 68 : 44;
  const gapY = flow.direction === 'LR' ? 32 : 58;
  const pad = 28;

  const cols = flow.direction === 'LR' ? maxLayer + 1 : maxPerLayer;
  const rows = flow.direction === 'LR' ? maxPerLayer : maxLayer + 1;

  const width = Math.max(420, pad * 2 + cols * nodeW + (cols - 1) * gapX);
  const height = Math.max(180, pad * 2 + rows * nodeH + (rows - 1) * gapY);

  const coords = new Map<string, { x: number; y: number }>();
  for (let layerIdx = 0; layerIdx <= maxLayer; layerIdx += 1) {
    const items = layers.get(layerIdx) || [];
    if (flow.direction === 'LR') {
      const colH = items.length * nodeH + Math.max(0, items.length - 1) * gapY;
      const startY = (height - colH) / 2;
      items.forEach((node, idx) => {
        coords.set(node.id, {
          x: pad + layerIdx * (nodeW + gapX),
          y: startY + idx * (nodeH + gapY),
        });
      });
    } else {
      const rowW = items.length * nodeW + Math.max(0, items.length - 1) * gapX;
      const startX = (width - rowW) / 2;
      items.forEach((node, idx) => {
        coords.set(node.id, {
          x: startX + idx * (nodeW + gapX),
          y: pad + layerIdx * (nodeH + gapY),
        });
      });
    }
  }

  const edgeSvg = flow.edges
    .map((edge) => {
      const p1 = coords.get(edge.from);
      const p2 = coords.get(edge.to);
      if (!p1 || !p2) return '';

      let x1: number;
      let y1: number;
      let x2: number;
      let y2: number;
      if (flow.direction === 'LR') {
        x1 = p1.x + nodeW;
        y1 = p1.y + nodeH / 2;
        x2 = p2.x;
        y2 = p2.y + nodeH / 2;
      } else {
        x1 = p1.x + nodeW / 2;
        y1 = p1.y + nodeH;
        x2 = p2.x + nodeW / 2;
        y2 = p2.y;
      }

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const pathD =
        flow.direction === 'LR'
          ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
          : `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      const dashAttr = edge.dashed ? ' stroke-dasharray="6 5"' : '';
      const labelSvg = edge.label
        ? `<rect x="${midX - 38}" y="${midY - 11}" width="76" height="22" rx="6" fill="var(--surface, #ffffff)" stroke="var(--border, #cbd5e1)" stroke-width="1" />` +
          `<text x="${midX}" y="${midY + 4}" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--muted, #475569)">${escapeXml(edge.label.slice(0, 14))}</text>`
        : '';

      return `<path d="${pathD}" fill="none" stroke="var(--accent, #18181b)" stroke-width="2.2"${dashAttr} marker-end="url(#aimake-arrow)" />${labelSvg}`;
    })
    .join('');

  const nodeSvg = flow.nodes
    .map((node) => {
      const pos = coords.get(node.id);
      if (!pos) return '';
      const cx = pos.x + nodeW / 2;
      const cy = pos.y + nodeH / 2;
      const rx = node.shape === 'round' ? nodeH / 2 : 12;
      const shapeEl =
        node.shape === 'diamond'
          ? `<polygon points="${cx},${pos.y - 4} ${pos.x + nodeW + 4},${cy} ${cx},${pos.y + nodeH + 4} ${pos.x - 4},${cy}" fill="var(--surface, #ffffff)" stroke="var(--accent, #18181b)" stroke-width="2" />`
          : `<rect x="${pos.x}" y="${pos.y}" width="${nodeW}" height="${nodeH}" rx="${rx}" fill="var(--surface, #ffffff)" stroke="var(--border, #18181b)" stroke-width="2" />`;

      const displayLabel =
        node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label;
      return `${shapeEl}<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="14" font-weight="650" fill="var(--ink, #141413)">${escapeXml(displayLabel)}</text>`;
    })
    .join('');

  return `<svg class="aimake-mermaid-svg" data-diagram-engine="mermaid" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mermaid flowchart"><defs><marker id="aimake-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent, #18181b)" /></marker></defs>${edgeSvg}${nodeSvg}</svg>`;
}

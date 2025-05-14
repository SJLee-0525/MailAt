import {
  memo,
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  useEffect,
} from "react";

import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";

import { buildGraph } from "@utils/getBuildGraph";

import type { RawNode, RawEmail } from "@/types/graphType";

interface Props {
  rawNodes: RawNode[];
  rawEmails: RawEmail[];
  onSelect?: (idx: number) => void;
  onMerge?: (srcId: string, tgtId: string) => void;
}

const EmailGraph = memo(({ rawNodes, rawEmails, onSelect, onMerge }: Props) => {
  /* --------- 0. 그래프 데이터 --------- */
  const graph = useMemo(
    () => buildGraph(rawNodes, rawEmails), // {nodes:{id,val,name,color}, links:…}
    [rawNodes, rawEmails]
  );

  /* --------- 1. 반응형 width/height --------- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --------- 2. 포스그래프 ref --------- */
  const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);

  /* --------- 3. 노드 반지름 계산 --------- */
  const getRadius = useCallback(
    (n: any) => (n.id === 0 ? 12 : Math.max(Math.min(n.val * 0.5 + 6, 24), 8)),
    []
  );

  /* --------- 4. 링크 애니메이션 state --------- */
  const [animMap, setAnim] = useState<Record<string, number>>({});
  // 애니메이션 루프
  useEffect(() => {
    let f: number;
    const step = () =>
      setAnim((prev) => {
        const next: Record<string, number> = {};
        let running = false;
        for (const [k, p] of Object.entries(prev)) {
          const np = Math.min(p + 0.03, 1);
          if (np < 1) running = true;
          next[k] = np;
        }
        if (running) f = requestAnimationFrame(step);
        return next;
      });
    if (Object.keys(animMap).length) f = requestAnimationFrame(step);
    return () => cancelAnimationFrame(f);
  }, [animMap]);

  /* --------- 5. 이벤트 핸들러 --------- */
  const handleNodeClick = useCallback(
    (node: any) => {
      if (node.id === 0) return;
      // ① InfoPanel 선택
      if (onSelect) onSelect(node.idx ?? node.id);
      // ② 애니메이션 초기화
      const map: Record<string, number> = {};
      graph.links.forEach((l: any) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        if (s === node.id || t === node.id) map[`${s}->${t}`] = 0;
      });
      setAnim(map);
    },
    [graph.links, onSelect]
  );

  const handleDragEnd = useCallback(
    (n: any) => {
      if (!onMerge || n.id === 0) return;
      const r = getRadius(n);
      const thresh = r * 2;

      const fg = fgRef.current;
      if (!fg) {
        return;
      }

      fg.d3ReheatSimulation();
      // Cast fg to any to bypass the type error on graphData.
      // The result of a method call on 'any' is 'any'.
      const { nodes } = (fg as any).graphData();
      const cur = nodes.find((x: any) => x.id === n.id);
      const near = nodes
        .filter((x: any) => x.id !== n.id)
        .find((x: any) => {
          const dx = (x.x || 0) - (cur.x || 0);
          const dy = (x.y || 0) - (cur.y || 0);
          return Math.hypot(dx, dy) < thresh;
        });
      if (near) onMerge(n.id, near.id);
    },
    [getRadius, onMerge]
  );

  /* --------- 6. 커스텀 link 그리기 --------- */
  const linkCanvasObject = useCallback(
    (l: any, ctx: CanvasRenderingContext2D, gs: number) => {
      const s: any = l.source;
      const t: any = l.target;
      if (s.x == null || t.x == null) return;
      const key = `${s.id}->${t.id}`;
      const p = animMap[key] ?? 1;
      const xx = s.x + (t.x - s.x) * p;
      const yy = s.y + (t.y - s.y) * p;
      ctx.strokeStyle = "#9CA3AF";
      ctx.lineWidth = 2 / gs;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(xx, yy);
      ctx.stroke();
    },
    [animMap]
  );

  /* --------- 7. 렌더 --------- */
  return (
    <div
      ref={wrapRef}
      className="w-full h-full overflow-hidden flex justify-center items-center"
    >
      {w > 0 && h > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={w}
          height={h}
          graphData={graph}
          enableNodeDrag
          nodeId="id"
          nodeRelSize={6}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={handleDragEnd}
          linkCanvasObject={linkCanvasObject}
          nodeCanvasObject={(n: any, ctx, gs) => {
            const r = getRadius(n);
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
            ctx.fillStyle = n.color;
            ctx.fill();
            ctx.font = `${12 / gs}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText(n.name, n.x!, n.y!);
          }}
          /* 드래그·클릭 판정용 히트 영역 직접 그리기 ─ ① */
          nodePointerAreaPaint={(n, color, ctx) => {
            ctx.fillStyle = color;
            const r = getRadius(n);
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
            ctx.fill();
          }}
          cooldownTicks={100}
        />
      )}
    </div>
  );
});

export default EmailGraph;

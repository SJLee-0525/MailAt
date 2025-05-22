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

import { buildTutorialGraph } from "@utils/getBuildGraph";

import EmailGraphRightClick from "@pages/emailGraph/components/EmailGraphRightClick";

import {
  RawNode,
  RawEmail,
  GraphNode,
  // GraphLink,
} from "@/types/graphType";

interface Props {
  rawNodes: RawNode[];
  rawEmails: RawEmail[];
  onSelect?: (idx: number) => void;
  onMerge?: (srcId: number, tgtId: number) => void;
}

interface CtxMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

const TutorialGraph = memo(
  ({ rawNodes, rawEmails, onSelect, onMerge }: Props) => {
    // console.log(1232, onSelect, onMerge);
    const [ctxMenu, setCtxMenu] = useState<CtxMenuState>({
      visible: false,
      x: 0,
      y: 0,
      node: null,
    });

    // 그래프 데이터 가공
    const graph = useMemo(
      () => buildTutorialGraph(rawNodes), // {nodes:{id,val,name,color}, links:…}
      [rawNodes, rawEmails]
    );

    // 반응형 width/height
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

    // 클릭 시 더블클릭 판별을 위한 ref
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const DBL_GAP = 200; // ms

    // 포스 그래프 ref
    const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);

    // 초기 배율 및 확대/축소 비활성화를 위한 설정
    const INITIAL_ZOOM_LEVEL = 6.5;
    useEffect(() => {
      if (fgRef.current && graph.nodes.length > 0 && w > 0 && h > 0) {
        // 그래프 인스턴스가 있고, 노드가 있으며, 크기가 설정된 경우에만 실행
        fgRef.current.zoom(INITIAL_ZOOM_LEVEL, 0); // (배율, 전환 시간 ms)
      }
    }, [graph, w, h]); // graph 데이터, 너비, 높이가 변경될 때마다 실행될 수 있도록 의존성 배열에 추가

    // 노드 반지름 계산
    const getRadius = useCallback(
      (n: any) =>
        n.id === 0 ? 12 : Math.max(Math.min(n.val * 0.5 + 6, 24), 8),
      []
    );

    // 링크 애니메이션 루프 state
    const [animMap, setAnim] = useState<Record<string, number>>({});
    useEffect(() => {
      if (!Object.keys(animMap).length) return; // 애니메이션 없으면 패스

      let frameId: number;

      function step() {
        setAnim((prev) => {
          const next: Record<string, number> = {};
          let running = false;

          for (const [k, p] of Object.entries(prev)) {
            const np = Math.min(p + 0.03, 1); // 0 → 1 로 보간
            if (np < 1) running = true; // 아직 덜 찼으면 계속
            next[k] = np;
          }

          if (running) frameId = requestAnimationFrame(step); // 다음 프레임 예약
          return running ? next : prev; // 다 찼으면 state 유지
        });
      }

      frameId = requestAnimationFrame(step); // 첫 프레임

      return () => cancelAnimationFrame(frameId); // 클린업
    }, [animMap]);

    // 노드 클릭 시 동작
    const handleNodeClick = useCallback(
      (node: GraphNode) => {
        // 이미 예약된 타이머: 더블클릭
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;

          console.log("더블클릭!", node);

          // 더블클릭 시 동작
          return;
        }

        // 첫 번째 클릭: 단일클릭으로 가정하고 타이머 예약
        clickTimerRef.current = setTimeout(() => {
          // 단일클릭 로직
          clickTimerRef.current = null; // 타이머 해제
          if (node.id === 0) return;

          // InfoPanel 선택
          onSelect?.(node.id);

          // 애니메이션 초기화
          const map: Record<string, number> = {};
          graph.links.forEach((l: any) => {
            const s = typeof l.source === "string" ? l.source : l.source.id;
            const t = typeof l.target === "string" ? l.target : l.target.id;
            if (s === node.id || t === node.id) map[`${s}->${t}`] = 0;
          });
          setAnim(map);

          console.log("단일클릭!", node);
        }, DBL_GAP);
      },
      [graph.links, onSelect]
    );

    // 우클릭 시 동작
    const handleRightClick = useCallback((node: any, e: MouseEvent) => {
      e.preventDefault(); // 기본 브라우저 메뉴 막기

      console.log("우클릭!", e);
      // Math.min(x, window.innerWidth - menuWidth)
      setCtxMenu({
        visible: true,
        x: Math.min(e.offsetX, window.innerWidth - 200),
        y: Math.min(e.offsetY, window.innerHeight - 80),
        node,
      });
    }, []);

    // 드래그 종료 시 동작
    const handleDragEnd = useCallback(
      (d: GraphNode) => {
        if (d.id === 0) return; // ‘Me’ 노드는 병합 금지

        // 인스턴스가 가진 graphData()가 있으면 그걸, 없으면 props로 만든 graph.nodes를 반환
        function getCurrentNodes() {
          const inst = fgRef.current as any;
          if (inst && typeof inst.graphData === "function") {
            // react-force-graph 인스턴스가 제대로 들어온 경우
            return (inst.graphData().nodes ?? []) as GraphNode[];
          }
          // fallback : ForceGraph가 원본 배열에 x, y를 직접 달기 때문에 그대로 써도 좌표가 최신입니다.
          return graph.nodes as GraphNode[];
        }

        const rDragged = getRadius(d);
        const tgt = getCurrentNodes().find((n) => {
          // 나 자신과 ‘Me’는 제외
          if (n.id === d.id || n.id === 0) return false;

          // 두 원의 중심 좌표를 이용해 거리 계산
          const dist = Math.hypot(
            (n.x ?? 0) - (d.x ?? 0),
            (n.y ?? 0) - (d.y ?? 0)
          );
          return dist < rDragged + getRadius(n); // 두 원이 겹치면 병합
        });

        if (tgt) {
          onMerge?.(d.id, tgt.id); // 병합 시 onMerge 호출
          console.log("병합", d, tgt);
        } else {
          console.log("드래그 종료:", d);
        }

        fgRef.current?.d3ReheatSimulation?.(); // 레이아웃 재가열
      },
      [getRadius, onMerge, graph.nodes] // graph.nodes 의존성 추가!
    );

    // 커스텀 link 그리기
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

    // 렌더
    return (
      <div className="flex w-full h-full justify-center items-center overflow-hidden">
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
              // 확대/축소 및 이동 상호작용 비활성화
              enableZoomInteraction={false}
              enablePanInteraction={false}
              enableNodeDrag
              nodeId="id"
              // nodeRelSize={6} // 노드 크기 조정
              onNodeClick={handleNodeClick}
              onNodeDragEnd={handleDragEnd}
              onNodeRightClick={handleRightClick}
              linkCanvasObject={linkCanvasObject}
              // 노드 그리기
              nodeCanvasObject={(n: any, ctx, gs) => {
                const baseSize = getRadius(n); // 노드 반지름

                ctx.beginPath();

                if (n.C_type === 2 || n.C_type === 3) {
                  // 사각형 그리기
                  const rectHeight = baseSize * 1.3;
                  const rectWidth = baseSize * 2;
                  const cornerRadius = Math.min(rectHeight, rectWidth) * 0.15;

                  // 사각형의 중심 좌표
                  const nodeX = n.x ?? 0;
                  const nodeY = n.y ?? 0;

                  ctx.roundRect(
                    nodeX - rectWidth / 2,
                    nodeY - rectHeight / 2,
                    rectWidth,
                    rectHeight,
                    cornerRadius
                  );
                } else {
                  // 원 그리기
                  ctx.arc(n.x ?? 0, n.y ?? 0, baseSize, 0, 2 * Math.PI, false);
                }

                ctx.fillStyle = n.color || "#9CA3AF"; // 노드 색상 (기본값)
                ctx.fill();

                // 텍스트 그리기
                ctx.font = `${12 / gs}px Pretendard`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#fff"; // Text color
                ctx.fillText(n.name || "", n.x ?? 0, n.y ?? 0);
              }}
              // 드래그·클릭 판정용 히트 영역 직접 그리기
              nodePointerAreaPaint={(n, color, ctx) => {
                const baseSize = getRadius(n);
                ctx.fillStyle = color;

                ctx.beginPath();

                if (n.C_type === 2 || n.C_type === 3) {
                  // 사각형 히트 영역
                  const rectHeight = baseSize * 1.5;
                  const rectWidth = baseSize * 2.2;
                  const cornerRadius = Math.min(rectHeight, rectWidth) * 0.15;

                  const nodeX = n.x ?? 0;
                  const nodeY = n.y ?? 0;

                  ctx.roundRect(
                    nodeX - rectWidth / 2,
                    nodeY - rectHeight / 2,
                    rectWidth,
                    rectHeight,
                    cornerRadius
                  );
                } else {
                  // 원 히트 영역
                  ctx.arc(n.x ?? 0, n.y ?? 0, baseSize, 0, 2 * Math.PI, false);
                }
                ctx.fill();
              }}
              cooldownTicks={300}
            />
          )}
          {ctxMenu.visible && (
            <EmailGraphRightClick ctxMenu={ctxMenu} setCtxMenu={setCtxMenu} />
          )}
        </div>
      </div>
    );
  }
);

export default TutorialGraph;

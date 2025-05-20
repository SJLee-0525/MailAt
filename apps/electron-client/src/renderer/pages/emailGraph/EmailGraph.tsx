// =====================================
// EmailGraph 컴포넌트 - 전체 그래프 렌더링 및 상호작용 정의
// 이메일 노드 데이터를 시각화하고 사용자 이벤트(클릭, 드래그, 우클릭 등)를 처리함
// =====================================

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

// 노드 데이터 가공 유틸
import { buildGraph } from "@utils/getBuildGraph";

// 우클릭 메뉴 컴포넌트
import EmailGraphRightClick from "@pages/emailGraph/components/EmailGraphRightClick";

import { RawNode, RawEmail, GraphNode } from "@/types/graphType";

// Props 인터페이스
interface Props {
  rawNodes: RawNode[];
  onSelect?: (idx: number) => void;
  onMerge: (srcId: number, tgtId: number) => void;
  onNavigateBack?: () => void;
}

// 컨텍스트 메뉴 상태 타입
interface CtxMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

// 줌 및 애니메이션 관련 상수 정의
const INITIAL_ZOOM_LEVEL = 6.5;
const NODE_DETAIL_ZOOM_LEVEL = 120;
const NEW_GRAPH_APPEAR_ZOOM_LEVEL = INITIAL_ZOOM_LEVEL / 2.5; // 새 그래프가 나타날 때 초기 줌 레벨
const ZOOM_DURATION = 2000;
const FADE_DURATION = 2000;

const EmailGraph = memo(
  ({ rawNodes, onSelect, onMerge, onNavigateBack }: Props) => {
    // 우클릭 메뉴 상태 관리
    const [ctxMenu, setCtxMenu] = useState<CtxMenuState>({
      visible: false,
      x: 0,
      y: 0,
      node: null,
    });

    // rawNodes를 기반으로 그래프 객체 생성
    const graph = useMemo(() => buildGraph(rawNodes), [rawNodes]);

    // 그래프 wrapper 크기 측정
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

    // 단일/더블 클릭 판별용 타이머
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const DBL_GAP = 200;

    // ForceGraph 인스턴스 참조용 ref
    const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);

    // 트랜지션 여부, 투명도 애니메이션 제어용 상태 및 ref
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [graphOpacity, setGraphOpacity] = useState(1);
    const opacityAnimationRef = useRef<number | null>(null);
    const currentOpacityRef = useRef(1);

    // 그래프 투명도 애니메이션
    const animateGraphOpacity = useCallback(
      (targetOpacity: number, duration: number, onComplete?: () => void) => {
        if (opacityAnimationRef.current) {
          cancelAnimationFrame(opacityAnimationRef.current);
        }
        const startOpacity = currentOpacityRef.current;
        const startTime = performance.now();

        function animationStep(currentTime: number) {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const currentOpacityValue =
            startOpacity + (targetOpacity - startOpacity) * progress;

          currentOpacityRef.current = currentOpacityValue;
          setGraphOpacity(currentOpacityValue);

          if (progress < 1) {
            opacityAnimationRef.current = requestAnimationFrame(animationStep);
          } else {
            opacityAnimationRef.current = null;
            onComplete?.();
          }
        }
        opacityAnimationRef.current = requestAnimationFrame(animationStep);
      },
      []
    );

    // 그래프 데이터가 바뀌면 줌 리셋 및 투명도 복원
    useEffect(() => {
      if (fgRef.current && graph.nodes.length > 0 && w > 0 && h > 0) {
        // const meNode = graph.nodes.find((n) => n.id === 0);

        if (isTransitioning) {
          // 트랜지션 중 새 데이터 도착 시 (클릭/뒤로가기 후)

          fgRef.current.centerAt(0, 0, 0); // 즉시 중앙 정렬

          // 그래프는 현재 투명도 0 상태여야 함
          fgRef.current.zoom(NEW_GRAPH_APPEAR_ZOOM_LEVEL, 0); // 즉시 "작은" 크기로 줌 설정

          // "작은" 크기에서 INITIAL_ZOOM_LEVEL로 줌 애니메이션
          fgRef.current.zoom(INITIAL_ZOOM_LEVEL, FADE_DURATION);

          // 동시에 페이드 인 애니메이션
          animateGraphOpacity(1, FADE_DURATION, () => {
            setIsTransitioning(false); // 페이드 인 완료 시 플래그 해제
          });
        } else {
          // 초기 로드 또는 트랜지션과 무관한 데이터 변경 시

          fgRef.current.centerAt(0, 0, 0); // 즉시 중앙 정렬

          fgRef.current.zoom(INITIAL_ZOOM_LEVEL, 0); // 즉시 최종 줌 레벨로 설정

          currentOpacityRef.current = 1; // 투명도 전체 설정
          setGraphOpacity(1); // 즉시 표시
          setIsTransitioning(false); // 플래그 초기화
        }
      }
    }, [graph, w, h, animateGraphOpacity]); // isTransitioning은 의도적으로 의존성 배열에서 제외

    // 노드 반지름 계산
    const getRadius = useCallback(
      (n: any) =>
        n.id === 0 ? 12 : Math.max(Math.min(n.val * 0.5 + 6, 24), 8),
      []
    );

    // 링크 애니메이션 상태 관리
    const [animMap, setAnim] = useState<Record<string, number>>({});
    useEffect(() => {
      if (!Object.keys(animMap).length) return;
      let frameId: number;
      function step() {
        setAnim((prev) => {
          const next: Record<string, number> = {};
          let running = false;
          for (const [k, p] of Object.entries(prev)) {
            const np = Math.min(p + 0.03, 1);
            if (np < 1) running = true;
            next[k] = np;
          }
          if (running) frameId = requestAnimationFrame(step);
          return running ? next : prev;
        });
      }
      frameId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frameId);
    }, [animMap]);

    // 노드 클릭 핸들러 (단일 vs 더블)
    const handleNodeClick = useCallback(
      (node: GraphNode) => {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
          console.log("더블클릭!", node);
          return;
        }

        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
          if (isTransitioning) return;
          setIsTransitioning(true);

          // 확대 줌 애니메이션
          if (node.id !== 0) {
            if (
              fgRef.current &&
              typeof node.x === "number" &&
              typeof node.y === "number"
            ) {
              fgRef.current.centerAt(node.x, node.y, 0);
              fgRef.current.zoom(NODE_DETAIL_ZOOM_LEVEL, ZOOM_DURATION);
            }
          }

          // 페이드 아웃 후 API 호출
          animateGraphOpacity(0, FADE_DURATION);
          setTimeout(() => {
            onSelect?.(node.id);
            fgRef.current && fgRef.current.centerAt(0, 0, ZOOM_DURATION + 200);
          }, ZOOM_DURATION);

          console.log("단일클릭! (Zooming in or selecting Me)", node);
        }, DBL_GAP);
      },
      [onSelect, animateGraphOpacity, isTransitioning, setIsTransitioning]
    );

    // 뒤로가기 메뉴 클릭 시 초기 뷰 복원
    const handleGoBackFromMenu = useCallback(() => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCtxMenu({ visible: false, x: 0, y: 0, node: null });

      // 전체 보기로 줌
      if (fgRef.current) {
        fgRef.current.zoom(INITIAL_ZOOM_LEVEL, ZOOM_DURATION);
        const meNode = graph.nodes.find((n) => n.id === 0);
        if (
          meNode &&
          typeof meNode.x === "number" &&
          typeof meNode.y === "number"
        ) {
          fgRef.current.centerAt(meNode.x, meNode.y, ZOOM_DURATION);
        }
      }

      animateGraphOpacity(0, FADE_DURATION);
      setTimeout(() => {
        onNavigateBack?.();
      }, ZOOM_DURATION);
    }, [
      onNavigateBack,
      animateGraphOpacity,
      graph.nodes,
      isTransitioning,
      setIsTransitioning,
    ]);

    // 우클릭 핸들러: 좌표와 노드 정보 저장
    const handleRightClick = useCallback(
      (node: GraphNode | null, e: MouseEvent) => {
        e.preventDefault();
        setCtxMenu({
          visible: true,
          x: Math.min(e.offsetX, window.innerWidth - 200),
          y: Math.min(e.offsetY, window.innerHeight - 120),
          node,
        });
      },
      []
    );

    // 노드 드래그 후 병합 판별
    const handleDragEnd = useCallback(
      (d: GraphNode) => {
        if (d.id === 0) return;
        function getCurrentNodes() {
          const inst = fgRef.current as any;
          if (inst && typeof inst.graphData === "function") {
            return (inst.graphData().nodes ?? []) as GraphNode[];
          }
          return graph.nodes as GraphNode[];
        }
        const rDragged = getRadius(d);
        const tgt = getCurrentNodes().find((n) => {
          if (n.id === d.id || n.id === 0) return false;
          const dist = Math.hypot(
            (n.x ?? 0) - (d.x ?? 0),
            (n.y ?? 0) - (d.y ?? 0)
          );
          return dist < rDragged + getRadius(n);
        });
        if (tgt) {
          onMerge(d.id, tgt.id);
        }
        fgRef.current?.d3ReheatSimulation?.();
      },
      [getRadius, onMerge, graph.nodes]
    );

    // 링크 캔버스 렌더링
    const linkCanvasObject = useCallback(
      (l: any, ctx: CanvasRenderingContext2D, gs: number) => {
        ctx.save();
        ctx.globalAlpha = graphOpacity;

        const s: any = l.source;
        const t: any = l.target;
        if (s.x == null || t.x == null) {
          ctx.restore();
          return;
        }
        const key = `${s.id}->${t.id}`;
        const p = animMap[key] ?? 1;
        const xx = s.x + (t.x - s.x) * p;
        const yy = s.y + (t.y - s.y) * p;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / gs;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(xx, yy);
        ctx.stroke();

        ctx.restore();
      },
      [animMap, graphOpacity]
    );

    // 노드 캔버스 렌더링
    const nodeCanvasObject = useCallback(
      (n: any, ctx: CanvasRenderingContext2D, gs: number) => {
        ctx.save();
        ctx.globalAlpha = graphOpacity;

        const baseSize = getRadius(n);
        ctx.beginPath();
        if (n.C_type === 2 || n.C_type === 3) {
          const rectHeight = baseSize * 1.3;
          const rectWidth = baseSize * 2;
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
          ctx.arc(n.x ?? 0, n.y ?? 0, baseSize, 0, 2 * Math.PI, false);
        }
        ctx.fillStyle = n.color || "#9CA3AF";
        ctx.fill();

        ctx.font = `${12 / gs}px Pretendard`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(n.name || "", n.x ?? 0, n.y ?? 0);

        ctx.restore();
      },
      [getRadius, graphOpacity]
    );

    // 최종 렌더링 JSX
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
            enableZoomInteraction={false}
            enablePanInteraction={false}
            enableNodeDrag
            nodeId="id"
            onNodeClick={handleNodeClick}
            onNodeDragEnd={handleDragEnd}
            onNodeRightClick={handleRightClick}
            linkCanvasObject={linkCanvasObject}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(n, color, ctx) => {
              const baseSize = getRadius(n);
              ctx.fillStyle = color;
              ctx.beginPath();
              if (n.C_type === 2 || n.C_type === 3) {
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
                ctx.arc(n.x ?? 0, n.y ?? 0, baseSize, 0, 2 * Math.PI, false);
              }
              ctx.fill();
            }}
            cooldownTicks={300}
          />
        )}
        {ctxMenu.visible && (
          <EmailGraphRightClick
            ctxMenu={ctxMenu}
            setCtxMenu={setCtxMenu}
            onGoBack={handleGoBackFromMenu}
          />
        )}
      </div>
    );
  }
);

export default EmailGraph;

import {
  memo,
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  useEffect,
} from "react";
import ReactDOMServer from "react-dom/server";
import React from "react"; // Import React for JSX

import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";

import { buildGraph } from "@utils/getBuildGraph";

import useAuthenticateStore from "@stores/authenticateStore";

import { useDeleteGraphNode } from "@hooks/useGraphHook";

import PersonIcon from "@assets/icons/PersonIcon";
import CategoryIcon from "@assets/icons/CategoryIcon";
import FolderIcon from "@assets/icons/FolderIcon";

import EmailGraphRightClick from "@pages/emailGraph/components/EmailGraphRightClick";

import { RawNode, SelectedGraph, GraphNode } from "@/types/graphType";

// function onSelect({ C_ID, C_type, IO_type, In }: SelectedGraph) {
//   setGraphInboxIsOpen(true);
//   setSelectedGraph({ C_ID, C_type, IO_type, In });
// }

// Props 인터페이스
interface Props {
  rawNodes: RawNode[];
  onSelect: ({ C_ID, C_type, IO_type, In }: SelectedGraph) => void;
  onDoubleClick: (node: GraphNode) => void; // Changed from (idx: number) to (node: GraphNode)
  onInitialScreen: () => void;
  onMerge: (srcName: string, tgtName: string) => void;
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
const NODE_DETAIL_ZOOM_LEVEL = 10;
const NEW_GRAPH_APPEAR_ZOOM_LEVEL = INITIAL_ZOOM_LEVEL / 2.5; // 새 그래프가 나타날 때 초기 줌 레벨
const ZOOM_DURATION = 500;
const FADE_DURATION = 800;

// "me" 노드 관련 링크 거리 상수
const ME_NODE_ID = 0;
const DEFAULT_LINK_DISTANCE = 10; // "me" 노드와 관련 없는 링크의 기본 거리
const ME_LINK_BASE_DISTANCE = 100; // "me" 노드 링크 거리 계산을 위한 기본 값 (val이 클수록 거리가 짧아짐)
const ME_LINK_MIN_DISTANCE = 15; // "me" 노드와의 최소 거리
const ME_LINK_MAX_DISTANCE_CAP = 45; // "me" 노드와의 최대 거리 (val이 매우 작을 경우 대비)

const EmailGraph = memo(
  ({
    rawNodes,
    onSelect,
    onDoubleClick,
    onInitialScreen,
    onMerge,
    onNavigateBack,
  }: Props) => {
    const { currentTheme } = useAuthenticateStore();

    const { mutateAsync: deleteGraphNode } = useDeleteGraphNode();

    const iconImageCache = useRef<{ [key: string]: HTMLImageElement }>({});

    useEffect(() => {
      const iconColor = "#ffffff"; // 아이콘 색상
      const nominalIconSize = 24; // SVG 내부 렌더링을 위한 기본 크기

      function prepareIcon(iconKey: string, component: React.ReactElement) {
        const svgString = ReactDOMServer.renderToStaticMarkup(component);
        const img = new Image();
        img.onload = () => {
          iconImageCache.current[iconKey] = img;
        };
        img.onerror = () => {
          console.error(`Failed to load image for icon: ${iconKey}`);
        };
        img.src = `data:image/svg+xml;base64,${btoa(
          unescape(encodeURIComponent(svgString))
        )}`;
      }

      prepareIcon(
        `person_${currentTheme}`,
        <PersonIcon
          width={nominalIconSize}
          height={nominalIconSize}
          strokeColor={iconColor}
        />
      );
      prepareIcon(
        `category_${currentTheme}`,
        <CategoryIcon
          width={nominalIconSize}
          height={nominalIconSize}
          strokeColor={iconColor}
        />
      );
      prepareIcon(
        `folder_${currentTheme}`,
        <FolderIcon
          width={nominalIconSize}
          height={nominalIconSize}
          strokeColor={iconColor}
        />
      );
    }, [currentTheme]);

    // 우클릭 메뉴 상태 관리
    const [ctxMenu, setCtxMenu] = useState<CtxMenuState>({
      visible: false,
      x: 0,
      y: 0,
      node: null,
    });

    // rawNodes를 기반으로 그래프 객체 생성
    const graph = useMemo(() => {
      if (currentTheme === "theme-night") {
        return buildGraph(rawNodes, [
          "#556c99",
          "#7689b0",
          "#ffab90",
          "#ffe79a",
        ]);
      } else {
        return buildGraph(rawNodes, [
          "#022d48",
          "#0a5685",
          "#e76f51",
          "#ffb45c",
        ]);
      }
    }, [rawNodes, currentTheme]);

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

    // "me" 노드와의 거리를 val에 따라 조절하는 함수
    const getLinkDistance = useCallback(
      (link: {
        source: GraphNode | string | number;
        target: GraphNode | string | number;
      }) => {
        const sourceId =
          typeof link.source === "object" &&
          link.source !== null &&
          "id" in link.source
            ? link.source.id
            : (link.source as string | number);
        const targetId =
          typeof link.target === "object" &&
          link.target !== null &&
          "id" in link.target
            ? link.target.id
            : (link.target as string | number);

        let valToConsider: number | undefined;
        let isMeLink = false;

        if (sourceId === ME_NODE_ID) {
          const targetNode = graph.nodes.find((n) => n.id === targetId);
          valToConsider = targetNode?.val;
          isMeLink = true;
        } else if (targetId === ME_NODE_ID) {
          const sourceNode = graph.nodes.find((n) => n.id === sourceId);
          valToConsider = sourceNode?.val;
          isMeLink = true;
        }

        if (isMeLink) {
          const val =
            valToConsider !== undefined && valToConsider > 0
              ? valToConsider
              : 0.1; // val이 0 또는 undefined일 경우 작은 값으로 대체
          const calculatedDistance = ME_LINK_BASE_DISTANCE / val;
          return Math.min(
            ME_LINK_MAX_DISTANCE_CAP,
            Math.max(ME_LINK_MIN_DISTANCE, calculatedDistance)
          );
        }

        // "me" 노드와 관련 없는 링크는 기본 거리 사용
        return DEFAULT_LINK_DISTANCE;
      },
      [graph.nodes] // graph.nodes가 변경될 때 이 함수가 올바른 val 값을 참조하도록 합니다.
    );

    // 그래프 데이터가 바뀌면 줌 리셋, 투명도 복원 및 링크 거리 적용
    useEffect(() => {
      if (fgRef.current && graph.nodes.length > 0 && w > 0 && h > 0) {
        // 링크 거리 먼저 설정
        const linkForce = fgRef.current.d3Force("link");
        if (linkForce) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (linkForce as any).distance(getLinkDistance);
        }

        if (isTransitioning) {
          // 트랜지션 중 새 데이터 도착 시 (클릭/뒤로가기 후)
          // 이 블록은 새 그래프가 나타나는 것을 처리합니다.

          fgRef.current.centerAt(0, 0, 0); // 새 그래프를 위해 즉시 중앙 정렬
          // 이전 animateGraphOpacity(0, ...) 호출로 인해 그래프는 현재 투명도 0 상태여야 합니다.
          fgRef.current.zoom(NEW_GRAPH_APPEAR_ZOOM_LEVEL, 0); // 즉시 "작은" 크기로 줌 설정

          // "작은" 크기에서 INITIAL_ZOOM_LEVEL로 줌 애니메이션
          fgRef.current.zoom(INITIAL_ZOOM_LEVEL, FADE_DURATION);

          // 동시에 페이드 인 애니메이션
          animateGraphOpacity(1, FADE_DURATION, () => {
            setIsTransitioning(false); // 트랜지션 완료
          });
        } else {
          // 초기 로드 또는 트랜지션과 무관한 데이터 변경 시
          fgRef.current.centerAt(0, 0, 0); // 즉시 중앙 정렬
          fgRef.current.zoom(INITIAL_ZOOM_LEVEL, 0); // 즉시 최종 줌 레벨로 설정
          currentOpacityRef.current = 1; // 투명도 전체 설정
          setGraphOpacity(1); // 즉시 표시
          // setIsTransitioning(false); // 이미 false이거나, 완료된 트랜지션이었다면 false로 설정될 것입니다.
        }

        // 모든 변경 후 시뮬레이션 재가열
        fgRef.current.d3ReheatSimulation?.();
      }
    }, [graph, w, h, getLinkDistance, animateGraphOpacity]); // isTransitioning 및 setIsTransitioning을 의존성 배열에서 제거

    // 노드 반지름 계산
    const getRadius = useCallback(
      (n: any) => (n.id === 0 ? 12 : Math.min(n.val * 4, 10)),
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

          // 확대 줌 및 중앙 정렬 애니메이션
          if (fgRef.current) {
            if (typeof node.x === "number" && typeof node.y === "number") {
              fgRef.current.centerAt(node.x, node.y, ZOOM_DURATION);
            } else {
              // 노드에 x, y 좌표가 없는 경우 (예: 초기 "me" 노드) 그래프 중앙으로 정렬
              const { x: screenCenterX, y: screenCenterY } =
                fgRef.current.screen2GraphCoords(w / 2, h / 2);
              fgRef.current.centerAt(
                screenCenterX,
                screenCenterY,
                ZOOM_DURATION
              );
            }
            fgRef.current.zoom(NODE_DETAIL_ZOOM_LEVEL, ZOOM_DURATION);
          }

          // 페이드 아웃 후 API 호출
          animateGraphOpacity(0, FADE_DURATION, () => {
            onDoubleClick(node); // Changed from onSelect?.(node.id)
          });
          return;
        }

        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
          if (isTransitioning) return; // 이미 트랜지션 중이면 중복 실행 방지
          setIsTransitioning(true);

          onSelect({
            C_ID: node.C_ID,
            C_type: node.C_type,
            IO_type: 3,
            In: [],
          });
        }, DBL_GAP);
      },
      [
        onDoubleClick,
        animateGraphOpacity, // stable
        isTransitioning, // guard clause용
        setIsTransitioning, // stable setter
        graph.nodes, // "me" 노드 클릭 시 좌표 없는 경우 대비 (현재 로직상 직접 사용은 안하나, 안정성을 위해 포함 가능)
        w,
        h, // screen2GraphCoords용
        // fgRef (stable ref), DBL_GAP, ZOOM_DURATION, NODE_DETAIL_ZOOM_LEVEL, FADE_DURATION (constants)
      ]
    );

    // 뒤로가기 메뉴 클릭 시 초기 뷰 복원
    const handleGoBackFromMenu = useCallback(() => {
      if (isTransitioning) return; // 이미 트랜지션 중이면 중복 실행 방지
      setIsTransitioning(true);
      setCtxMenu({ visible: false, x: 0, y: 0, node: null });

      // // 전체 보기로 줌 및 중앙 정렬
      // if (fgRef.current) {
      //   fgRef.current.zoom(INITIAL_ZOOM_LEVEL, ZOOM_DURATION);
      //   const meNode = graph.nodes.find((n) => n.id === ME_NODE_ID);
      //   if (
      //     meNode &&
      //     typeof meNode.x === "number" &&
      //     typeof meNode.y === "number"
      //   ) {
      //     fgRef.current.centerAt(meNode.x, meNode.y, ZOOM_DURATION);
      //   } else {
      //     // "me" 노드가 없거나 좌표가 없는 경우 그래프 중앙으로 정렬
      //     const { x: screenCenterX, y: screenCenterY } =
      //       fgRef.current.screen2GraphCoords(w / 2, h / 2);
      //     fgRef.current.centerAt(screenCenterX, screenCenterY, ZOOM_DURATION);
      //   }
      // }

      // 페이드 아웃 후 API 호출
      animateGraphOpacity(0, FADE_DURATION, () => {
        onInitialScreen(); // 초기 화면으로 복원
        onNavigateBack?.();
      });
    }, [
      onNavigateBack,
      animateGraphOpacity, // stable
      graph.nodes, // meNode 찾기용
      isTransitioning, // guard clause용
      setIsTransitioning, // stable setter
      w,
      h, // screen2GraphCoords용
      // fgRef (stable ref), INITIAL_ZOOM_LEVEL, ZOOM_DURATION, FADE_DURATION, ME_NODE_ID (constants)
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

    async function handleDeleteNode({
      C_ID,
      C_type,
    }: {
      C_ID: number;
      C_type: number;
    }) {
      console.log("Deleting node with ID:", C_ID, "and type:", C_type);
      try {
        const response = await deleteGraphNode({ C_ID, C_type });
        if (response.status === "success") {
          console.log("Node deleted successfully");
        } else {
          console.error("Failed to delete node:", response);
        }
      } catch (error) {
        console.error("Error deleting node:", error);
      }
    }

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
          onMerge(d.name, tgt.name);
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

        if (s?.x == null || s?.y == null || t?.x == null || t?.y == null) {
          ctx.restore();
          return;
        }

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) {
          ctx.restore();
          return;
        }

        const targetNodeRadius = getRadius(t);

        const effectiveVisualLength = Math.max(0, dist - targetNodeRadius);

        if (effectiveVisualLength === 0) {
          ctx.restore();
          return;
        }

        const shortenScaleFactor = effectiveVisualLength / (dist + 0.5);

        // 애니메이션 진행률에 따라 링크 길이 조정
        const key = `${s.id}->${t.id}`;
        const animationProgress = animMap[key] ?? 1; // 0~1 사이의 값으로 애니메이션 진행률을 가져옴

        const finalEndX = s.x + dx * shortenScaleFactor * animationProgress;
        const finalEndY = s.y + dy * shortenScaleFactor * animationProgress;

        ctx.strokeStyle =
          currentTheme === "theme-night" ? "#606885" : "#f8f8f8";
        ctx.lineWidth = 2 / gs; // 스케일에 따라 선 두께 조정

        ctx.beginPath();
        ctx.moveTo(s.x, s.y); // 라인 시작점
        ctx.lineTo(finalEndX, finalEndY); // 라인 끝점
        ctx.stroke();

        ctx.restore();
      },
      [animMap, graphOpacity, getRadius] // graphOpacity는 애니메이션과 관련이 없지만, 캔버스의 투명도를 조정하기 위해 사용
    );

    // 노드 캔버스 렌더링
    const nodeCanvasObject = useCallback(
      (n: any, ctx: CanvasRenderingContext2D) => {
        ctx.save();
        ctx.globalAlpha = graphOpacity;

        const baseSize = getRadius(n);
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, baseSize, 0, 2 * Math.PI, false);

        if (n.id === 0) {
          ctx.fillStyle = "#021a60";
        } else {
          ctx.fillStyle = n.color;
        }
        ctx.fill(); // 원 먼저 그리기

        // 아이콘 렌더링
        let iconKey: string | null = null;
        if (n.id !== 0) {
          switch (n.C_type) {
            case 1:
              iconKey = `person_${currentTheme}`;
              break;
            case 2:
              iconKey = `category_${currentTheme}`;
              break;
            case 3:
              iconKey = `folder_${currentTheme}`;
              break;
            default:
              break;
          }
        }

        if (iconKey && iconImageCache.current[iconKey]) {
          const img = iconImageCache.current[iconKey];
          const nodeX = n.x ?? 0;
          const nodeY = n.y ?? 0;
          const iconSize = baseSize * 1.2; // 아이콘 크기를 baseSize의 1.2배로 조정
          const drawX = nodeX - iconSize / 2;
          const drawY = nodeY - iconSize / 2;

          const originalAlpha = ctx.globalAlpha; // 현재 투명도 저장
          ctx.globalAlpha = 1; // 아이콘을 항상 완전히 보이도록 설정
          ctx.drawImage(img, drawX, drawY, iconSize, iconSize);
          ctx.globalAlpha = originalAlpha; // 원래 투명도로 복원
        }

        // 텍스트 렌더링
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (n.id === 0) {
          ctx.font = `${6}px Pretendard-SemiBold`;
          ctx.fillStyle = "#ffffff";
          ctx.fillText(n.name || "", n.x ?? 0, n.y ?? 0);
        } else {
          ctx.font = `${2.4}px Pretendard-SemiBold`;
          ctx.fillStyle =
            currentTheme === "theme-night" ? "#ffffff" : "#000000";
          const textYPosition = (n.y ?? 0) + baseSize + 3; // 텍스트 위치 조정
          ctx.fillText(n.name || "", n.x ?? 0, textYPosition);
        }

        ctx.restore();
      },
      [getRadius, graphOpacity, currentTheme] // Added currentTheme
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
            onDelete={() =>
              handleDeleteNode({
                C_ID: ctxMenu.node?.id ?? 0,
                C_type: ctxMenu.node?.C_type ?? 0,
              })
            }
          />
        )}
      </div>
    );
  }
);

export default EmailGraph;

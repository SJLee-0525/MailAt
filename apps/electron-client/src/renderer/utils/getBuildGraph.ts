import { RawNode, GraphNode, GraphLink } from "@/types/graphType";

// C_type: 0=Root,1=Person,2=Category,3=Subcategory
// IO_type: 1=in,2=out,3=both

export function buildGraph(
  nodes: RawNode[],
  colors: string[]
): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nonMeNodes = nodes.filter((n) => n.id !== 0);
  let minCount = Infinity;
  let maxCount = -Infinity;

  if (nonMeNodes.length > 0) {
    nonMeNodes.forEach((n) => {
      const count =
        typeof n.count === "number" && !isNaN(n.count) ? n.count : 0;
      if (count < minCount) minCount = count;
      if (count > maxCount) maxCount = count;
    });
  }
  // 모든 non-Me 노드의 count가 같거나 non-Me 노드가 하나뿐인 경우를 대비
  if (minCount === Infinity || minCount === maxCount) {
    // minCount와 maxCount가 같으면 모든 non-Me 노드는 중간 크기를 가짐
    // nonMeNodes가 없으면 이 로직은 실행되지 않음 (아래 map에서 처리)
  }

  // 노드 가공
  const gNodes: GraphNode[] = nodes.map((n) => {
    let nodeVal;
    if (n.id === 0) {
      // 'Me' 노드
      nodeVal = 4; // 'Me' 노드는 기존 크기 유지
    } else {
      const count =
        typeof n.count === "number" && !isNaN(n.count) ? n.count : 0;
      if (nonMeNodes.length === 0) {
        // Me 노드만 있는 극단적인 경우
        nodeVal = 1.5; // 기본값
      } else if (minCount === maxCount) {
        // 모든 non-Me 노드의 count가 같거나 non-Me 노드가 하나뿐인 경우
        nodeVal = 2.5; // 1.5와 3.5의 중간값
      } else {
        // count 값을 1.5 ~ 3.5 범위로 스케일링
        const scaledVal =
          1.5 + ((count - minCount) * (3.5 - 1.5)) / (maxCount - minCount);
        nodeVal = Math.max(1.5, Math.min(scaledVal, 3.5)); // 최종적으로 범위 보장
      }
    }

    return {
      ...n,
      name: n.data.label,
      val: nodeVal,
      color: colors[n.C_type], // 타입별 색
    };
  });

  // 간단히 ‘Me(0)’ ↔︎ 나머지 로 엣지 연결
  const gLinks: GraphLink[] = gNodes
    .filter((n) => n.id !== 0)
    .map((n) => ({ source: 0, target: n.id }));

  return { nodes: gNodes, links: gLinks };
}

export function buildTutorialGraph(nodes: RawNode[]): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const gNodes: GraphNode[] = nodes.map((n) => ({
    ...n,
    name: String(n.id),
    val: n.id === 0 ? 4 : 2, // ‘Me’를 조금 크게
    color: ["#022d48", "#0a5685", "#e76f51", "#ffb45c"][n.C_type], // 타입별 색
  }));

  const gLinks: GraphLink[] = gNodes
    .filter((n) => n.id !== 0)
    .map((n) => ({ source: 0, target: n.id }));

  return { nodes: gNodes, links: gLinks };
}

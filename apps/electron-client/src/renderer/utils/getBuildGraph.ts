import { RawNode, GraphNode, GraphLink } from "@/types/graphType";

// C_type: 0=Root,1=Person,2=Category,3=Subcategory
// IO_type: 1=in,2=out,3=both

export function buildGraph(nodes: RawNode[]): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  // 노드 가공
  const gNodes: GraphNode[] = nodes.map((n) => {
    let nodeVal;
    if (n.id === 0) {
      // 'Me' 노드
      nodeVal = 4; // 'Me' 노드는 기존 크기 유지
    } else {
      // count가 숫자 타입이고 유효한 경우 해당 값을 사용, 아니면 0으로 처리하여 최소 크기(1.5)가 되도록 함
      const count =
        typeof n.count === "number" && !isNaN(n.count) ? n.count : 0;
      // 노드 크기는 최소 1.5, 최대 4 ('Me' 노드 크기)로 제한
      nodeVal = Math.max(1.5, Math.min(count, 4));
    }
    return {
      ...n,
      name: n.data.label,
      val: nodeVal,
      color: ["#022d48", "#0a5685", "#e76f51", "#ffb45c"][n.C_type], // 타입별 색
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

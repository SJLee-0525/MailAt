import { RawNode, GraphNode, GraphLink } from "@/types/graphType";

// C_type: 0=Root,1=Person,2=Category,3=Subcategory
// IO_type: 1=in,2=out,3=both

export function buildGraph(
  nodes: RawNode[]
  // emails: RawEmail[]
): { nodes: GraphNode[]; links: GraphLink[] } {
  // 노드 가공
  const gNodes: GraphNode[] = nodes.map((n) => ({
    ...n,
    name: n.data.label,
    val: n.id === 0 ? 4 : 2, // ‘Me’를 조금 크게
    color: ["#022d48", "#0a5685", "#e76f51", "#ffb45c"][n.C_type], // 타입별 색
  }));

  // 간단히 ‘Me(0)’ ↔︎ 나머지 로 엣지 연결
  const gLinks: GraphLink[] = gNodes
    .filter((n) => n.id !== 0)
    .map((n) => ({ source: 0, target: n.id }));

  // ⚡ 필요하다면 e-mail 도메인이나 시간순으로 링크를 더 만들 수도 있음

  return { nodes: gNodes, links: gLinks };
}

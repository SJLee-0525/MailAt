import { RawNode, RawEmail, GraphNode, GraphLink } from "@/types/graphType";

export function buildGraph(
  nodes: RawNode[],
  emails: RawEmail[]
): { nodes: GraphNode[]; links: GraphLink[] } {
  // 노드 가공
  const gNodes: GraphNode[] = nodes.map((n) => ({
    ...n,
    name: n.data.label,
    val: n.id === 0 ? 4 : 2, // ‘Me’를 조금 크게
    color: n.C_type === 0 ? "#4F46E5" : "#10B981", // 타입별 색
  }));

  // 간단히 ‘Me(0)’ ↔︎ 나머지 로 엣지 연결
  const gLinks: GraphLink[] = gNodes
    .filter((n) => n.id !== 0)
    .map((n) => ({ source: 0, target: n.id }));

  // ⚡ 필요하다면 e-mail 도메인이나 시간순으로 링크를 더 만들 수도 있음
  return { nodes: gNodes, links: gLinks };
}

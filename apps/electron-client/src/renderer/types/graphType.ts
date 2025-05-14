export interface RawNode {
  id: number;
  C_ID: number;
  C_type: number;
  data: { label: string };
}

export interface RawEmail {
  message_id: number;
  fromName: string;
  fromEmail: string;
  receivedAt: string;
  // …생략
}

export interface GraphData {
  nodes: RawNode[];
  emails: RawEmail[];
}

export interface GraphNode extends RawNode {
  name: string; // label을 복사
  val: number; // 노드 크기
  color: string; // 시각적 구분용
}

export interface GraphLink {
  source: number;
  target: number;
}

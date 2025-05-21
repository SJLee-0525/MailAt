export interface RawNode {
  id: number;
  C_ID: number;
  C_type: number;
  data: { label: string };
  count: number;
}

export interface SelectedGraph {
  C_ID: number; // 중심 노드 ID
  C_type: number; // 중심 노드 타입
  IO_type: number; // inout 타입
  In: string[];
}

export interface GraphEmail {
  message_id: string;
  threadId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  sentAt: string;
  isRead: boolean;
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
  __indexColor?: string; // 색상";
  index?: number; // 인덱스
  x?: number; // x 좌표
  y?: number; // y 좌표
  vx?: number; // x 속도
  vy?: number; // y 속도
}

export interface GraphLink {
  source: number;
  target: number;
}

export interface GraphIpcResponse {
  status: "success" | "fail";
}

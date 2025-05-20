import useAuthenticateStore from "@stores/authenticateStore";

import { RawNode, GraphEmail, GraphIpcResponse } from "@/types/graphType";

/*
중심 노드 타입 - 0 : Root, 1 : Person, 2 : Category, 3 : Subcategory
중심 노드 ID - Root, Person : contact_id, Category, Subcategory : category_id
inout 타입 - 1 : in, 2 : out, 3 : in&out
*/

// 그래프 노드 목록 조회
export const readGraphNode = async ({
  c_id,
  c_type,
  io_type,
}: {
  c_id: string; //  중심 노드 ID
  c_type: number; // 중심 노드 타입,
  io_type: number; //  inout 타입
}): Promise<{
  status: "success" | "fail";
  message: string;
  result: {
    nodes: RawNode[];
  };
}> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  /*
  "C_ID": 중심 노드 ID,
  "C_type": 중심 노드 타입,
  "IO_type": inout 타입 
  */
  try {
    const response = await window.electronAPI.graph.readNodePy({
      C_ID: c_id,
      C_type: c_type,
      IO_type: io_type,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error fetching graph nodes:", error);
    throw error;
  }
};

// 메일 목록 조회
export const getGraphMessage = async ({
  C_ID,
  C_type,
  IO_type,
  In,
}: {
  C_ID: string; // 중심 노드 ID
  C_type: number; // 중심 노드 타입
  IO_type: number; // inout 타입
  In: string[]; // 주변 노드 ID 리스트
}): Promise<{
  status: "success" | "fail";
  message: string;
  result: {
    emails: GraphEmail[];
  };
}> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  /*
  "C_ID": 중심 노드 ID,
  "C_type": 중심 노드 타입,
  "IO_type": inout 타입 - 항싱 1
  "In": [주변 노드 ID 리스트]
  */
  try {
    const response = await window.electronAPI.graph.readMessagePy({
      C_ID,
      C_type,
      IO_type,
      In,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error fetching graph messages:", error);
    throw error;
  }
};

// 노드 생성
export const createGraphNode = async ({
  C_name,
}: {
  C_name: string; // 새로운 카테고리 이름
}): Promise<GraphIpcResponse> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"C_name": "새로운 카테고리"}
  try {
    const response = await window.electronAPI.graph.createNodePy({
      C_name,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error creating graph node:", error);
    throw error;
  }
};

// 노드 삭제
export const deleteGraphNode = async ({
  C_ID,
  C_type,
}: {
  C_ID: string; // 삭제할 노드 ID
  C_type: number; // 삭제할 노드 타입
}): Promise<{ status: "success" | "fail" }> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"C_ID": 노드 ID, "C_type": 노드 타입}
  try {
    const response = await window.electronAPI.graph.deleteNodePy({
      C_ID,
      C_type,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error("Failed to delete node");
    }
  } catch (error) {
    console.error("Error deleting graph node:", error);
    throw error;
  }
};

// 노드 이름 변경
export const renameGraphNode = async ({
  before_name,
  after_name,
}: {
  before_name: string; // 노드 이전 이름
  after_name: string; // 노드 새 이름
}): Promise<{ status: "success" | "fail" }> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"before_name": "노드 이전 이름", "after_name": "노드 새 이름"}
  try {
    const response = await window.electronAPI.graph.renameNodePy({
      before_name,
      after_name,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error("Failed to rename node");
    }
  } catch (error) {
    console.error("Error renaming graph node:", error);
    throw error;
  }
};

// 노드 병합
export const mergeGraphNode = async ({
  before_name1,
  before_name2,
  after_name,
}: {
  before_name1: string; // 노드 이전 이름1
  before_name2: string; // 노드 이전 이름2
  after_name: string; // 노드 새 이름
}): Promise<{ status: "success" | "fail" }> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"before_name1": "노드 이전 이름1", "before_name2": "노드 이전 이름2", "after_name": "노드 새 이름"}
  try {
    const response = await window.electronAPI.graph.mergeNodePy({
      before_name1,
      before_name2,
      after_name,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error("Failed to merge nodes");
    }
  } catch (error) {
    console.error("Error merging graph nodes:", error);
    throw error;
  }
};

// 메일 삭제
export const deleteGraphMessage = async ({
  message_id,
}: {
  message_id: number; // 삭제할 메일의 ID
}): Promise<{ status: "success" | "fail" }> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"message_id": 메세지 ID}
  try {
    const response = await window.electronAPI.graph.deleteMailPy({
      message_id,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error("Failed to delete message");
    }
  } catch (error) {
    console.error("Error deleting graph message:", error);
    throw error;
  }
};

// 메일 이동
export const moveGraphMessage = async ({
  message_id,
  category_id,
  sub_category_id,
}: {
  message_id: number; // 이동할 메일의 ID
  category_id: number; // 카테고리 ID
  sub_category_id: number; // 서브카테고리 ID
}): Promise<{ status: "success" | "fail" }> => {
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"message_id": 메세지 ID, "category_id": 카테고리 ID, "sub_category_id": 서브카테고리 ID}
  try {
    const response = await window.electronAPI.graph.moveMailPy({
      message_id,
      category_id,
      sub_category_id,
    });
    if (response.status === "success") {
      return response;
    } else {
      throw new Error("Failed to move message");
    }
  } catch (error) {
    console.error("Error moving graph message:", error);
    throw error;
  }
};

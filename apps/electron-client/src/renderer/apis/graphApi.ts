import {
  RawNode,
  SelectedGraph,
  GraphEmail,
  GraphIpcResponse,
} from "@/types/graphType";

/*
중심 노드 타입 - 0 : Root, 1 : Person, 2 : Category, 3 : Subcategory
중심 노드 ID - Root, Person : contact_id, Category, Subcategory : category_id
inout 타입 - 1 : in, 2 : out, 3 : in&out
*/

// 그래프 노드 목록 조회
export const readGraphNode = async ({
  C_ID,
  C_type,
  IO_type,
}: {
  C_ID: number; //  중심 노드 ID
  C_type: number; // 중심 노드 타입,
  IO_type: number; //  inout 타입
}): Promise<RawNode[]> => {
  /*
  "C_ID": 중심 노드 ID,
  "C_type": 중심 노드 타입,
  "IO_type": inout 타입 
  */
  try {
    const response = await window.electronAPI.graph.readNodePy({
      C_ID,
      C_type,
      IO_type,
    });
    // console.error("[Get] 그래프 노드 조회", response);

    if (response.status === "success") {
      // console.error("Graph Node Result:", response.result);
      return response.result.nodes;
    } else {
      console.error("Graph Node Error:", response.message);
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error fetching graph nodes:", error);
    throw error;
  }
};

// 그래프 메일 목록 조회
export const readGraphMessage = async ({
  C_ID,
  C_type,
  IO_type,
  In,
}: SelectedGraph): Promise<GraphEmail[]> => {
  console.error("Graph Message Params:");
  /*
  "C_ID": 중심 노드 ID,
  "C_type": 중심 노드 타입,
  "IO_type": inout 타입,
  "In": 메일 필터링 조건
  */
  try {
    const response = await window.electronAPI.graph.readMessagePy({
      C_ID,
      C_type,
      IO_type,
      In,
    });

    if (response.status === "success") {
      return response.result.emails;
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
  user, // Add user as a parameter
}: {
  C_name: string; // 새로운 카테고리 이름
  user: any; // Define a more specific type
}): Promise<{ status: "success" | "fail"; message: string }> => {
  // const { user } = useAuthenticateStore(); // Remove hook call

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
  user, // Add user as a parameter
}: {
  C_ID: number; // 삭제할 노드 ID
  C_type: number; // 삭제할 노드 타입
  user: any; // Define a more specific type
}): Promise<GraphIpcResponse> => {
  // const { user } = useAuthenticateStore(); // Remove hook call

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
  C_ID,
  C_type,
  after_name,
  user, // Add user as a parameter
}: {
  C_ID: number; // 노드 ID
  C_type: number; // 노드 타입
  after_name: string; // 노드 새 이름
  user: any; // Define a more specific type
}): Promise<GraphIpcResponse> => {
  // const { user } = useAuthenticateStore(); // Remove hook call

  if (!user) {
    throw new Error("User not authenticated");
  }

  // {"before_name": "노드 이전 이름", "after_name": "노드 새 이름"}
  try {
    const response = await window.electronAPI.graph.renameNodePy({
      C_ID,
      C_type,
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
  C_ID1,
  C_type1,
  C_ID2,
  C_type2,
  after_name,
}: {
  C_ID1: number;
  C_type1: number;
  C_ID2: number;
  C_type2: number;
  after_name: string;
}): Promise<GraphIpcResponse> => {
  try {
    const response = await window.electronAPI.graph.mergeNodePy({
      C_ID1,
      C_type1,
      C_ID2,
      C_type2,
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
  user, // Add user as a parameter
}: {
  message_id: number; // 삭제할 메일의 ID
  user: any; // Define a more specific type
}): Promise<GraphIpcResponse> => {
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
  user, // Add user as a parameter
}: {
  message_id: number; // 이동할 메일의 ID
  category_id: number; // 카테고리 ID
  sub_category_id: number; // 서브카테고리 ID
  user: any; // Define a more specific type
}): Promise<GraphIpcResponse> => {
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

// 노드 검색
export const searchGraphNode = async ({
  keyword,
}: {
  keyword: string;
}): Promise<RawNode[]> => {
  try {
    const response = await window.electronAPI.graph.searchByKeywordPy({
      keyword,
    });
    // console.error("Search Graph Node Response:", response);

    if (response.status === "success") {
      return response.result.nodes;
    } else {
      throw new Error("Failed to search node");
    }
  } catch (error) {
    console.error("Error searching graph node:", error);
    throw error;
  }
};

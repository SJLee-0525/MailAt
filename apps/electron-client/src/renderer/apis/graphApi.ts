// 그래프 초기화 요청
export const resetGraph = () => {
  try {
    const response = window.electronAPI.graph.testGraph();
    console.log(`[DELETE] window.electronAPI.graph.resetGraph()`, response);

    const response2 = window.electronAPI.graph.readData();
    console.log(`[GET] window.electronAPI.graph.readData()`, response2);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 생성 요청
export const createNode = (nodeData) => {
  try {
    const response = window.electronAPI.graph.createNode(nodeData);
    console.log(`[POST] window.electronAPI.graph.createNode()`, response);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 업데이트 요청
export const updateNode = ({ nodeId, updateData }) => {
  try {
    const response = window.electronAPI.graph.updateNode({
      nodeId,
      updateData,
    });
    console.log(
      `[PUT] window.electronAPI.graph.updateNode(${nodeId}, ${updateData})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 삭제 요청
export const deleteNode = ({ nodeId }) => {
  try {
    const response = window.electronAPI.graph.deleteNode(nodeId);
    console.log(
      `[DELETE] window.electronAPI.graph.deleteNode(${nodeId})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 조회 요청
export const readNode = ({
  C_ID,
  C_type,
  IO_type,
}: {
  C_ID: number;
  C_type: number;
  IO_type: number;
}) => {
  try {
    const response = window.electronAPI.graph.readNode({
      C_ID,
      C_type,
      IO_type,
    });
    console.log(
      `[GET] window.electronAPI.graph.readNode(${C_ID}, ${C_type}, ${IO_type})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 메시지 읽기 요청
export const readNodeMessage = ({ basic_C_ID, C_type, filter }) => {
  try {
    const response = window.electronAPI.graph.readMessage({
      basic_C_ID,
      C_type,
      filter,
    });
    console.log(
      `[GET] window.electronAPI.graph.readMessage(${basic_C_ID}, ${C_type}, ${filter})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 메시지 삭제 요청
export const deleteNodeMessage = ({ message_C_ID, except_C_ID }) => {
  try {
    const response = window.electronAPI.graph.deleteMessage({
      message_C_ID,
      except_C_ID,
    });
    console.log(
      `[DELETE] window.electronAPI.graph.deleteMessage(${message_C_ID}, ${except_C_ID})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 라벨 수정 요청
export const updateNodeLabel = ({ C_ID, newLabel }) => {
  try {
    const response = window.electronAPI.graph.updateLabel({
      C_ID,
      newLabel,
    });
    console.log(
      `[PUT] window.electronAPI.graph.updateLabel(${C_ID}, ${newLabel})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 키워드 검색 요청 처리
export const searchByKeyword = ({ keyword }) => {
  try {
    const response = window.electronAPI.graph.searchByKeyword({ keyword });
    console.log(
      `[GET] window.electronAPI.graph.searchByKeyword(${keyword})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 노드 병합 요청
export const mergeNodes = ({ from_C_ID, to_C_ID }) => {
  try {
    const response = window.electronAPI.graph.mergeNode({
      from_C_ID,
      to_C_ID,
    });
    console.log(
      `[PUT] window.electronAPI.graph.mergeNode(${from_C_ID}, ${to_C_ID})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

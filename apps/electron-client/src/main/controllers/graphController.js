import { ipcMain } from "electron";
import * as graphService from "../services/neo4jAdapter.js"; // neo4jAdapter.js를 사용합니다.

/**
 * Graph 컨트롤러 초기화
 */
export const initGraphController = () => {
  // 그래프 데이터 읽기 요청 처리
  ipcMain.handle("graph:testConnection", async (event) => {
    try {
      const result = await graphService.testConnection();
      console.log("그래프 IPC 통신 테스트 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 삭제 요청 처리
  ipcMain.handle("graph:deleteNode", async (event, nodeId) => {
    try {
      const result = await graphService.deleteNode(nodeId);
      console.log("노드 삭제 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 삭제 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 라벨 수정 요청 처리
  ipcMain.handle("graph:updateLabel", async (event, { C_ID, newLabel }) => {
    try {
      const result = await graphService.updateLabel(C_ID, newLabel);
      console.log("노드 라벨 수정 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 라벨 수정 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 병합 요청 처리
  ipcMain.handle("graph:mergeNode", async (event, { from_C_ID, to_C_ID }) => {
    try {
      const result = await graphService.mergeNode(from_C_ID, to_C_ID);
      console.log("노드 병합 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 병합 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:initializeGraphFromSQLite", async () => {
    try {
      const result = await graphService.initializeGraphFromSQLite();
      console.log("SQLite로부터 그래프 초기화 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("SQLite로부터 그래프 초기화 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:getIncomingNodes", async (event, { node_name }) => {
    try {
      const result = await graphService.getIncomingNodes(node_name);
      console.log("수신 노드 가져오기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("수신 노드 가져오기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:deleteAllNodes", async () => {
    try {
      const result = await graphService.deleteAllNodes();
      console.log("모든 노드 삭제 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("모든 노드 삭제 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:moveComplexNode", async (event, { a_id, b_id, c_id }) => {
    try {
      const result = await graphService.moveComplexNode(a_id, b_id, c_id);
      console.log("복잡한 노드 이동 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("복잡한 노드 이동 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // --- 새로 추가된 IPC 핸들러 ---

  // 메시지 처리 및 임베딩 요청
  ipcMain.handle("graph:processAndEmbedMessages", async () => {
    try {
      const result = await graphService.processAndEmbedMessages();
      console.log("메시지 처리 및 임베딩 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("메시지 처리 및 임베딩 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 그래프 빌드 요청
  ipcMain.handle("graph:buildGraph", async () => {
    try {
      const result = await graphService.buildGraph();
      console.log("그래프 빌드 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 빌드 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 가져오기 요청
  ipcMain.handle("graph:fetchNodes", async (event, { C_ID, C_type, IO_type }) => {
    try {
      const result = await graphService.fetchNodes(C_ID, C_type, IO_type);
      console.log("노드 가져오기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 가져오기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 이메일 가져오기 요청
  ipcMain.handle("graph:fetchEmails", async (event, { basic_C_ID, C_type, IO_type, in_data }) => {
    try {
      const result = await graphService.fetchEmails(basic_C_ID, C_type, IO_type, in_data);
      console.log("이메일 가져오기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message, error: result.error };
      }
    } catch (error) {
      console.error("이메일 가져오기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });
};

export default { initGraphController };

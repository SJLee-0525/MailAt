import { ipcMain } from "electron";
import * as graphService from "../services/neo4jAdapter.js"; // neo4jAdapter.js를 사용합니다.

/**
 * Graph 컨트롤러 초기화
 */
export const initGraphController = () => {
  // 그래프 데이터 읽기 요청 처리
  ipcMain.handle("graph:testGraph", async (event) => {
    try {
      const result = await graphService.testGraph();
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

  ipcMain.handle("graph:readData", async (event) => {
    try {
      const result = await graphService.readGraphData();
      console.log("그래프 데이터 읽기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 데이터 읽기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 생성 요청 처리
  ipcMain.handle("graph:createNode", async (event, nodeData) => {
    try {
      const result = await graphService.createNode(nodeData);
      console.log("노드 생성 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 생성 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 노드 업데이트 요청 처리
  ipcMain.handle("graph:updateNode", async (event, { nodeId, updateData }) => {
    try {
      const result = await graphService.updateNode(nodeId, updateData);
      console.log("노드 업데이트 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 업데이트 컨트롤러 오류:", error);
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

  // 노드 읽기 요청 처리
  ipcMain.handle("graph:readNode", async (event, { C_ID, C_type, IO_type }) => {
    try {
      const result = await graphService.readNode(C_ID, C_type, IO_type);
      console.log("노드 읽기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 읽기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 메시지 읽기 요청 처리
  ipcMain.handle("graph:readMessage", async (event, { basic_C_ID, C_type, filter }) => {
    try {
      const result = await graphService.readMessage(basic_C_ID, C_type, filter);
      console.log("메시지 읽기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("메시지 읽기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 메시지 삭제 요청 처리
  ipcMain.handle("graph:deleteMessage", async (event, { message_C_ID, except_C_ID }) => {
    try {
      const result = await graphService.deleteMessage(message_C_ID, except_C_ID);
      console.log("메시지 삭제 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("메시지 삭제 컨트롤러 오류:", error);
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

  // 키워드 검색 요청 처리
  ipcMain.handle("graph:searchByKeyword", async (event, { keyword }) => {
    try {
      const result = await graphService.searchByKeyword(keyword);
      console.log("키워드 검색 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("키워드 검색 컨트롤러 오류:", error);
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

  // LLM 태깅 요청 처리
  ipcMain.handle("graph:llmTagNode", async (event, { C_ID, llm_tags }) => {
    try {
      const result = await graphService.llmTagNode(C_ID, llm_tags);
      console.log("LLM 태깅 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("LLM 태깅 컨트롤러 오류:", error);
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
      console.log("SQLite에서 그래프 초기화 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("SQLite에서 그래프 초기화 컨트롤러 오류:", error);
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

  ipcMain.handle("graph:getOutgoingNodes", async (event, { node_name }) => {
    try {
      const result = await graphService.getOutgoingNodes(node_name);
      console.log("발신 노드 가져오기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("발신 노드 가져오기 컨트롤러 오류:", error);
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
        return { success: true, message: result.message }; // Assuming message contains relevant info
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

  ipcMain.handle("graph:moveEmail", async (event, { from_id, to_id, email_uid }) => {
    try {
      const result = await graphService.moveEmail(from_id, to_id, email_uid);
      console.log("이메일 이동 결과:", result);
      if (result.status === "success") {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("이메일 이동 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:getNodeEmails", async (event, { node_name }) => {
    try {
      const result = await graphService.getNodeEmails(node_name);
      console.log("노드 이메일 가져오기 결과:", result);
      if (result.status === "success") {
        return { success: true, data: result.result };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("노드 이메일 가져오기 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });
};

export default { initGraphController };

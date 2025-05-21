import { ipcMain } from "electron";
import * as graphService from "../services/neo4jAdapter.js"; // neo4jAdapter.js를 사용합니다.

/**
 * Graph 컨트롤러 초기화
 */
export const initGraphController = () => {
  // 기존 핸들러들은 주석 처리 (Python 기반 새 API로 마이그레이션 중)
  /*
  // 그래프 데이터 읽기 요청 처리
  ipcMain.handle("graph:testGraph", async (event) => { ... });
  ipcMain.handle("graph:readData", async (event) => { ... });
  ipcMain.handle("graph:createNode", async (event, nodeData) => { ... });
  ipcMain.handle("graph:updateNode", async (event, { nodeId, updateData }) => { ... });
  ipcMain.handle("graph:deleteNode", async (event, nodeId) => { ... });
  ipcMain.handle("graph:readNode", async (event, { C_ID, C_type, IO_type }) => { ... });
  ipcMain.handle("graph:readMessage", async (event, { basic_C_ID, C_type, filter }) => { ... });
  ipcMain.handle("graph:deleteMessage", async (event, { message_C_ID, except_C_ID }) => { ... });
  ipcMain.handle("graph:updateLabel", async (event, { C_ID, newLabel }) => { ... });
  ipcMain.handle("graph:searchByKeyword", async (event, { keyword }) => { ... });
  ipcMain.handle("graph:mergeNode", async (event, { from_C_ID, to_C_ID }) => { ... });
  ipcMain.handle("graph:llmTagNode", async (event, { C_ID, llm_tags }) => { ... });
  ipcMain.handle("graph:initializeGraphFromSQLite", async () => { ... });
  ipcMain.handle("graph:getIncomingNodes", async (event, { node_name }) => { ... });
  ipcMain.handle("graph:getOutgoingNodes", async (event, { node_name }) => { ... });
  ipcMain.handle("graph:deleteAllNodes", async () => { ... });
  ipcMain.handle("graph:moveComplexNode", async (event, { a_id, b_id, c_id }) => { ... });
  ipcMain.handle("graph:moveEmail", async (event, { from_id, to_id, email_uid }) => { ... });
  ipcMain.handle("graph:getNodeEmails", async (event, { node_name }) => { ... });
  */

  // --- New handlers based on graph_operations.py ---
  ipcMain.handle("graph:processAndEmbedMessagesPy", async (event) => {
    try {
      const result = await graphService.processAndEmbedMessagesPy();
      console.log("[GraphCtrl] IPC (processAndEmbedMessagesPy):", result);
      return result; // Python 스크립트의 반환 값을 그대로 전달
    } catch (error) {
      console.error("[GraphCtrl] Error (processAndEmbedMessagesPy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:initializeGraphFromSQLitePy", async (event) => {
    try {
      const result = await graphService.initializeGraphFromSQLitePy();
      console.log("[GraphCtrl] IPC (initializeGraphFromSQLitePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (initializeGraphFromSQLitePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:readNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.readNodePy(json_obj);
      console.log("[GraphCtrl] IPC (readNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (readNodePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:readMessagePy", async (event, json_obj) => {
    try {
      const result = await graphService.readMessagePy(json_obj);
      console.log("[GraphCtrl] IPC (readMessagePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (readMessagePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:createNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.createNodePy(json_obj);
      console.log("[GraphCtrl] IPC (createNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (createNodePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:deleteNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.deleteNodePy(json_obj);
      console.log("[GraphCtrl] IPC (deleteNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (deleteNodePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:renameNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.renameNodePy(json_obj);
      console.log("[GraphCtrl] IPC (renameNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (renameNodePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:mergeNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.mergeNodePy(json_obj);
      console.log("[GraphCtrl] IPC (mergeNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (mergeNodePy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:deleteMailPy", async (event, json_obj) => {
    try {
      const result = await graphService.deleteMailPy(json_obj);
      console.log("[GraphCtrl] IPC (deleteMailPy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (deleteMailPy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:moveMailPy", async (event, json_obj) => {
    try {
      const result = await graphService.moveMailPy(json_obj);
      console.log("[GraphCtrl] IPC (moveMailPy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (moveMailPy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });

  ipcMain.handle("graph:searchByKeywordPy", async (event, json_obj) => {
    try {
      const result = await graphService.searchByKeywordPy(json_obj);
      console.log("[GraphCtrl] IPC (searchByKeywordPy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (searchByKeywordPy):", error);
      return {
        status: "fail",
        message: error.message,
        error: error.toString(),
      };
    }
  });
};

export default { initGraphController };

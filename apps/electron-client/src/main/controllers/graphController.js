import { ipcMain } from "electron";
import * as graphService from "../services/neo4jAdapter.js"; // neo4jAdapter.js를 사용합니다.

/**
 * Graph 컨트롤러 초기화
 */
export const initGraphController = () => {
  // 기존 핸들러 주석 처리
  /*
  ipcMain.handle("graph:testConnection", async (event) => {
    try {
      const result = await graphService.testConnection();
      console.log("그래프 IPC 통신 테스트 결과 (testConnection):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (testConnection):", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  ipcMain.handle("graph:initializeGraphFromSQLite", async (event) => {
    try {
      const result = await graphService.initializeGraphFromSQLite();
      console.log("그래프 IPC 통신 테스트 결과 (initializeGraphFromSQLite):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (initializeGraphFromSQLite):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:fetchNodes", async (event, C_ID, C_type, IO_type) => {
    try {
      const result = await graphService.fetchNodes(C_ID, C_type, IO_type);
      console.log("그래프 IPC 통신 테스트 결과 (fetchNodes):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (fetchNodes):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:fetchEmails", async (event, basic_C_ID, C_type, IO_type, in_data) => {
    try {
      const result = await graphService.fetchEmails(basic_C_ID, C_type, IO_type, in_data);
      console.log("그래프 IPC 통신 테스트 결과 (fetchEmails):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (fetchEmails):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:deleteNode", async (event, nodeId) => {
    try {
      const result = await graphService.deleteNode(nodeId);
      console.log("그래프 IPC 통신 테스트 결과 (deleteNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (deleteNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:mergeNode", async (event, from_C_ID, to_C_ID) => {
    try {
      const result = await graphService.mergeNode(from_C_ID, to_C_ID);
      console.log("그래프 IPC 통신 테스트 결과 (mergeNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (mergeNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:updateLabel", async (event, C_ID, newLabel) => {
    try {
      const result = await graphService.updateLabel(C_ID, newLabel);
      console.log("그래프 IPC 통신 테스트 결과 (updateLabel):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (updateLabel):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:getIncomingNodes", async (event, node_name) => {
    try {
      const result = await graphService.getIncomingNodes(node_name);
      console.log("그래프 IPC 통신 테스트 결과 (getIncomingNodes):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (getIncomingNodes):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:deleteAllNodes", async (event) => {
    try {
      const result = await graphService.deleteAllNodes();
      console.log("그래프 IPC 통신 테스트 결과 (deleteAllNodes):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (deleteAllNodes):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:moveComplexNode", async (event, a_id, b_id, c_id) => {
    try {
      const result = await graphService.moveComplexNode(a_id, b_id, c_id);
      console.log("그래프 IPC 통신 테스트 결과 (moveComplexNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (moveComplexNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:buildGraph", async (event) => {
    try {
      const result = await graphService.buildGraph();
      console.log("그래프 IPC 통신 테스트 결과 (buildGraph):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (buildGraph):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:processAndEmbedMessages", async (event) => {
    try {
      const result = await graphService.processAndEmbedMessages();
      console.log("그래프 IPC 통신 테스트 결과 (processAndEmbedMessages):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (processAndEmbedMessages):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:readGraphData", async (event) => {
    try {
      const result = await graphService.readGraphData();
      console.log("그래프 IPC 통신 테스트 결과 (readGraphData):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (readGraphData):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:createNode", async (event, nodeData) => {
    try {
      const result = await graphService.createNode(nodeData);
      console.log("그래프 IPC 통신 테스트 결과 (createNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (createNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:updateNode", async (event, nodeId, updateData) => {
    try {
      const result = await graphService.updateNode(nodeId, updateData);
      console.log("그래프 IPC 통신 테스트 결과 (updateNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (updateNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:createRelationship", async (event, fromNodeId, toNodeId, relationshipType, properties) => {
    try {
      const result = await graphService.createRelationship(fromNodeId, toNodeId, relationshipType, properties);
      console.log("그래프 IPC 통신 테스트 결과 (createRelationship):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (createRelationship):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:deleteRelationship", async (event, relationshipId) => {
    try {
      const result = await graphService.deleteRelationship(relationshipId);
      console.log("그래프 IPC 통신 테스트 결과 (deleteRelationship):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (deleteRelationship):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:searchByKeyword", async (event, keyword) => {
    try {
      const result = await graphService.searchByKeyword(keyword);
      console.log("그래프 IPC 통신 테스트 결과 (searchByKeyword):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (searchByKeyword):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:llmTagNode", async (event, C_ID, llm_tags) => {
    try {
      const result = await graphService.llmTagNode(C_ID, llm_tags);
      console.log("그래프 IPC 통신 테스트 결과 (llmTagNode):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (llmTagNode):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:getOutgoingNodes", async (event, node_name) => {
    try {
      const result = await graphService.getOutgoingNodes(node_name);
      console.log("그래프 IPC 통신 테스트 결과 (getOutgoingNodes):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (getOutgoingNodes):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:moveEmail", async (event, from_id, to_id, email_uid) => {
    try {
      const result = await graphService.moveEmail(from_id, to_id, email_uid);
      console.log("그래프 IPC 통신 테스트 결과 (moveEmail):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (moveEmail):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:getNodeEmails", async (event, node_name) => {
    try {
      const result = await graphService.getNodeEmails(node_name);
      console.log("그래프 IPC 통신 테스트 결과 (getNodeEmails):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (getNodeEmails):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });

  ipcMain.handle("graph:printTest", async (event) => {
    try {
      const result = await graphService.printTest();
      console.log("그래프 IPC 통신 테스트 결과 (printTest):", result);
      if (result.status === "success") {
        return { success: true, data: result.result, message: result.message };
      } else {
        return { success: false, message: result.message, error: result.message };
      }
    } catch (error) {
      console.error("그래프 IPC 컨트롤러 오류 (printTest):", error);
      return { success: false, message: error.message, error: error.message };
    }
  });
  */

  // --- New handlers based on graph_operations.py ---
  ipcMain.handle("graph:processAndEmbedMessagesPy", async (event) => {
    try {
      const result = await graphService.processAndEmbedMessagesPy();
      console.log("[GraphCtrl] IPC (processAndEmbedMessagesPy):", result);
      return result; // Python 스크립트의 반환 값을 그대로 전달
    } catch (error) {
      console.error("[GraphCtrl] Error (processAndEmbedMessagesPy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:initializeGraphFromSQLitePy", async (event) => {
    try {
      const result = await graphService.initializeGraphFromSQLitePy();
      console.log("[GraphCtrl] IPC (initializeGraphFromSQLitePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (initializeGraphFromSQLitePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:readNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.readNodePy(json_obj);
      console.log("[GraphCtrl] IPC (readNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (readNodePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:readMessagePy", async (event, json_obj) => {
    try {
      const result = await graphService.readMessagePy(json_obj);
      console.log("[GraphCtrl] IPC (readMessagePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (readMessagePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:createNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.createNodePy(json_obj);
      console.log("[GraphCtrl] IPC (createNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (createNodePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:deleteNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.deleteNodePy(json_obj);
      console.log("[GraphCtrl] IPC (deleteNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (deleteNodePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:renameNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.renameNodePy(json_obj);
      console.log("[GraphCtrl] IPC (renameNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (renameNodePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:mergeNodePy", async (event, json_obj) => {
    try {
      const result = await graphService.mergeNodePy(json_obj);
      console.log("[GraphCtrl] IPC (mergeNodePy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (mergeNodePy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:deleteMailPy", async (event, json_obj) => {
    try {
      const result = await graphService.deleteMailPy(json_obj);
      console.log("[GraphCtrl] IPC (deleteMailPy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (deleteMailPy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

  ipcMain.handle("graph:moveMailPy", async (event, json_obj) => {
    try {
      const result = await graphService.moveMailPy(json_obj);
      console.log("[GraphCtrl] IPC (moveMailPy):", result);
      return result;
    } catch (error) {
      console.error("[GraphCtrl] Error (moveMailPy):", error);
      return { status: "fail", message: error.message, error: error.toString() };
    }
  });

};

export default { initGraphController };
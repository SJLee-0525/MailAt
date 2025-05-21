import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

// Python 스크립트가 있는 디렉토리 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptsDir = path.join(__dirname, "neo4jPythonModule");
console.log(`[neo4jAdapter] Python scripts directory: ${pythonScriptsDir}`);

const pythonExecutable = process.platform === 'win32' ? "python" : "python3";
console.log(`[neo4jAdapter] Using Python executable: ${pythonExecutable}`);

/**
 * Python 스크립트 또는 실행 파일을 실행하고 결과를 반환하는 내부 함수
 * @param {string} scriptName 실행할 Python 스크립트 파일 이름 (예: "graph_operations.py") 또는 실행 파일 이름 (예: "graph_operations.exe")
 * @param {string} operation 수행할 작업 이름
 * @param {object} args Python 스크립트 또는 실행 파일에 전달할 인자 객체
 * @returns {Promise<object>} Python 스크립트 또는 실행 파일의 JSON 출력 결과
 */
function runPythonScript(scriptName, operation, args = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(pythonScriptsDir, scriptName);
    const command = pythonExecutable;
    const commandArgs = [scriptPath];

    console.log(`[runPythonScript] Executing: ${command} ${commandArgs.join(" ")}`);

    const pythonProcess = spawn(command, commandArgs);
    const inputData = JSON.stringify({ operation, args });

    // stdin으로 데이터 전달
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      console.log(`[runPythonScript] Python script stdout: ${stdoutData}`);
      if (stderrData) console.error(`[runPythonScript] Python script stderr: ${stderrData}`);
      
      if (code === 0) {
        try {
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch (e) {
          console.error("[runPythonScript] Failed to parse Python script output:", e);
          console.error("Raw output:", stdoutData);
          reject(new Error("Failed to parse Python script output."));
        }
      } else {
        console.error(`[runPythonScript] Python script exited with code ${code}: ${stderrData}`);
        reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("[runPythonScript] Failed to start Python script:", err);
      reject(err);
    });
  });
}

// --- Public API 함수들 ---

// 기존 함수 주석 처리
/*
export async function testConnection() {
  console.log("[neo4jAdapter] testConnection 호출됨");
  return runPythonScript("graph_operations.py", "test_connection");
}

export async function initializeGraphFromSQLite() {
  console.log("[neo4jAdapter] initializeGraphFromSQLite 호출됨");
  return runPythonScript("graph_operations.py", "initialize_graph_from_sqlite");
}

export async function fetchNodes(C_ID, C_type, IO_type) {
  console.log("[neo4jAdapter] fetchNodes 호출됨");
  return runPythonScript("graph_operations.py", "read_node", { C_ID, C_type, IO_type });
}

export async function fetchEmails(basic_C_ID, C_type, IO_type, in_data = null) {
  console.log("[neo4jAdapter] fetchEmails 호출됨");
  return runPythonScript("graph_operations.py", "read_message", { basic_C_ID, C_type, IO_type, in_data });
}

export async function deleteNode(nodeId) {
  console.log("[neo4jAdapter] deleteNode 호출됨");
  return runPythonScript("graph_operations.py", "delete_node", { nodeId });
}

export async function mergeNode(from_C_ID, to_C_ID) {
  console.log("[neo4jAdapter] mergeNode 호출됨");
  return runPythonScript("graph_operations.py", "merge_node", { from_C_ID, to_C_ID });
}

export async function updateLabel(C_ID, newLabel) {
  console.log("[neo4jAdapter] updateLabel 호출됨");
  return runPythonScript("graph_operations.py", "update_label", { C_ID, newLabel });
}

export async function getIncomingNodes(node_name) {
  console.log("[neo4jAdapter] getIncomingNodes 호출됨");
  return runPythonScript("graph_operations.py", "get_incoming_nodes", { node_name });
}

export async function deleteAllNodes() {
  console.log("[neo4jAdapter] deleteAllNodes 호출됨");
  return runPythonScript("graph_operations.py", "delete_all_nodes");
}

export async function moveComplexNode(a_id, b_id, c_id) {
  console.log("[neo4jAdapter] moveComplexNode 호출됨");
  return runPythonScript("graph_operations.py", "move_complex_node", { a_id, b_id, c_id });
}

export async function buildGraph() {
  console.log("[neo4jAdapter] buildGraph 호출됨");
  return runPythonScript("graph_operations.py", "build_graph");
}

export async function processAndEmbedMessages() {
  console.log("[neo4jAdapter] processAndEmbedMessages 호출됨");
  return runPythonScript("graph_operations.py", "process_and_embed_messages");
}

// Placeholder functions from Python mock
export async function readGraphData() {
  console.log("[neo4jAdapter] readGraphData 호출됨");
  return runPythonScript("graph_operations.py", "read_graph_data");
}

export async function createNode(nodeData) {
  console.log("[neo4jAdapter] createNode 호출됨");
  return runPythonScript("graph_operations.py", "create_node", { nodeData });
}

export async function updateNode(nodeId, updateData) {
  console.log("[neo4jAdapter] updateNode 호출됨");
  return runPythonScript("graph_operations.py", "update_node", { nodeId, updateData });
}

export async function createRelationship(fromNodeId, toNodeId, relationshipType, properties) {
  console.log("[neo4jAdapter] createRelationship 호출됨");
  return runPythonScript("graph_operations.py", "create_relationship", { fromNodeId, toNodeId, relationshipType, properties });
}

export async function deleteRelationship(relationshipId) {
  console.log("[neo4jAdapter] deleteRelationship 호출됨");
  return runPythonScript("graph_operations.py", "delete_relationship", { relationshipId });
}

export async function searchByKeyword(keyword) {
  console.log("[neo4jAdapter] searchByKeyword 호출됨");
  return runPythonScript("graph_operations.py", "search_by_keyword", { keyword });
}

export async function llmTagNode(C_ID, llm_tags) {
  console.log("[neo4jAdapter] llmTagNode 호출됨");
  return runPythonScript("graph_operations.py", "llm_tag_node", { C_ID, llm_tags });
}

export async function getOutgoingNodes(node_name) {
  console.log("[neo4jAdapter] getOutgoingNodes 호출됨");
  return runPythonScript("graph_operations.py", "get_outgoing_nodes", { node_name });
}

export async function moveEmail(from_id, to_id, email_uid) {
  console.log("[neo4jAdapter] moveEmail 호출됨");
  return runPythonScript("graph_operations.py", "move_email", { from_id, to_id, email_uid });
}

export async function getNodeEmails(node_name) {
  console.log("[neo4jAdapter] getNodeEmails 호출됨");
  return runPythonScript("graph_operations.py", "get_node_emails", { node_name });
}

export async function printTest() {
  console.log("[neo4jAdapter] printTest 호출됨");
  return runPythonScript("graph_operations.py", "print_test");
}
*/

// --- New functions based on graph_operations.py ---
export async function processAndEmbedMessagesPy() {
  console.log("[neo4jAdapter] processAndEmbedMessagesPy 호출됨");
  return runPythonScript("graph_operations.py", "process_and_embed_messages_py");
}

export async function initializeGraphFromSQLitePy() {
  console.log("[neo4jAdapter] initializeGraphFromSQLitePy 호출됨");
  return runPythonScript("graph_operations.py", "initialize_graph_from_sqlite_py");
}

export async function readNodePy(json_obj) {
  console.log("[neo4jAdapter] readNodePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "read_node_py", json_obj);
}

export async function readMessagePy(json_obj) {
  console.log("[neo4jAdapter] readMessagePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "read_message_py", json_obj);
}

export async function createNodePy(json_obj) {
  console.log("[neo4jAdapter] createNodePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "create_node_py", json_obj);
}

export async function deleteNodePy(json_obj) {
  console.log("[neo4jAdapter] deleteNodePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "delete_node_py", json_obj);
}

export async function renameNodePy(json_obj) {
  console.log("[neo4jAdapter] renameNodePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "rename_node_py", json_obj);
}

export async function mergeNodePy(json_obj) {
  console.log("[neo4jAdapter] mergeNodePy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "merge_node_py", json_obj);
}

export async function deleteMailPy(json_obj) {
  console.log("[neo4jAdapter] deleteMailPy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "delete_mail_py", json_obj);
}

export async function moveMailPy(json_obj) {
  console.log("[neo4jAdapter] moveMailPy 호출됨", json_obj);
  return runPythonScript("graph_operations.py", "move_mail_py", json_obj);
}


export default {
  // 기존 export 주석 처리
  /*
  testConnection,
  initializeGraphFromSQLite,
  fetchNodes,
  fetchEmails,
  deleteNode,
  mergeNode,
  updateLabel,
  getIncomingNodes,
  deleteAllNodes,
  moveComplexNode,
  buildGraph,
  processAndEmbedMessages,
  readGraphData,
  createNode,
  updateNode,
  createRelationship,
  deleteRelationship,
  searchByKeyword,
  llmTagNode,
  getOutgoingNodes,
  moveEmail,
  getNodeEmails,
  printTest,
  */
  // 새로운 함수 export
  processAndEmbedMessagesPy,
  initializeGraphFromSQLitePy,
  readNodePy,
  readMessagePy,
  createNodePy,
  deleteNodePy,
  renameNodePy,
  mergeNodePy,
  deleteMailPy,
  moveMailPy,
};

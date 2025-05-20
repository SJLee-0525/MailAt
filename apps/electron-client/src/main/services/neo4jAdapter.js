import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

// Python 스크립트가 있는 디렉토리 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptsDir = path.join(__dirname, "neo4jPythonModule");
const pythonExecutable = "python"; // 또는 "python3" 등 Python 실행 파일 경로

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
    let pythonProcess;

    if (scriptName.toLowerCase().endsWith(".exe")) {
      pythonProcess = spawn(scriptPath, []); // .exe 파일 직접 실행
    } else {
      // .exe가 아닌 경우 기존 로직대로 Python 인터프리터 사용 (주로 .py 파일 대상)
      pythonProcess = spawn(pythonExecutable, [scriptPath]);
    }
    
    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (stderrData) {
        // Log stderr regardless, for debugging purposes
        console.error(`[neo4jAdapter] Python Script Info/Error Output (stderr) for ${scriptName} - ${operation}:\n${stderrData}`);
        
        // Only treat as an error if the exit code is non-zero
        if (code !== 0) {
          try {
            // Attempt to parse stderr as JSON, in case Python sends a structured error
            const errorResult = JSON.parse(stderrData);
            return reject(new Error(errorResult.message || `Python script error (exit code ${code}): ${stderrData.trim()}`));
          } catch (e) {
            // If stderr is not JSON, use it as a plain text error message
            return reject(new Error(`Python script error (exit code ${code}): ${stderrData.trim()}`));
          }
        }
        // If code is 0, stderrData is just informational, proceed to stdout processing
      }
      
      // If there was no stderrData, but the code is non-zero, it's an error
      if (code !== 0 && !stderrData) {
        return reject(new Error(`Python script ${scriptName} (operation: ${operation}) exited with code ${code}.`));
      }

      // Successful stdout processing (only if code is 0 or stderr was informational)
      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output for ${scriptName} - ${operation}: ${error.message}. Output: ${stdoutData.substring(0, 500)}...`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python script ${scriptName} for operation ${operation}: ${error.message}`));
    });

    // Python 스크립트에 operation과 args를 JSON 형태로 전달
    try {
      const inputPayload = JSON.stringify({ operation, args });
      pythonProcess.stdin.write(inputPayload);
      pythonProcess.stdin.end();
    } catch (error) {
      reject(new Error(`Failed to serialize input for Python script ${scriptName} - ${operation}: ${error.message}`));
    }
  });
}

// --- Public API 함수들 ---
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

export default {
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
};

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

// Python 스크립트가 있는 디렉토리 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptsDir = path.join(__dirname, "neo4jPythonModule");
const pythonExecutable = "python"; // 또는 "python3" 등 Python 실행 파일 경로

/**
 * Python 스크립트를 실행하고 결과를 반환하는 내부 함수
 * @param {string} scriptName 실행할 Python 스크립트 파일 이름 (예: "graph_operations.py")
 * @param {string} operation 수행할 작업 이름
 * @param {object} args Python 스크립트에 전달할 인자 객체
 * @returns {Promise<object>} Python 스크립트의 JSON 출력 결과
 */
function runPythonScript(scriptName, operation, args = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(pythonScriptsDir, scriptName);
    const pythonProcess = spawn(pythonExecutable, [scriptPath]);
    
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
  return runPythonScript("graph_operations.py", "testConnection");
  console.log("[neo4jAdapter] testConnection 호출됨 완료 ");
}

export async function deleteNode(nodeId) {
  return runPythonScript("graph_operations.py", "deleteNode", { nodeId });
}

export async function updateLabel(C_ID, newLabel) {
  return runPythonScript("graph_operations.py", "updateLabel", { C_ID, newLabel });
}

export async function mergeNode(from_C_ID, to_C_ID) {
  return runPythonScript("graph_operations.py", "mergeNode", { from_C_ID, to_C_ID });
}

export async function initializeGraphFromSQLite() {
  return runPythonScript("graph_operations.py", "initializeGraphFromSQLite");
}

export async function getIncomingNodes(node_name) {
  return runPythonScript("graph_operations.py", "getIncomingNodes", { node_name });
}

export async function deleteAllNodes() {
  return runPythonScript("graph_operations.py", "deleteAllNodes");
}

export async function moveComplexNode(a_id, b_id, c_id) {
  return runPythonScript("graph_operations.py", "moveComplexNode", { a_id, b_id, c_id });
}

export async function processAndEmbedMessages() {
  return runPythonScript("graph_operations.py", "processAndEmbedMessages");
}

export async function buildGraph() {
  return runPythonScript("graph_operations.py", "buildGraph"); // Python 스크립트의 operation 이름은 'buildGraph'
}

/**
 * 지정된 노드와 관련된 노드 정보를 가져옵니다.
 * @param {number} C_ID 중심 노드의 ID
 * @param {number} C_type 중심 노드의 타입 (0: Root, 1: Person, 2: Category, 3: Subcategory)
 * @param {number} IO_type 관계 방향 (1: incoming, 2: outgoing, 3: both)
 */
export async function fetchNodes(C_ID, C_type, IO_type) {
  return runPythonScript("graph_operations.py", "fetchNodes", { C_ID, C_type, IO_type });
}

/**
 * 지정된 조건에 맞는 이메일 정보를 가져옵니다.
 * @param {number} basic_C_ID 기준 노드의 ID
 * @param {number} C_type 기준 노드의 타입
 * @param {number} IO_type 관계 방향 (search_mail.py의 filter.io_type에 해당)
 * @param {object} [in_data] 추가 필터 데이터 (search_mail.py의 filter.in_data에 해당)
 */
export async function fetchEmails(basic_C_ID, C_type, IO_type, in_data = null) {
  return runPythonScript("graph_operations.py", "fetchEmails", { basic_C_ID, C_type, IO_type, in_data });
}

export default {
  testConnection,
  deleteNode,
  updateLabel,
  mergeNode,
  initializeGraphFromSQLite,
  getIncomingNodes,
  deleteAllNodes,
  moveComplexNode,
  processAndEmbedMessages,
  buildGraph,
  fetchNodes,
  fetchEmails,
};

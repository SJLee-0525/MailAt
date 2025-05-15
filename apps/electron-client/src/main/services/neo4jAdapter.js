import { spawn } from "child_process";
import path from "path";

// Python 스크립트가 있는 디렉토리 경로
// __dirname은 ES 모듈에서 직접 사용할 수 없으므로, 상대 경로를 사용하거나 path.dirname(import.meta.url) 등을 활용해야 합니다.
// 여기서는 main 프로세스 실행 위치를 기준으로 상대 경로를 설정합니다.
const pythonScriptsDir = path.join(process.cwd(), "src", "main", "services", "neo4jPythonModule");
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
        // Python 스크립트에서 오류 메시지를 stderr로 출력한 경우
        try {
          const errorResult = JSON.parse(stderrData);
          return reject(new Error(errorResult.message || `Python script error: ${stderrData.trim()}`));
        } catch (e) {
          return reject(new Error(`Python script error (stderr non-JSON): ${stderrData.trim()}`));
        }
      }
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}. Stderr: ${stderrData.trim()}`));
      }
      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output: ${error.message}. Output: ${stdoutData}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });

    // Python 스크립트에 operation과 args를 JSON 형태로 전달
    try {
      const inputPayload = JSON.stringify({ operation, args });
      pythonProcess.stdin.write(inputPayload);
      pythonProcess.stdin.end();
    } catch (error) {
      reject(new Error(`Failed to serialize input for Python script: ${error.message}`));
    }
  });
}

// --- Public API 함수들 ---

export async function testGraph() {
  return runPythonScript("graph_operations.py", "testConnection");
}

export async function readGraphData() {
  return runPythonScript("graph_operations.py", "readGraphData");
}

export async function createNode(nodeData) {
  return runPythonScript("graph_operations.py", "createNode", { nodeData });
}

export async function updateNode(nodeId, updateData) {
  return runPythonScript("graph_operations.py", "updateNode", { nodeId, updateData });
}

export async function deleteNode(nodeId) {
  return runPythonScript("graph_operations.py", "deleteNode", { nodeId });
}

export async function createRelationship(fromNodeId, toNodeId, relationshipType, properties) {
  return runPythonScript("graph_operations.py", "createRelationship", { fromNodeId, toNodeId, relationshipType, properties });
}

export async function deleteRelationship(relationshipId) {
  return runPythonScript("graph_operations.py", "deleteRelationship", { relationshipId });
}

export async function readNode(C_ID, C_type, IO_type) {
  return runPythonScript("graph_operations.py", "readNode", { C_ID, C_type, IO_type });
}

export async function readMessage(basic_C_ID, C_type, filter) {
  return runPythonScript("graph_operations.py", "readMessage", { basic_C_ID, C_type, filter });
}

export async function deleteMessage(message_C_ID, except_C_ID) {
  return runPythonScript("graph_operations.py", "deleteMessage", { message_C_ID, except_C_ID });
}

export async function updateLabel(C_ID, newLabel) {
  return runPythonScript("graph_operations.py", "updateLabel", { C_ID, newLabel });
}

export async function searchByKeyword(keyword) {
  return runPythonScript("graph_operations.py", "searchByKeyword", { keyword });
}

export async function mergeNode(from_C_ID, to_C_ID) {
  return runPythonScript("graph_operations.py", "mergeNode", { from_C_ID, to_C_ID });
}

export async function llmTagNode(C_ID, llm_tags) {
  return runPythonScript("graph_operations.py", "llmTagNode", { C_ID, llm_tags });
}

export default {
  readGraphData,
  createNode,
  updateNode,
  deleteNode,
  createRelationship,
  deleteRelationship,
  readNode,
  readMessage,
  deleteMessage,
  updateLabel,
  searchByKeyword,
  mergeNode,
  llmTagNode,
};

// src/main/utils/addons.js
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

// ESM에서 __dirname 흉내내기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// createRequire를 사용하여 require 함수 생성
const require = createRequire(import.meta.url);

// 변수를 먼저 선언 (초기값은 null)
let SmtpWrapper = null;
let ImapWrapper = null;
let Base64Wrapper = null;
let Bit7Wrapper = null;
let Bit8Wrapper = null;
let moduleExports = {};

// require로 네이티브 모듈 로드
const addonPath = path.join(
  __dirname,
  "../../../build/Release/mailio_addon.node"
);
try {
  console.log("현재 디렉토리:", process.cwd());
  console.log("__dirname:", __dirname);
  console.log("계산된 addon 경로:", addonPath);

  const addonModule = require(addonPath);
  console.log("네이티브 애드온 모듈 로드 성공");

  // 변수 값 설정
  SmtpWrapper = addonModule.SmtpWrapper;
  ImapWrapper = addonModule.ImapWrapper;
  Base64Wrapper = addonModule.Base64Wrapper;
  Bit7Wrapper = addonModule.Bit7Wrapper || null;
  Bit8Wrapper = addonModule.Bit8Wrapper;
  moduleExports = addonModule;
} catch (error) {
  console.error("애드온 로드 실패:", error.message);
  console.error("찾으려던 경로:", addonPath);
  // 변수는 이미 null로 초기화되어 있음
}

// 모든 변수를 한 번만 내보내기
export { SmtpWrapper, ImapWrapper, Base64Wrapper, Bit7Wrapper, Bit8Wrapper };
export default moduleExports;

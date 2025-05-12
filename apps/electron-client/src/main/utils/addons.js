// src/main/utils/addons.js
// 네이티브 애드온 ✅
import { createRequire } from "module";
import { fileURLToPath } from "url";

// Node.js 내장 모듈을 직접 가져오기
import * as path from "node:path";
import * as fs from "node:fs";

// ESM에서 __dirname 흉내내기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// createRequire를 사용하여 require 함수 생성
const require = createRequire(import.meta.url);

// 초간단 더미 구현
const createDummyWrapper = () => {
  function DummyWrapper() {}
  DummyWrapper.prototype.constructor = function () {};
  DummyWrapper.prototype.connect = () => Promise.resolve();
  DummyWrapper.prototype.send = () => Promise.resolve();
  DummyWrapper.prototype.disconnect = () => Promise.resolve();
  DummyWrapper.prototype.login = () => Promise.resolve({ success: true });
  DummyWrapper.prototype.fetchMessages = () => Promise.resolve([]);
  DummyWrapper.prototype.encode = (data) => data;
  DummyWrapper.prototype.decode = (data) => data;
  return DummyWrapper;
};

try {
  const sourcePath = path.join(
    process.cwd(),
    "build",
    "Release",
    "mailio_addon.node"
  );
  const targetPath = path.join(__dirname, "mailio_addon.node");
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`애드온 파일을 ${targetPath}로 복사했습니다.`);
  }
} catch (err) {
  console.error("애드온 파일 복사 중 오류:", err);
}

// 애드온을 로드하거나 더미 구현을 제공하는 함수
function loadAddon() {
  // 가능한 경로들
  const possiblePaths = [
    path.join(__dirname, "../../../addon/build/Release/mailio_addon.node"),
    path.join(__dirname, "mailio_addon.node"),
    path.join(process.cwd(), "build/Release/mailio_addon.node"),
    path.join(process.cwd(), "addon/build/Release/mailio_addon.node"),
    "C:/Users/SSAFY/Desktop/S12P31A204/apps/electron-client/addon/build/Release/mailio_addon.node",
  ];

  console.log("현재 디렉토리:", process.cwd());
  console.log("__dirname:", __dirname);
  console.log("네이티브 애드온 로드 시도 시작...");

  // 각 경로 시도
  for (const addonPath of possiblePaths) {
    try {
      console.log("애드온 경로 시도:", addonPath);

      // 파일 존재 여부 확인
      if (!fs.existsSync(addonPath)) {
        console.log(`${addonPath} 파일이 존재하지 않음. 다음 경로 시도...`);
        continue;
      }

      console.log(`${addonPath} 파일이 존재함. 로드 시도 중...`);

      // require를 별도의 try-catch로 보호
      let addonModule;
      try {
        addonModule = require(addonPath);
      } catch (requireError) {
        console.error("require 중 오류 발생:", requireError.message);
        console.log("손상된 애드온 파일. 다음 경로 시도...");
        continue;
      }

      console.log("네이티브 애드온 모듈 로드 성공:", addonPath);
      console.log("로드된 애드온 모듈 내용:", Object.keys(addonModule));

      // 각 래퍼 클래스 확인
      if (addonModule.SmtpWrapper) console.log("SmtpWrapper 클래스 로드됨 ✅");
      if (addonModule.ImapWrapper) console.log("ImapWrapper 클래스 로드됨 ✅");
      if (addonModule.Base64Wrapper)
        console.log("Base64Wrapper 클래스 로드됨 ✅");
      if (addonModule.Bit7Wrapper) console.log("Bit7Wrapper 클래스 로드됨 ✅");
      if (addonModule.Bit8Wrapper) console.log("Bit8Wrapper 클래스 로드됨 ✅");

      return {
        SmtpWrapper: addonModule.SmtpWrapper,
        ImapWrapper: addonModule.ImapWrapper,
        Base64Wrapper: addonModule.Base64Wrapper,
        Bit7Wrapper: addonModule.Bit7Wrapper || null,
        Bit8Wrapper: addonModule.Bit8Wrapper,
        isNative: true,
        modulePath: addonPath,
      };
    } catch (error) {
      console.log(`${addonPath} 로드 중 오류:`, error.message);
      console.log("오류 스택:", error.stack);
    }
  }

  // 모든 경로 시도 실패 - 더미 구현 반환
  console.warn("네이티브 애드온을 로드할 수 없어 더미 구현을 사용합니다.");
  return {
    SmtpWrapper: createDummyWrapper(),
    ImapWrapper: createDummyWrapper(),
    Base64Wrapper: createDummyWrapper(),
    Bit7Wrapper: createDummyWrapper(),
    Bit8Wrapper: createDummyWrapper(),
    isNative: false,
    modulePath: null,
  };
}

// 애드온 로드 (또는 더미 구현 가져오기)
console.log("애드온 로드 함수 호출 시작...");
const addon = loadAddon();
console.log("애드온 로드 함수 호출 완료!");

// 내보내기
export const SmtpWrapper = addon.SmtpWrapper;
export const ImapWrapper = addon.ImapWrapper;
export const Base64Wrapper = addon.Base64Wrapper;
export const Bit7Wrapper = addon.Bit7Wrapper;
export const Bit8Wrapper = addon.Bit8Wrapper;
export const isNativeAddonLoaded = addon.isNative;

// 디버깅 및 진단용 정보 출력
console.log(
  `네이티브 애드온 상태: ${addon.isNative ? "로드됨 ✅" : "더미 사용 ❌"}`
);
if (addon.modulePath) {
  console.log(`사용된 애드온 경로: ${addon.modulePath}`);
  console.log("네이티브 애드온이 성공적으로 로드되어 사용 중입니다! 🎉");
} else {
  console.log("더미 구현이 대신 사용됩니다. (네이티브 애드온 로드 실패)");
}

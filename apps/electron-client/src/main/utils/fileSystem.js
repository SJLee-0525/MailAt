// src/utils/fileSystem.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

// 애플리케이션 데이터 저장 기본 경로
const APP_DATA_PATH =
  process.env.APP_DATA_PATH || path.join(process.cwd(), "data");
const ATTACHMENTS_DIR = path.join(APP_DATA_PATH, "attachments");

/**
 * 첨부파일 저장 디렉토리 초기화
 */
export const initAttachmentsDir = () => {
  // 첨부파일 디렉토리가 없으면 생성
  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
    console.log(`첨부파일 디렉토리 생성: ${ATTACHMENTS_DIR}`);
  }
};

/**
 * 첨부파일 저장 경로 생성
 * @param {Number} accountId - 계정 ID
 * @param {String} messageId - 메시지 ID
 * @returns {String} 첨부파일 저장 디렉토리 경로
 */
export const getAttachmentDir = (accountId, messageId) => {
  // 메시지 ID에서 디렉토리 이름 생성 (해시 사용)
  const hash = crypto.createHash("md5").update(messageId).digest("hex");
  const dirPath = path.join(
    ATTACHMENTS_DIR,
    accountId.toString(),
    hash.substring(0, 2),
    hash.substring(2, 4)
  );

  // 디렉토리가 없으면 생성
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
};

/**
 * 첨부파일 저장
 * @param {Buffer} content - 파일 내용
 * @param {String} saveDir - 저장 디렉토리
 * @param {String} filename - 파일명
 * @returns {String} 저장된 파일 경로
 */
export const saveAttachment = (content, saveDir, filename) => {
  try {
    // 파일명 안전하게 처리
    const safeFilename = getSafeFilename(filename);

    // 중복 파일명 처리
    let finalFilename = safeFilename;
    let counter = 1;

    while (fs.existsSync(path.join(saveDir, finalFilename))) {
      const ext = path.extname(safeFilename);
      const baseName = path.basename(safeFilename, ext);
      finalFilename = `${baseName}_${counter}${ext}`;
      counter++;
    }

    const filePath = path.join(saveDir, finalFilename);
    fs.writeFileSync(filePath, content);

    return filePath;
  } catch (error) {
    console.error("첨부파일 저장 오류:", error);
    return null;
  }
};

/**
 * 안전한 파일명 생성
 * @param {String} filename - 원본 파일명
 * @returns {String} 안전한 파일명
 */
export const getSafeFilename = (filename) => {
  if (!filename) return `unnamed_${Date.now()}.bin`;

  // 특수문자 제거 및 길이 제한
  let safeName = filename.replace(/[\/\\:*?"<>|]/g, "_");

  // 파일명이 너무 길면 잘라내기
  if (safeName.length > 200) {
    const ext = path.extname(safeName);
    const baseName = path.basename(safeName, ext);
    safeName = `${baseName.substring(0, 190)}${ext}`;
  }

  return safeName;
};

/**
 * 첨부파일 읽기
 * @param {String} filePath - 파일 경로
 * @returns {Buffer|null} 파일 내용
 */
export const readAttachment = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`파일을 찾을 수 없습니다: ${filePath}`);
      return null;
    }

    return fs.readFileSync(filePath);
  } catch (error) {
    console.error("첨부파일 읽기 오류:", error);
    return null;
  }
};

// 모듈 초기화
initAttachmentsDir();

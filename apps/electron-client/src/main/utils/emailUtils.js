// src/utils/emailUtils.js
import crypto from 'crypto';
import mime from 'mime-types';
import fs from 'fs';

/**
 * MIME 타입 가져오기
 * @param {String} filename - 파일 이름
 * @returns {String} MIME 타입
 */
export const getMimeType = (filename) => {
  return mime.lookup(filename) || 'application/octet-stream';
};

/**
 * 멀티파트 이메일 경계 생성
 * @returns {String} 경계 문자열
 */
export const generateBoundary = () => {
  return `----=_Part_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Base64 인코딩
 * @param {Buffer} data - 인코딩할 데이터
 * @returns {String} Base64 인코딩된 문자열
 */
export const encodeBase64 = (data) => {
  if (Buffer.isBuffer(data)) {
    return data.toString('base64').replace(/.{76}/g, '$&\r\n');
  } else {
    return Buffer.from(data).toString('base64').replace(/.{76}/g, '$&\r\n');
  }
};

/**
 * 첨부 파일 형식 변환
 * @param {Array} attachments - 첨부 파일 배열
 * @returns {Promise<Array>} 처리된 첨부 파일 배열
 */
export const formatAttachments = async (attachments) => {
  if (!attachments || attachments.length === 0) return [];
  
  return Promise.all(attachments.map(async (file) => {
    try {
      // 파일 경로가 있는 경우 (일렉트론 환경)
      if (file.path) {
        const content = fs.readFileSync(file.path);
        return {
          filename: file.name,
          content,
          mimeType: file.type || getMimeType(file.name)
        };
      }
      
      // 웹 환경에서의 File 객체 처리 (사용하지 않을 가능성이 높음)
      else if (file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        const content = Buffer.from(arrayBuffer);
        return {
          filename: file.name,
          content,
          mimeType: file.type || getMimeType(file.name)
        };
      }
      
      // 이미 처리된 형태인 경우
      else if (file.content && file.filename) {
        return {
          filename: file.filename,
          content: Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content),
          mimeType: file.mimeType || getMimeType(file.filename)
        };
      }
      
      throw new Error(`지원되지 않는 첨부 파일 형식: ${JSON.stringify(file)}`);
      
    } catch (error) {
      console.error(`첨부 파일 처리 오류 (${file.name || 'unknown'}):`, error);
      throw error;
    }
  }));
};
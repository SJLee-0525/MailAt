// src/utils/emailUtils.js
import crypto from "crypto";
import mime from "mime-types";
import fs from "fs";

/**
 * MIME 타입 가져오기
 * @param {String} filename - 파일 이름
 * @returns {String} MIME 타입
 */
export const getMimeType = (filename) => {
  return mime.lookup(filename) || "application/octet-stream";
};

/**
 * 멀티파트 이메일 경계 생성
 * @returns {String} 경계 문자열
 */
export const generateBoundary = () => {
  return `----=_Part_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
};

/**
 * Base64 인코딩
 * @param {Buffer} data - 인코딩할 데이터
 * @returns {String} Base64 인코딩된 문자열
 */
export const encodeBase64 = (data) => {
  if (Buffer.isBuffer(data)) {
    return data.toString("base64").replace(/.{76}/g, "$&\r\n");
  } else {
    return Buffer.from(data).toString("base64").replace(/.{76}/g, "$&\r\n");
  }
};

/**
 * RFC 5322 형식의 원시 이메일 생성
 * @param {Object} emailData - 이메일 데이터
 * @returns {String} 원시 이메일 메시지
 */
export const createRawEmail = (emailData) => {
  const {
    accountInfo,
    to,
    cc,
    bcc,
    title,
    body,
    attachments,
    threadId,
    inReplyTo,
    references,
  } = emailData;

  // 멀티파트 경계 생성
  const boundary = generateBoundary();

  // 제목에 한글이 포함될 수 있으므로 Base64 인코딩 적용
  const encodedSubject = `=?UTF-8?B?${Buffer.from(title).toString("base64")}?=`;

  const encodedName = accountInfo.username ? 
  `=?UTF-8?B?${Buffer.from(accountInfo.username).toString('base64')}?=` : 
  accountInfo.email.split('@')[0];

  // 헤더 생성
  let headers = [
    `From: ${encodedName} <${accountInfo.email}>`,
    `To: ${to.map(email => `<${email}>`).join(", ")}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@${accountInfo.email.split("@")[1]}>`,
    `X-Mailer: Electron Mail Client`,
  ];

  console.log("생성된 이메일 헤더", headers);

  // CC가 있는 경우 추가
  if (cc && cc.length > 0) {
    headers.push(`Cc: ${cc.join(", ")}`);
  }

  // 스레드 관련 정보 추가
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }

  if (references && references.length > 0) {
    headers.push(`References: ${references.join(" ")}`);
  }

  // 헤더와 본문 구분을 위한 빈 줄 추가
  headers.push("");

  // HTML 본문을 Base64로 인코딩하여 처리
  const encodedBody = encodeBase64(body);

  // 본문 시작 - HTML 내용
  let bodyParts = [
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    encodedBody,
  ];

  // 첨부 파일 추가
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      bodyParts.push(
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        "",
        encodeBase64(attachment.content)
      );
    }
  }

  // 멀티파트 종료
  bodyParts.push(`--${boundary}--`);

  // 전체 메시지 조합 - 모든 줄바꿈을 CRLF로 통일
  return headers.join("\r\n") + "\r\n" + bodyParts.join("\r\n");
};

/**
 * 첨부 파일 형식 변환
 * @param {Array} attachments - 첨부 파일 배열
 * @returns {Promise<Array>} 처리된 첨부 파일 배열
 */
export const formatAttachments = async (attachments) => {
  if (!attachments || attachments.length === 0) return [];

  return Promise.all(
    attachments.map(async (file) => {
      try {
        // 파일 경로가 있는 경우 (일렉트론 환경)
        if (file.path) {
          const content = fs.readFileSync(file.path);
          return {
            filename: file.name,
            content,
            mimeType: file.type || getMimeType(file.name),
          };
        }

        // 웹 환경에서의 File 객체 처리 (사용하지 않을 가능성이 높음)
        else if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          const content = Buffer.from(arrayBuffer);
          return {
            filename: file.name,
            content,
            mimeType: file.type || getMimeType(file.name),
          };
        }

        // 이미 처리된 형태인 경우
        else if (file.content && file.filename) {
          return {
            filename: file.filename,
            content: Buffer.isBuffer(file.content)
              ? file.content
              : Buffer.from(file.content),
            mimeType: file.mimeType || getMimeType(file.filename),
          };
        }

        throw new Error(
          `지원되지 않는 첨부 파일 형식: ${JSON.stringify(file)}`
        );
      } catch (error) {
        console.error(
          `첨부 파일 처리 오류 (${file.name || "unknown"}):`,
          error
        );
        throw error;
      }
    })
  );
};

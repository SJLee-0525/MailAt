// src/utils/emailParser.js
import { simpleParser } from "mailparser";
import { getAttachmentDir, saveAttachment } from "./fileSystem.js";

/**
 * 원시 이메일 메시지 파싱 (mailparser 사용)
 * @param {String} rawMessage - 원시 이메일 메시지
 * @returns {Promise<Object>} 파싱된 이메일 데이터
 */
export const parseRawEmail = async (rawMessage, options = {}) => {
  try {
    const accountId = options.accountId;
    const parsed = await simpleParser(rawMessage, {
      skipHtmlToText: false,
      skipTextContent: false,
      skipTextLinks: false,
    });

    // 모든 이메일 참여자(contacts) 파싱
    const contacts = parseAllContacts(parsed);
    const externalMessageId = parsed.messageId || generateMessageId();

    // 첨부파일 파싱 및 저장 (accountId와 externalMessageId 전달)
    const attachments = await parseAttachments(parsed.attachments, {
      accountId,
      externalMessageId,
    });

    const emailData = {
      externalMessageId: parsed.messageId || generateMessageId(),
      threadId: extractThreadId(parsed),
      subject: parsed.subject || "(제목 없음)",
      fromEmail: parsed.from?.value[0]?.address || "unknown@email.com",
      fromName: parsed.from?.value[0]?.name || "",
      sentAt: parsed.date
        ? parsed.date.toISOString()
        : new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      bodyText: "",
      bodyHtml: parsed.html || convertTextToHtml(parsed.text) || "",
      snippet: generateSnippet(parsed.html || parsed.text),
      replyTo: parsed.replyTo?.value[0]?.address || null,
      inReplyTo: parsed.inReplyTo || null,
      referenceIds: extractReferenceIds(parsed),
      hasAttachments: attachments.length > 0,
      contacts: contacts, // recipients 대신 contacts 사용
      headers: parseHeaders(parsed.headers),
      attachments: attachments,
    };

    return emailData;
  } catch (error) {
    console.error("이메일 파싱 오류:", error);
    // 파싱 실패 시 기본값 반환
    return {
      externalMessageId: generateMessageId(),
      threadId: generateMessageId(),
      subject: "(파싱 실패)",
      fromEmail: "unknown@email.com",
      fromName: "Unknown",
      sentAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      bodyText: "",
      bodyHtml: `<p>이메일 파싱 중 오류가 발생했습니다: ${error.message}</p>`,
      snippet: `파싱 오류: ${error.message}`,
      recipients: [],
      headers: [],
      attachments: [],
      hasAttachments: false,
    };
  }
};

/**
 * 모든 이메일 참여자(보낸 사람, 받는 사람들) 파싱
 */
function parseAllContacts(parsed) {
  const contacts = [];

  // FROM (보낸 사람) 추가
  if (parsed.from && parsed.from.value) {
    parsed.from.value.forEach((addr) => {
      contacts.push({
        type: "FROM",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  // TO 수신자
  if (parsed.to && parsed.to.value) {
    parsed.to.value.forEach((addr) => {
      contacts.push({
        type: "TO",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  // CC 수신자
  if (parsed.cc && parsed.cc.value) {
    parsed.cc.value.forEach((addr) => {
      contacts.push({
        type: "CC",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  // BCC 수신자 (일반적으로 수신된 이메일에는 없음)
  if (parsed.bcc && parsed.bcc.value) {
    parsed.bcc.value.forEach((addr) => {
      contacts.push({
        type: "BCC",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  return contacts;
}

/**
 * 참조 ID 추출 (안전하게 처리)
 */
function extractReferenceIds(parsed) {
  if (!parsed.references) return null;

  // references가 문자열인 경우
  if (typeof parsed.references === "string") {
    return parsed.references;
  }

  // references가 배열인 경우
  if (Array.isArray(parsed.references)) {
    return parsed.references.join(" ");
  }

  return null;
}

/**
 * 수신자 정보 파싱
 */
function parseRecipients(parsed) {
  const recipients = [];

  // TO 수신자
  if (parsed.to && parsed.to.value) {
    parsed.to.value.forEach((addr) => {
      recipients.push({
        type: "TO",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  // CC 수신자
  if (parsed.cc && parsed.cc.value) {
    parsed.cc.value.forEach((addr) => {
      recipients.push({
        type: "CC",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  // BCC 수신자 (일반적으로 수신된 이메일에는 없음)
  if (parsed.bcc && parsed.bcc.value) {
    parsed.bcc.value.forEach((addr) => {
      recipients.push({
        type: "BCC",
        email: addr.address,
        name: addr.name || "",
      });
    });
  }

  return recipients;
}

/**
 * 헤더 정보 파싱
 */
function parseHeaders(headers) {
  const result = [];

  if (headers && headers instanceof Map) {
    for (const [name, value] of headers) {
      // 긴 헤더 값은 잘라냄
      const truncatedValue = Array.isArray(value)
        ? value.join(", ")
        : String(value);
      result.push({
        name: name,
        value:
          truncatedValue.length > 500
            ? truncatedValue.substring(0, 500) + "..."
            : truncatedValue,
      });
    }
  }

  return result;
}

/**
 * 첨부파일 정보 파싱
 * @param {Array} attachments - 첨부파일 목록
 * @param {Object} options - 옵션 (accountId, externalMessageId)
 * @returns {Promise<Array>} 첨부파일 정보 배열
 */
function parseAttachments(attachments, options = {}) {
  if (!attachments || attachments.length === 0) return [];

  const { accountId, externalMessageId } = options;
  const savedAttachments = [];

  // accountId 또는 externalMessageId가 없으면 메타데이터만 반환
  if (!accountId || !externalMessageId) {
    console.warn(
      "parseAttachments: accountId 또는 externalMessageId가 없습니다. 첨부파일을 저장하지 않습니다."
    );
    return attachments.map((att) => ({
      filename: att.filename || "unnamed",
      mimeType: att.contentType || "application/octet-stream",
      size: att.size || 0,
      path: null,
    }));
  }

  // 첨부파일 저장 디렉토리 경로
  const saveDir = getAttachmentDir(accountId, externalMessageId);

  for (const att of attachments) {
    try {
      const filename = att.filename || `unnamed_${Date.now()}.bin`;
      const mimeType = att.contentType || "application/octet-stream";
      const size = att.size || 0;

      // 첨부파일 실제 내용
      const content = att.content || Buffer.from([]);

      // 파일시스템에 저장
      const filePath = saveAttachment(content, saveDir, filename);

      savedAttachments.push({
        filename,
        mimeType,
        size,
        path: filePath, // 실제 파일 경로 저장
      });

      console.log(
        `첨부파일 저장 성공: ${filename} (${size} bytes) -> ${filePath}`
      );
    } catch (error) {
      onsole.error(`첨부파일 저장 오류 (${att.filename}):`, error);

      // 에러가 발생해도 메타데이터는 저장
      savedAttachments.push({
        filename: att.filename || "unnamed",
        mimeType: att.contentType || "application/octet-stream",
        size: att.size || 0,
        path: null,
      });
    }
  }

  return savedAttachments;
}

/**
 * 스레드 ID 추출
 */
function extractThreadId(parsed) {
  if (parsed.inReplyTo) return parsed.inReplyTo;
  if (parsed.references) {
    if (Array.isArray(parsed.references) && parsed.references.length > 0) {
      return parsed.references[0];
    } else if (typeof parsed.references === "string") {
      // references가 문자열인 경우 첫 번째 ID만 추출
      const firstRef = parsed.references.split(" ")[0];
      return firstRef || parsed.messageId || generateMessageId();
    }
  }
  return parsed.messageId || generateMessageId();
}

/**
 * 텍스트를 HTML로 변환
 */
function convertTextToHtml(text) {
  if (!text) return "";

  // 특수 문자 이스케이프
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // 줄바꿈을 <br>로 변환하고 단락을 <p>로 감싸기
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
}

/**
 * 스니펫 생성
 */
function generateSnippet(content) {
  if (!content) return "";

  // HTML 태그 제거
  const textOnly = content.replace(/<[^>]*>/g, " ");

  // 공백 정리
  const cleaned = textOnly.replace(/\s+/g, " ").trim();

  // 앞 150자만 추출
  return cleaned.substring(0, 150) + (cleaned.length > 150 ? "..." : "");
}

/**
 * 메시지 ID 생성
 */
function generateMessageId() {
  return `<${Date.now()}.${Math.random().toString(36).substring(2)}@electron.mail>`;
}

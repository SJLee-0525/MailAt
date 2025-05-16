// src/services/imapService.js
import { ImapWrapper } from "../utils/addons.js";
import accountRepository from "../repositories/accountRepository.js";
import messageRepository from "../repositories/messageRepository.js";
import folderRepository from "../repositories/folderRepository.js";
import { parseRawEmail } from "../utils/emailParser.js";
import calendarService from "./calendarService.js";

/**
 * IMAP 서버 인증 테스트
 * @param {Object} config - 연결 설정 (host, port, username, password)
 * @returns {Promise<Object>} 테스트 결과
 */
export const testImapAuthentication = async (config) => {
  try {
    const { host, port, username, password } = config;

    // IMAP 래퍼 인스턴스 생성
    const imap = new ImapWrapper(host, port);

    // 인증 시도 - 성공하지 않으면 예외 발생
    const result = imap.authenticate(username, password);

    return {
      success: true,
      message: "인증 성공",
      result,
    };
  } catch (error) {
    console.error("IMAP 인증 오류:", error);

    // 오류 유형에 따른 메시지 구분
    let errorMessage = error.message;
    if (
      errorMessage.includes("authentication failed") ||
      errorMessage.includes("invalid credentials")
    ) {
      errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
    } else if (
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      errorMessage =
        "IMAP 서버 연결에 실패했습니다. 네트워크 상태와 서버 설정을 확인하세요.";
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
    };
  }
};

/**
 * 안전하게 메시지 가져오기 (최적화된 전략)
 * @param {ImapWrapper} imap - IMAP 인스턴스
 * @param {String} mailbox - 메일박스 이름
 * @param {Number} seq - 시퀀스 번호
 * @param {Number} totalMessages - 전체 메시지 수
 * @returns {Promise<Object>} { success, data, error }
 */
const fetchMessageSafely = async (imap, mailbox, seq, totalMessages) => {
  console.log(`시퀀스 ${seq} 가져오기 시도 (전체: ${totalMessages})`);

  // 메시지가 실제로 존재하는지 먼저 확인
  if (seq < 1 || seq > totalMessages) {
    console.log(`시퀀스 ${seq}는 범위를 벗어남 (1-${totalMessages})`);
    return { success: false, error: "시퀀스 번호가 범위를 벗어남" };
  }

  // 전략 배열 - 가장 가능성 높은 순서로 정렬
  const strategies = [
    { desc: "기본 시퀀스", value: seq },
    { desc: "0-기반 인덱스", value: seq - 1 },
  ];

  // 특정 시퀀스에 대한 특별 처리
  if (seq === totalMessages) {
    // 마지막 메시지는 다른 전략이 필요할 수 있음
    strategies.push(
      { desc: "마지막 메시지 특별 처리", value: totalMessages - 1 },
      { desc: "역순 첫 번째", value: 0 }
    );
  }

  for (const strategy of strategies) {
    try {
      // 인덱스가 유효한 범위인지 확인
      if (strategy.value < 0) {
        console.log(`${strategy.desc}: 음수 인덱스 스킵 (${strategy.value})`);
        continue;
      }

      console.log(`${strategy.desc} 시도: ${strategy.value}`);
      const rawMessage = imap.fetchOne(mailbox, strategy.value);

      if (rawMessage && rawMessage.length > 0) {
        console.log(
          `${strategy.desc} 성공! (크기: ${rawMessage.length} bytes)`
        );
        return { success: true, data: rawMessage };
      } else {
        console.log(`${strategy.desc}: 빈 메시지`);
      }
    } catch (error) {
      console.log(`${strategy.desc} 실패: ${error.message}`);

      // 특정 에러 유형에 대한 처리
      if (error.message.includes("invalid vector subscript")) {
        // 인덱스 에러는 다음 전략 시도
        continue;
      } else if (error.message.includes("Fetching message failure")) {
        // 메시지가 실제로 없을 수 있음
        if (strategy.value === 0) {
          console.log("메시지가 실제로 존재하지 않을 수 있음");
          return { success: false, error: "메시지가 존재하지 않음" };
        }
        continue;
      } else {
        // 다른 에러는 즉시 반환
        return { success: false, error: error.message };
      }
    }
  }

  return {
    success: false,
    error: "모든 인덱싱 전략 실패",
  };
};

/**
 * IMAP 서버의 인덱싱 방식 자동 감지
 * @param {ImapWrapper} imap - IMAP 인스턴스
 * @param {String} mailbox - 메일박스 이름
 * @returns {Object} { indexingType, quirks }
 */
const detectImapIndexing = (imap, mailbox) => {
  try {
    const selectResult = imap.select(mailbox);
    const total = selectResult.messages_no;

    const quirks = [];
    let indexingType = "1-based"; // 기본값

    // 첫 번째 메시지 테스트
    try {
      imap.fetchOne(mailbox, 1);
    } catch (e) {
      try {
        imap.fetchOne(mailbox, 0);
        indexingType = "0-based";
      } catch (e2) {
        quirks.push("first-message-issue");
      }
    }

    // 마지막 메시지 테스트
    try {
      imap.fetchOne(mailbox, total);
    } catch (e) {
      try {
        imap.fetchOne(mailbox, total - 1);
        quirks.push("last-message-needs-decrement");
      } catch (e2) {
        quirks.push("last-message-inaccessible");
      }
    }

    // 특정 문제 시퀀스 검사
    const problemSequences = [];

    // 중간 지점 몇 개 테스트
    const testPoints = [
      Math.floor(total * 0.25),
      Math.floor(total * 0.5),
      Math.floor(total * 0.75),
    ];

    for (const seq of testPoints) {
      try {
        imap.fetchOne(mailbox, seq);
      } catch (e) {
        try {
          imap.fetchOne(mailbox, seq - 1);
          problemSequences.push(seq);
        } catch (e2) {
          // 둘 다 실패
        }
      }
    }

    if (problemSequences.length > 0) {
      quirks.push(`problem-sequences: ${problemSequences.join(",")}`);
    }

    return {
      indexingType,
      quirks,
      totalMessages: total,
    };
  } catch (error) {
    console.error("IMAP 인덱싱 감지 실패:", error);
    return {
      indexingType: "unknown",
      quirks: ["detection-failed"],
      error: error.message,
    };
  }
};

/**
 * 메시지 정보 디버깅
 * @param {ImapWrapper} imap - IMAP 인스턴스
 * @param {String} mailbox - 메일박스 이름
 * @param {Number} totalMessages - 전체 메시지 수
 */
const debugMessageInfo = (imap, mailbox, totalMessages) => {
  console.log("\n=== IMAP 메시지 정보 디버깅 ===");
  console.log(`메일박스: ${mailbox}`);
  console.log(`총 메시지 수: ${totalMessages}`);

  // 처음 몇 개와 마지막 몇 개 메시지만 테스트
  const testSequences = [
    1,
    2,
    3,
    totalMessages - 2,
    totalMessages - 1,
    totalMessages,
  ];

  for (const seq of testSequences) {
    if (seq < 1 || seq > totalMessages) continue;

    try {
      const exists = imap.fetchOne(mailbox, seq) ? "존재" : "없음";
      console.log(`시퀀스 ${seq}: ${exists}`);
    } catch (error) {
      console.log(`시퀀스 ${seq}: 에러 - ${error.message}`);
    }
  }
  console.log("=========================\n");
};

/**
 * 최신 이메일 동기화 (모든 중요 폴더에서)
 * @param {Number} accountId - 계정 ID
 * @returns {Promise<Object>} 동기화 결과
 */
export const syncLatestEmails = async (accountId) => {
  try {
    // INBOX와 Sent 폴더에서 최신 메시지 가져오기
    const result = await syncAllFolders(accountId, {
      folderTypes: ["inbox", "sent"],
      messageLimit: 10,
      skipEmpty: true,
    });

    return result;
  } catch (error) {
    console.error("최신 이메일 동기화 오류:", error);
    throw new Error(`최신 이메일 동기화 실패: ${error.message}`);
  }
};

/**
 * 특정 폴더 동기화
 * @param {Number} accountId - 계정 ID
 * @param {String} folderName - 폴더 이름
 * @param {Number} limit - 가져올 메시지 개수 제한
 * @returns {Promise<Object>} 동기화 결과
 */
export const syncFolder = async (
  accountId,
  folderName = "INBOX",
  limit = 50
) => {
  let imap = null;

  try {
    // 계정 정보 조회
    const accountInfo = await accountRepository.getAccountById(accountId);
    if (!accountInfo) {
      throw new Error(`계정 ID(${accountId})를 찾을 수 없습니다.`);
    }

    // IMAP 연결 및 인증
    imap = new ImapWrapper(accountInfo.imapHost, accountInfo.imapPort);
    imap.authenticate(accountInfo.email, accountInfo.password);

    // 폴더 선택
    const selectResult = imap.select(folderName);
    console.log(`Selected folder ${folderName}:`, selectResult);

    // 폴더 정보 DB에 저장/업데이트
    const folderId = await folderRepository.getOrCreateFolder(
      accountId,
      folderName
    );

    // 폴더 메타데이터 업데이트
    await folderRepository.updateFolderMetadata({
      folderId,
      uidNext: selectResult.uid_next,
      uidValidity: selectResult.uid_validity,
      messagesTotal: selectResult.messages_no,
      messagesRecent: selectResult.messages_recent,
      messagesUnseen: selectResult.messages_unseen,
    });

    // 동기화할 메시지 범위 계산
    const totalMessages = selectResult.messages_no;
    if (!totalMessages || totalMessages === 0) {
      return {
        success: true,
        syncedCount: 0,
        folderName,
        message: "폴더가 비어있습니다.",
      };
    }

    const startSeq = Math.max(1, totalMessages - limit + 1);
    const endSeq = totalMessages;

    console.log(
      `폴더 ${folderName} 동기화: ${startSeq}-${endSeq} (전체: ${totalMessages})`
    );

    let syncedCount = 0;
    const errors = [];
    const skippedMessages = [];

    // 메시지 가져오기 및 저장
    for (let seq = endSeq; seq >= startSeq; seq--) {
      try {
        // 안전하게 메시지 가져오기
        const fetchResult = await fetchMessageSafely(
          imap,
          folderName,
          seq,
          totalMessages
        );

        if (!fetchResult.success) {
          errors.push({
            seq,
            error: fetchResult.error,
            action: "fetch_failed",
          });
          skippedMessages.push(seq);
          continue;
        }

        const rawMessage = fetchResult.data;

        if (!rawMessage || rawMessage.length === 0) {
          skippedMessages.push(seq);
          continue;
        }

        const parsedEmail = await parseRawEmail(rawMessage);
        parsedEmail.uid = seq.toString();

        const messageData = {
          ...parsedEmail,
          accountId,
          folderId,
          isRead: false,
          isFlagged: false,
        };

        const savedMessageResult = await messageRepository.saveMessage(messageData);
        syncedCount++;

        // 메시지 저장 완료되었다면 캘린더 서비스 호출
        if (savedMessageResult && savedMessageResult.messageId) {
          console.log(`[ImapService] Message saved: ID ${savedMessageResult.messageId}, UID ${parsedEmail.uid}`);

          const emailBodyForCalendar = savedMessageResult.bodyText;
          if (emailBodyForCalendar && emailBodyForCalendar.trim() !== "") {
            calendarService.processNewEmailForCalendar({
              messageId: savedMessageResult.messageId,
              accountId: accountId,
              emailBody: emailBodyForCalendar,
            }).catch(calendarError => {
              console.error(`[ImapService] MessageID: ${savedMessageResult.messageId}, UID: ${parsedEmail.uid} - 캘린더 처리 중 오류 (동기화는 계속):`, calendarError.message);

              errors.push({ 
                seq, 
                uid: parsedEmail.uid, 
                messageId: savedMessageResult.messageId, 
                error: `CalendarService Error: ${calendarError.message}`, 
                action: "calendar_process_error" 
              });
            });
          } else {
            console.log(`[ImapService] MessageID: ${savedMessageResult.messageId}, UID: ${parsedEmail.uid} - 캘린더 처리를 위한 이메일 본문이 없습니다.`);
          } 
        } else {
          console.log(`[ImapService] MessageID: ${savedMessageResult.messageId} - 메시지 저장 실패`);
          errors.push({ 
            seq, 
            uid: parsedEmail.uid, 
            error: "Message save failed", 
            action: "message_save_error" 
          });
        }



      } catch (error) {
        errors.push({
          seq,
          error: error.message,
          action: "process_error",
        });
      }
    }

    return {
      success: true,
      syncedCount,
      totalProcessed: endSeq - startSeq + 1,
      totalMessages,
      folderName,
      folderId,
      errors,
      skippedMessages,
    };
  } catch (error) {
    console.error("폴더 동기화 오류:", error);
    throw new Error(`폴더 동기화 실패: ${error.message}`);
  } finally {
    imap = null;
  }
};

/**
 * IMAP 메시지 범위 확인 (디버깅용)
 * @param {ImapWrapper} imap - IMAP 인스턴스
 * @param {String} mailbox - 메일박스 이름
 * @returns {Promise<Object>} 메시지 범위 정보
 */
const checkMessageRange = async (imap, mailbox) => {
  try {
    const selectResult = imap.select(mailbox);
    const total = selectResult.messages_no;

    // 실제 접근 가능한 메시지 범위 확인
    let firstValid = null;
    let lastValid = null;

    // 앞에서부터 확인
    for (let i = 0; i < Math.min(10, total); i++) {
      try {
        imap.fetchOne(mailbox, i);
        firstValid = i;
        break;
      } catch (e) {
        continue;
      }
    }

    // 뒤에서부터 확인
    for (let i = total - 1; i >= Math.max(0, total - 10); i--) {
      try {
        imap.fetchOne(mailbox, i);
        lastValid = i;
        break;
      } catch (e) {
        continue;
      }
    }

    return {
      total,
      firstValid,
      lastValid,
      indexingType: firstValid === 0 ? "0-based" : "1-based",
    };
  } catch (error) {
    console.error("메시지 범위 확인 실패:", error);
    return null;
  }
};

/**
 * IMAP 서버의 모든 폴더 목록 가져오기
 * @param {Number} accountId - 계정 ID
 * @returns {Promise<Array>} 폴더 목록
 */
export const listAllFolders = async (accountId) => {
  let imap = null;

  try {
    // 계정 정보 조회
    const accountInfo = await accountRepository.getAccountById(accountId);
    if (!accountInfo) {
      throw new Error(`계정 ID(${accountId})를 찾을 수 없습니다.`);
    }

    // IMAP 연결 및 인증
    imap = new ImapWrapper(accountInfo.imapHost, accountInfo.imapPort);
    imap.authenticate(accountInfo.email, accountInfo.password);

    // 폴더 목록 가져오기 (트리 구조)
    const foldersTree = imap.listFolders("*");
    console.log(
      "Folders tree structure:",
      JSON.stringify(foldersTree, null, 2)
    );

    // 폴더 구분자 가져오기
    let delimiter = "/";
    try {
      delimiter = imap.folderDelimiter();
      console.log("Folder delimiter:", delimiter);
    } catch (e) {
      console.log(
        "Failed to get folder delimiter, using default '/':",
        e.message
      );
    }

    // 트리 구조를 평면 배열로 변환
    const folderList = flattenFolderTree(foldersTree, "", delimiter);

    console.log("Flattened folder list:", folderList);

    // DB에 폴더 정보 저장/업데이트
    for (const folder of folderList) {
      if (folder.canHoldMessages) {
        try {
          await folderRepository.upsertFolder({
            accountId,
            name: folder.name,
            path: folder.path,
            type: folder.type,
            flags: Array.isArray(folder.flags) ? folder.flags.join(",") : "",
          });
        } catch (dbError) {
          console.error(`폴더 ${folder.name} DB 저장 오류:`, dbError);
        }
      }
    }

    return folderList.filter((f) => f.canHoldMessages);
  } catch (error) {
    console.error("폴더 목록 조회 오류:", error);
    throw new Error(`폴더 목록 조회 실패: ${error.message}`);
  } finally {
    imap = null;
  }
};

/**
 * 트리 구조의 폴더를 평면 배열로 변환
 * @param {Object} tree - 폴더 트리
 * @param {String} parentPath - 부모 경로
 * @param {String} delimiter - 폴더 구분자
 * @returns {Array} 평면화된 폴더 배열
 */
const flattenFolderTree = (tree, parentPath = "", delimiter = "/") => {
  const folders = [];

  for (const [folderName, subfolders] of Object.entries(tree)) {
    // 전체 경로 생성
    const fullPath = parentPath
      ? `${parentPath}${delimiter}${folderName}`
      : folderName;

    // 현재 폴더 추가
    const folder = {
      name: folderName,
      path: fullPath,
      delimiter: delimiter,
      flags: [], // IMAP 플래그 정보가 없으므로 빈 배열
      canHoldMessages: true,
      isSpecial: isSpecialFolder(folderName, fullPath),
      type: detectFolderType(folderName, [], fullPath),
    };

    folders.push(folder);

    // 하위 폴더가 있는 경우 재귀적으로 처리
    if (
      subfolders &&
      typeof subfolders === "object" &&
      Object.keys(subfolders).length > 0
    ) {
      const subFolderList = flattenFolderTree(subfolders, fullPath, delimiter);
      folders.push(...subFolderList);
    }
  }

  return folders;
};

/**
 * 특별 폴더 여부 확인
 * @param {String} folderName - 폴더 이름
 * @param {String} fullPath - 전체 경로
 * @returns {Boolean} 특별 폴더 여부
 */
const isSpecialFolder = (folderName, fullPath) => {
  const specialNames = ["INBOX", "Sent", "Drafts", "Trash", "Spam", "Junk"];
  return (
    specialNames.includes(folderName) ||
    fullPath.includes("[Gmail]") ||
    fullPath.includes("[Notion]")
  );
};

/**
 * 폴더 타입 감지
 * @param {String} folderName - 폴더 이름
 * @param {Array} flags - IMAP 플래그
 * @param {String} fullPath - 전체 경로
 * @returns {String} 폴더 타입
 */
const detectFolderType = (folderName, flags = [], fullPath = "") => {
  // 플래그로 판단
  if (Array.isArray(flags) && flags.length > 0) {
    if (flags.includes("\\Inbox")) return "inbox";
    if (flags.includes("\\Sent")) return "sent";
    if (flags.includes("\\Drafts")) return "drafts";
    if (flags.includes("\\Trash")) return "trash";
    if (flags.includes("\\Spam") || flags.includes("\\Junk")) return "spam";
  }

  // 이름으로 추측
  const lowerName = folderName.toLowerCase();
  const lowerPath = fullPath.toLowerCase();

  if (folderName === "INBOX" || lowerName === "inbox") return "inbox";

  // Gmail 특수 폴더 처리 (Modified UTF-7 디코딩된 이름들)
  const gmailFolderMappings = {
    "&1zTJwNG1-": "starred", // 별표편지함
    "&vMTUXNO4ycDVaA-": "all", // 전체메일
    "&vPSwuNO4ycDVaA-": "trash", // 휴지통
    "&wqTTONVo-": "drafts", // 임시보관함
    "&x4TC3Lz0rQDVaA-": "sent", // 보낸편지함
    "&yATMtLz0rQDVaA-": "important", // 중요
    "&yRHGlA-": "spam", // 스팸함
  };

  if (gmailFolderMappings[folderName]) {
    return gmailFolderMappings[folderName];
  }

  // 일반적인 이름 패턴 매칭
  if (lowerPath.includes("sent") || lowerPath.includes("보낸")) return "sent";
  if (lowerPath.includes("draft") || lowerPath.includes("임시"))
    return "drafts";
  if (
    lowerPath.includes("trash") ||
    lowerPath.includes("휴지통") ||
    lowerPath.includes("deleted")
  )
    return "trash";
  if (
    lowerPath.includes("spam") ||
    lowerPath.includes("junk") ||
    lowerPath.includes("스팸")
  )
    return "spam";
  if (lowerPath.includes("archive") || lowerPath.includes("보관"))
    return "archive";
  if (lowerPath.includes("starred") || lowerPath.includes("별표"))
    return "starred";
  if (lowerPath.includes("important") || lowerPath.includes("중요"))
    return "important";

  return "custom";
};

/**
 * 동기화가 필요한 폴더인지 확인
 * @param {Object} folder - 폴더 정보
 * @returns {Boolean} 동기화 필요 여부
 */
const shouldSyncFolder = (folder) => {
  // Gmail 가상 폴더들은 제외
  const excludedFolders = [
    "[Gmail]/&vMTUXNO4ycDVaA-",
    "[Gmail]/&yATMtLz0rQDVaA-",
  ]; // 전체메일, 중요

  if (excludedFolders.includes(folder.path)) {
    return false;
  }

  // 기본적으로 모든 폴더 동기화
  return true;
};

/**
 * 모든 폴더 동기화
 * @param {Number} accountId - 계정 ID
 * @param {Object} options - 옵션
 * @returns {Promise<Object>} 동기화 결과
 */
export const syncAllFolders = async (accountId, options = {}) => {
  const {
    folderTypes = ["inbox", "sent", "drafts"], // 기본적으로 동기화할 폴더 타입
    messageLimit = 50, // 폴더당 가져올 메시지 수
    skipEmpty = true, // 빈 폴더 건너뛰기
  } = options;

  try {
    // 모든 폴더 목록 가져오기
    let folders;
    try {
      folders = await listAllFolders(accountId);
    } catch (listError) {
      console.error("폴더 목록 가져오기 실패:", listError);
      // 폴더 목록을 가져오지 못한 경우 기본 폴더만 시도
      folders = [{ name: "INBOX", path: "INBOX", type: "inbox" }];
    }

    const results = {
      success: true,
      folderCount: 0,
      totalMessages: 0,
      errors: [],
      folderResults: [],
    };

    // 선택된 타입의 폴더만 필터링
    let targetFolders = folders;
    if (!folderTypes.includes("all")) {
      targetFolders = folders.filter(
        (folder) =>
          folderTypes.includes(folder.type) && shouldSyncFolder(folder)
      );
    }

    console.log(
      "Target folders for sync:",
      targetFolders.map((f) => f.path)
    );

    for (const folder of targetFolders) {
      try {
        console.log(`폴더 동기화 시작: ${folder.path} (${folder.type})`);

        const syncResult = await syncFolder(
          accountId,
          folder.path, // name 대신 path 사용
          messageLimit
        );

        if (!skipEmpty || syncResult.syncedCount > 0) {
          results.folderCount++;
          results.totalMessages += syncResult.syncedCount;
          results.folderResults.push({
            folderName: folder.name,
            folderPath: folder.path,
            folderType: folder.type,
            ...syncResult,
          });
        }
      } catch (error) {
        console.error(`폴더 ${folder.path} 동기화 오류:`, error);
        results.errors.push({
          folder: folder.path,
          error: error.message,
        });
      }
    }

    results.message = `${results.folderCount}개 폴더에서 ${results.totalMessages}개 메시지 동기화`;
    return results;
  } catch (error) {
    console.error("전체 폴더 동기화 오류:", error);
    throw new Error(`전체 폴더 동기화 실패: ${error.message}`);
  }
};

// src/services/imapService.js
import { ImapWrapper } from "../utils/addons.js";
import accountRepository from "../repositories/accountRepository.js";
import messageRepository from "../repositories/messageRepository.js";
import folderRepository from "../repositories/folderRepository.js";
import { parseRawEmail } from "../utils/emailParser.js";
import calendarService from "./calendarService.js";
import syncManager from "../utils/syncManager.js";
import { updateGraphDBInBackground } from "../utils/graphUtills.js";

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

    const totalSyncedCount = result.totalMessages || 0;
    updateGraphDBInBackground(totalSyncedCount);

    return result;
  } catch (error) {
    console.error("최신 이메일 동기화 오류:", error);
    throw new Error(`최신 이메일 동기화 실패: ${error.message}`);
  }
};

/**
 * 특정 폴더 동기화 (UID 기반)
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
    // 폴더 동기화 잠금 획득
    await syncManager.acquireLock(accountId, folderName);
    console.log(`[SYNC] ${folderName} 폴더 동기화 시작 (잠금 획득)`);

    // 계정 정보 조회
    const accountInfo = await accountRepository.getAccountById(accountId);
    if (!accountInfo) {
      throw new Error(`계정 ID(${accountId})를 찾을 수 없습니다.`);
    }

    // 폴더 ID 조회 또는 생성
    const folderId = await folderRepository.getOrCreateFolder(
      accountId,
      folderName
    );

    // 기존 UID 목록 조회 - 메모리에 저장하여 비교 속도 개선
    const existingUidsResult = await messageRepository.getExistingUids(
      accountId,
      folderId
    );
    const existingUidsSet = new Set(existingUidsResult);

    console.log(
      `[SYNC] 폴더 ${folderName}의 기존 UID 개수: ${existingUidsSet.size}`
    );

    // IMAP 연결 및 인증
    imap = new ImapWrapper(accountInfo.imapHost, accountInfo.imapPort);
    imap.authenticate(accountInfo.email, accountInfo.password);

    // 폴더 선택 및 정보 가져오기
    try {
      const selectResult = imap.select(folderName);
      console.log(`[SYNC] 폴더 ${folderName} 선택:`, selectResult);

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

      // UID 목록 가져오기
      const uids = imap.searchAll(folderName);
      console.log(`[SYNC] searchAll 결과 UID 수: ${uids.length}`);

      if (!uids || uids.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          folderName,
          message: "가져올 UID가 없습니다.",
        };
      }

      // UID 오름차순 정렬 (오래된 순)
      const sortedUids = [...uids].sort((a, b) => b - a);

      // 최신 limit개만 선택
      const latestUids = sortedUids.slice(0, limit);

      // 이미 존재하는 UID 필터링
      const newUids = latestUids.filter(
        (uid) => !existingUidsSet.has(uid.toString())
      );
      console.log(
        `[SYNC] 처리할 새로운 UID ${newUids.length}개, 최신 UID ${latestUids.length}개`
      );

      // 중요: 가져온 UID를 오래된 순서로 다시 정렬하여 처리
      // 이렇게 하면 오래된 메시지가 작은 message_id를 갖게 됨
      const orderedNewUids = [...newUids].sort((a, b) => a - b);

      let syncedCount = 0;
      const errors = [];
      const skippedMessages = [];

      // 오래된 순서대로 처리
      for (const uid of orderedNewUids) {
        try {
          console.log(`[SYNC] UID ${uid} 처리 중...`);
          const rawMessage = imap.fetchByUid(folderName, uid);

          if (!rawMessage || rawMessage.length === 0) {
            console.log(`[SYNC] UID ${uid} 메시지 빈 내용`);
            skippedMessages.push({ uid, reason: "empty_content" });
            continue;
          }

          const parsedEmail = await parseRawEmail(rawMessage, { accountId });
          parsedEmail.uid = uid.toString();

          // 메시지 저장
          const messageData = {
            ...parsedEmail,
            accountId,
            folderId,
            isRead: false,
            isFlagged: false,
          };

          // 다시 한번 UID 중복 체크
          const existingMessage = await messageRepository.findMessageByUid(
            accountId,
            folderId,
            uid.toString()
          );

          if (existingMessage) {
            console.log(`[SYNC] UID ${uid} 이미 존재하므로 건너뜁니다.`);
            continue;
          }

          try {
            const savedMessageResult =
              await messageRepository.saveMessage(messageData);
            syncedCount++;
            console.log(
              `[SYNC] UID ${uid} 저장 성공 (ID: ${savedMessageResult.messageId})`
            );

            // 캘린더 연동
            if (savedMessageResult && savedMessageResult.messageId) {
              handleCalendarIntegrationAfterSave(
                savedMessageResult,
                accountId,
                parsedEmail,
                errors,
                uid
              );
            }
          } catch (saveError) {
            console.error(`[SYNC] UID ${uid} 저장 실패:`, saveError.message);
            errors.push({
              uid,
              error: saveError.message,
              action: "message_save_error",
            });
          }
        } catch (fetchError) {
          console.error(`[SYNC] UID ${uid} 가져오기 실패:`, fetchError.message);
          errors.push({
            uid,
            error: fetchError.message,
            action: "fetch_by_uid_failed",
          });
        }
      }

      if (syncedCount > 0) {
      updateGraphDBInBackground(syncedCount);
    }

      return {
        success: true,
        syncedCount,
        totalAvailable: totalMessages,
        processedCount: newUids.length,
        skippedCount: latestUids.length - newUids.length,
        folderName,
        folderId,
        errors: errors.length > 0 ? errors : undefined,
        skippedMessages:
          skippedMessages.length > 0 ? skippedMessages : undefined,
      };
    } catch (selectError) {
      console.error(`[SYNC] 폴더 '${folderName}' 선택 오류:`, selectError);
      throw new Error(`폴더 선택 실패: ${selectError.message}`);
    }
  } catch (error) {
    console.error("[SYNC] 폴더 동기화 오류:", error);
    throw new Error(`폴더 동기화 실패: ${error.message}`);
  } finally {
    // 자원 정리
    imap = null;

    // 폴더 동기화 잠금 해제
    syncManager.releaseLock(accountId, folderName);
    console.log(`[SYNC] ${folderName} 폴더 동기화 완료 (잠금 해제)`);
  }
};

/**
 * 메시지 저장 후 캘린더 통합 처리 (백그라운드 실행)
 * @param {Object} savedMessageResult - 저장된 메시지 결과
 * @param {Number} accountId - 계정 ID
 * @param {Object} parsedEmail - 파싱된 이메일 객체 (UID 포함)
 * @param {Array} errors - 에러 수집 배열 (이 함수에서 직접 사용하지 않거나, 다른 방식으로 오류를 보고할 수 있음)
 * @param {Number|String} seq - 시퀀스 번호 또는 고유 식별자 (에러 로깅용)
 */
const handleCalendarIntegrationAfterSave = (
  savedMessageResult,
  accountId,
  parsedEmail,
  errors,
  seq
) => {
  if (savedMessageResult && savedMessageResult.messageId) {
    console.log(
      `[ImapService] Message saved: ID ${savedMessageResult.messageId}, UID ${parsedEmail.uid}. Initiating calendar processing in background.`
    );

    const emailBodyForCalendar = savedMessageResult.bodyHtml;
    if (emailBodyForCalendar && emailBodyForCalendar.trim() !== "") {
      // await를 사용하지 않고 호출하여 백그라운드에서 실행되도록 함
      // 반환된 프로미스에 .catch()를 연결하여 오류만 로깅
      calendarService
        .processNewEmailForCalendar({
          messageId: savedMessageResult.messageId,
          accountId: accountId,
          emailBody: emailBodyForCalendar,
        })
        .catch((calendarError) => {
          // 백그라운드 작업의 오류는 여기서 별도로 로깅합니다.
          console.error(
            `[ImapService] Background Calendar Processing Error for MessageID: ${savedMessageResult.messageId}, UID: ${parsedEmail.uid} (Seq: ${seq}):`,
            calendarError.message
          );
          // 필요하다면, 이 오류 정보를 별도의 로그 파일이나 모니터링 시스템으로 보낼 수 있습니다.
        });
    } else {
      console.log(
        `[ImapService] MessageID: ${savedMessageResult.messageId}, UID: ${parsedEmail.uid} - 캘린더 처리를 위한 이메일 본문이 없습니다.`
      );
    }
  } else {
    const logUID = parsedEmail ? parsedEmail.uid : "N/A";
    const logMessageId = savedMessageResult ? savedMessageResult.messageId : "N/A";
    console.log(
      `[ImapService] UID: ${logUID}, MessageID: ${logMessageId} - Invalid message save result, skipping calendar processing.`
    );
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
    messageLimit = 10, // 폴더당 가져올 메시지 수
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

    if (results.totalMessages > 0) {
      updateGraphDBInBackground(results.totalMessages);
    }

    results.message = `${results.folderCount}개 폴더에서 ${results.totalMessages}개 메시지 동기화`;
    return results;
  } catch (error) {
    console.error("전체 폴더 동기화 오류:", error);
    throw new Error(`전체 폴더 동기화 실패: ${error.message}`);
  }
};

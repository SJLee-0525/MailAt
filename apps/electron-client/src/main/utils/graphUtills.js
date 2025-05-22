// src/utils/graphUtils.js
import * as graphService from "../services/neo4jAdapter.js";
import * as imapService from "../services/imapService.js";

/**
 * 그래프 DB 업데이트 처리 (백그라운드 실행)
 * @param {Number} syncedCount - 동기화된 메시지 수
 */
export const updateGraphDBInBackground = (syncedCount) => {
  if (syncedCount > 0) {
    console.log(`[GraphUtils] ${syncedCount}개의 메시지가 동기화되었습니다. Graph DB 업데이트를 시작합니다.`);
    
    // 비동기로 실행하되 await 하지 않음 (백그라운드 처리)
    graphService.processAndEmbedMessagesPy()
      .then(() => {
        console.log("[GraphUtils] 메시지 처리 및 임베딩 생성 완료");
        return graphService.initializeGraphFromSQLitePy();
      })
      .then(() => {
        console.log("[GraphUtils] Graph DB 업데이트 완료");
      })
      .catch(error => {
        console.error("[GraphUtils] Graph DB 업데이트 오류:", error.message);
      });
  }
};

/**
 * 계정 설정 후 초기 이메일 동기화 및 그래프 DB 초기화
 * @param {Number} accountId - 계정 ID
 * @param {Number} messageLimit - 가져올 메시지 수 (기본 20개)
 * @returns {Promise<Object>} 초기화 결과
 */
export const initializeGraphDBAfterAccountSetup = async (accountId, messageLimit = 20) => {
  try {
    console.log(`[GraphUtils] 계정 ${accountId}의 초기 이메일 동기화 및 그래프 DB 초기화 시작`);
    
    // 최초 메시지 동기화 (INBOX와 Sent 폴더에서 messageLimit개)
    const syncResult = await imapService.syncAllFolders(accountId, {
      folderTypes: ["inbox", "sent"],
      messageLimit: messageLimit,
      skipEmpty: true
    });
    
    console.log(`[GraphUtils] 이메일 동기화 완료: ${syncResult.totalMessages}개 메시지`);
    
    // 동기화된 메시지가 있는 경우에만 그래프 DB 초기화
    if (syncResult.totalMessages > 0) {
      console.log("[GraphUtils] 그래프 DB 초기화 시작");
      
      // 메시지 처리 및 임베딩
      await graphService.processAndEmbedMessagesPy();
      console.log("[GraphUtils] 메시지 처리 및 임베딩 생성 완료");
      
      // 그래프 DB 초기화
      await graphService.initializeGraphFromSQLitePy();
      console.log("[GraphUtils] 그래프 DB 초기화 완료");
    } else {
      console.log("[GraphUtils] 동기화된 메시지가 없어 그래프 DB 초기화를 건너뜁니다.");
    }
    
    return {
      success: true,
      syncResult,
      graphInitialized: syncResult.totalMessages > 0
    };
  } catch (error) {
    console.error("[GraphUtils] 초기화 오류:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  updateGraphDBInBackground,
  initializeGraphDBAfterAccountSetup
};
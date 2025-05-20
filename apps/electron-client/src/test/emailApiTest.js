// src/tests/emailApiTest.js
import emailService from "../main/services/emailService.js";

/**
 * 이메일 API 테스트
 */
class EmailApiTest {
  // 테스트에 사용할 기본 계정 ID
  accountId = 1;

  /**
   * 모든 테스트 실행
   */
  async runAllTests() {
    try {
      console.log("===== 이메일 API 테스트 시작 =====");

      await this.testGetFolders();
      await this.testGetEmails();
      await this.testGetEmailsWithFilter();
      await this.testGetEmailDetail();
      await this.testMarkAsRead();
      await this.testGetThreads();

      console.log("===== 이메일 API 테스트 완료 =====");
    } catch (error) {
      console.error("테스트 실행 중 오류 발생:", error);
    }
  }

  /**
   * 폴더 목록 조회 테스트
   */
  async testGetFolders() {
    try {
      console.log("\n----- 폴더 목록 조회 테스트 -----");
      const folders = await emailService.getFolders(this.accountId);
      console.log(`총 ${folders.length}개 폴더 조회 성공:`);

      // 폴더 목록 출력 (간략하게)
      folders.forEach((folder) => {
        console.log(
          `  - ${folder.name} (${folder.type || "custom"}) - ${folder.messages_total || 0}개 메시지`
        );
      });

      return folders;
    } catch (error) {
      console.error("폴더 목록 조회 테스트 실패:", error.message);
      throw error;
    }
  }

  /**
   * 이메일 목록 조회 테스트 (기본 조회)
   */
  async testGetEmails() {
    try {
      console.log("\n----- 이메일 목록 조회 테스트 (INBOX) -----");

      const params = {
        accountId: this.accountId,
        folderName: "INBOX",
        limit: 10,
      };

      const emails = await emailService.getEmails(params);
      console.log(`INBOX 폴더에서 ${emails.length}개 이메일 조회 성공:`);

      // 이메일 목록 출력 (간략하게)
      emails.forEach((email, index) => {
        console.log(`  ${index + 1}. 제목: ${email.subject || "(제목 없음)"}`);
        console.log(
          `     발신자: ${email.fromName || ""} <${email.fromEmail || ""}>`
        );
        console.log(`     요약: ${email.summary || ""}`);
        console.log(`     날짜: ${email.sentAt || "알 수 없음"}`);
        console.log(`     읽음 여부: ${email.isRead ? "읽음" : "읽지 않음"}`);
      });

      return emails;
    } catch (error) {
      console.error("이메일 목록 조회 테스트 실패:", error.message);
      throw error;
    }
  }

  /**
   * 이메일 목록 조회 테스트 (필터링)
   */
  async testGetEmailsWithFilter() {
    try {
      console.log("\n----- 이메일 목록 필터링 조회 테스트 -----");

      const params = {
        accountId: this.accountId,
        folderName: "INBOX",
        subject: ["광고", "테스트"],
        limit: 10,
      };

      const emails = await emailService.getEmails(params);
      console.log(`필터링 조건으로 ${emails.length}개 이메일 조회 성공:`);
      console.log(`(필터: 제목에 '광고' 또는 '테스트' 포함)`);

      // 이메일 목록 출력
      emails.forEach((email, index) => {
        console.log(`  ${index + 1}. 제목: ${email.subject || "(제목 없음)"}`);
        console.log(
          `     발신자: ${email.fromName || ""} <${email.fromEmail || ""}>`
        );
        
        console.log(`     요약: ${email.summary || ""}`);
        console.log(`     날짜: ${email.sentAt || "알 수 없음"}`);
      });

      return emails;
    } catch (error) {
      console.error("이메일 필터링 조회 테스트 실패:", error.message);
      throw error;
    }
  }

  /**
   * 이메일 상세 조회 테스트
   */
  async testGetEmailDetail() {
    try {
      console.log("\n----- 이메일 상세 조회 테스트 -----");

      // 먼저 이메일 목록을 가져와서 첫 번째 메시지 ID 사용
      const emails = await this.testGetEmails();

      if (emails.length === 0) {
        console.log("테스트할 이메일이 없습니다.");
        return null;
      }

      const messageId = emails[0].messageId;
      console.log(`메시지 ID ${messageId}의 상세 정보 조회 중...`);

      try {
        const emailDetail = await emailService.getEmailDetail(messageId);

        console.log("\n이메일 상세 정보 조회 성공:");
        console.log(`  제목: ${emailDetail.subject || "(제목 없음)"}`);
        console.log(
          `  발신자: ${emailDetail.fromName || ""} <${emailDetail.fromEmail || ""}>`
        );
        console.log(`  수신 시간: ${emailDetail.receivedAt || "알 수 없음"}`);
        console.log(
          `  관련 연락처: ${emailDetail.contacts ? emailDetail.contacts.length : 0}명`
        );
        console.log(
          `  첨부 파일: ${emailDetail.attachments ? emailDetail.attachments.length : 0}개`
        );

        // 본문 일부 출력 (너무 길면 생략)
        const bodyPreview = emailDetail.bodyHtml
          ? emailDetail.bodyHtml.substring(0, 150) +
            (emailDetail.bodyHtml.length > 150 ? "..." : "")
          : "(본문 없음)";
        console.log(`  본문 미리보기: ${bodyPreview}`);

        return emailDetail;
      } catch (detailError) {
        console.error("상세 정보 조회 중 오류 발생:", detailError);
        console.error("오류 메시지:", detailError.message);
        console.error("오류 스택:", detailError.stack);
        return null;
      }
    } catch (error) {
      console.error("이메일 상세 조회 테스트 전체 실패:", error.message);
      console.error("오류 스택:", error.stack);
      throw error;
    }
  }

  /**
   * 이메일 읽음 상태 변경 테스트
   */
  async testMarkAsRead() {
    try {
      console.log("\n----- 이메일 읽음 상태 변경 테스트 -----");

      // 이메일 목록을 가져와서 첫 번째 메시지로 테스트
      const emails = await this.testGetEmails();

      if (emails.length === 0) {
        console.log("테스트할 이메일이 없습니다.");
        return null;
      }

      const messageId = emails[0].messageId;
      const currentReadStatus = emails[0].isRead;

      console.log(`메시지 ID ${messageId}의 읽음 상태 변경 테스트...`);
      console.log(`현재 상태: ${currentReadStatus ? "읽음" : "읽지 않음"}`);

      // 현재와 반대 상태로 변경
      const newStatus = !currentReadStatus;
      console.log(`1. ${newStatus ? "읽음" : "읽지 않음"} 상태로 변경`);

      const markResult = await emailService.markAsRead(messageId, newStatus);
      console.log(`   결과: ${markResult.success ? "성공" : "실패"}`);

      // 원래 상태로 복원
      console.log(
        `2. 원래 상태(${currentReadStatus ? "읽음" : "읽지 않음"})로 복원`
      );

      const restoreResult = await emailService.markAsRead(
        messageId,
        currentReadStatus
      );
      console.log(`   결과: ${restoreResult.success ? "성공" : "실패"}`);

      return { markResult, restoreResult };
    } catch (error) {
      console.error("이메일 읽음 상태 변경 테스트 실패:", error.message);
      throw error;
    }
  }

  /**
   * 이메일 스레드 조회 테스트
   */
  async testGetThreads() {
    try {
      console.log("\n----- 이메일 스레드 조회 테스트 -----");

      // 테스트할 연락처 ID - 실제 DB에 있는 값으로 변경 필요
      // 보통 1번 ID가 존재할 확률이 높음
      const contactId = 1;

      try {
        const threadData = await emailService.getThreadsByContact({
          contactId,
          limit: 10,
          offset: 0,
        });

        console.log(
          `연락처 ${threadData.contact.email}와(과)의 메시지 스레드:`
        );
        console.log(`총 ${threadData.messages.length}개 메시지 조회 성공:`);

        // 메시지 목록 출력
        threadData.messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. 제목: ${msg.subject || "(제목 없음)"}`);
          console.log(`     날짜: ${msg.sentAt || "알 수 없음"}`);
          console.log(`     스니펫: ${msg.snippet || "(미리보기 없음)"}`);
          console.log(`     요약: ${msg.summary || ""}`);

          // HTML 본문 첫 10글자 추출해서 출력
          const htmlPreview = msg.bodyHtml
            ? msg.bodyHtml.substring(0, 10) +
              (msg.bodyHtml.length > 10 ? "..." : "")
            : "(HTML 본문 없음)";
          console.log(`     HTML 본문 미리보기: ${htmlPreview}`);
        });

        return threadData;
      } catch (threadError) {
        console.error("스레드 조회 중 오류 발생:", threadError);
        console.error("오류 메시지:", threadError.message);
        console.error("오류 스택:", threadError.stack);
        return null;
      }
    } catch (error) {
      console.error("이메일 스레드 조회 테스트 전체 실패:", error.message);
      console.error("오류 스택:", error.stack);
      throw error;
    }
  }
}

// 테스트 실행
const tester = new EmailApiTest();
tester.runAllTests().catch((err) => {
  console.error("테스트 실행 중 오류:", err);
});

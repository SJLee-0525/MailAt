// src/test/directSmtpTest.js
import { SmtpWrapper } from "../main/utils/addons.js";

// 테스트 설정
const smtpConfig = {
  host: "smtp.gmail.com",
  port: 465,
  username: "",
  password: "내 비번 쉿쉿",
  authMethod: "LOGIN",
};

const mailInfo = {
  fromAddress: "",
  toAddress: "", // 또는 테스트를 위한 다른 이메일
  subject: "직접 테스트 이메일",
};

async function sendTestEmail() {
  console.log(`===== 직접 SmtpWrapper 테스트 시작 =====`);
  console.log(`연결: ${smtpConfig.host}:${smtpConfig.port}`);

  let smtp = null;

  try {
    // 1. SmtpWrapper 인스턴스 생성
    console.log("SmtpWrapper 인스턴스 생성 중...");
    smtp = new SmtpWrapper(smtpConfig.host, smtpConfig.port);
    console.log("SmtpWrapper 생성 성공");

    // 2. 인증
    console.log(
      `인증 시도: ${smtpConfig.username}, 방식: ${smtpConfig.authMethod}`
    );
    const greeting = smtp.authenticate(
      smtpConfig.username,
      smtpConfig.password,
      smtpConfig.authMethod
    );
    console.log("인증 성공. 서버 응답:", greeting);

    // 3. 이메일 내용 작성
    const rawMessage = `From: <${mailInfo.fromAddress}>
                        To: <${mailInfo.toAddress}>
                        Subject: ${mailInfo.subject}
                        Date: ${new Date().toUTCString()}
                        Content-Type: text/plain; charset=utf-8
                        Content-Transfer-Encoding: 8bit

                        이 이메일은 애드온 직접 테스트를 위해 전송되었습니다.
                        시간: ${new Date().toISOString()}

                        This email was sent to test the SMTP addon directly.
                        `;

    console.log("\n--- 이메일 내용 ---");
    console.log(rawMessage);
    console.log("--- 이메일 내용 끝 ---\n");

    // 4. 이메일 전송
    console.log(`이메일 전송 중: ${mailInfo.toAddress}`);
    const response = smtp.submit(rawMessage);
    console.log("전송 성공. 서버 응답:", response);
    console.log(`\n테스트 이메일 전송 완료!`);
  } catch (error) {
    console.error("\n--- 오류 발생 ---");
    console.error("이메일 전송 실패:");
    console.error("메시지:", error.message);
    if (error.details) {
      console.error("상세 정보:", error.details);
    }
    console.error("스택:", error.stack);
    console.error("--- 오류 끝 ---");
  }

  console.log(`===== 직접 SmtpWrapper 테스트 종료 =====`);
}

// 테스트 실행
sendTestEmail();

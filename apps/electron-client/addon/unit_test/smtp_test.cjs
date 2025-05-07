const { SmtpWrapper } = require('../build/Release/mailio_addon.node');
const fs = require('fs');
const path = require('path');

// --- 설정 정보 로드 ---
let config;
try {
    const configPath = path.join(__dirname, 'info.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error(`[ERROR] Failed to load or parse info.json: ${error.message}`);
    console.error('[STOP] Cannot run tests without configuration.');
    process.exit(1); // 설정 파일 없으면 종료
}

const smtpConfig = config.smtp;
const mailInfo = config.mailInfo;
// --- 사용자 설정 끝 ---


// SmtpWrapper 인스턴스 생성
const smtp = new SmtpWrapper(smtpConfig.host, smtpConfig.port);

async function sendTestEmail() {
    console.log(`Connecting to ${smtpConfig.host}:${smtpConfig.port}...`);

    try {
        // 1. 인증
        console.log(`Authenticating as ${smtpConfig.username} using ${smtpConfig.authMethod}...`);
        // smtpConfig에서 username, password, authMethod 사용
        const greeting = smtp.authenticate(smtpConfig.username, smtpConfig.password, smtpConfig.authMethod);
        console.log('Authentication successful. Server Greeting:', greeting);

        // 2. 메일 내용 작성 (RFC 5322 형식)
        // mailInfo에서 fromAddress, toAddress, subject 사용
        const rawMessage = `From: <${mailInfo.fromAddress}>
To: <${mailInfo.toAddress}>
Subject: ${mailInfo.subject}
Date: ${new Date().toUTCString()}
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 8bit

안녕하세요,

이 메일은 N-API SMTP 래퍼 테스트를 위해 자동으로 발송되었습니다.
성공적으로 수신되었다면 테스트가 성공한 것입니다.

Hello,

This email was sent automatically to test the N-API SMTP wrapper.
If you received this successfully, the test passed.
`;

        console.log('\n--- Raw Message ---');
        console.log(rawMessage);
        console.log('--- End Raw Message ---\n');

        // 3. 메일 전송
        console.log(`Submitting message to ${mailInfo.toAddress}...`);
        const response = smtp.submit(rawMessage);
        console.log('Submit successful. Server Response:', response);
        console.log(`\nTest email sent successfully from ${mailInfo.fromAddress} to ${mailInfo.toAddress}!`);
        console.log('Please check the recipient mailbox.');

    } catch (error) {
        console.error('\n--- Error ---');
        console.error('Failed to send email:');
        console.error('Message:', error.message);
        if (error.details) {
            console.error('Details:', error.details);
        }
        console.error('Stack:', error.stack);
        console.error('--- End Error ---');
    }
}

// 테스트 함수 실행
sendTestEmail();
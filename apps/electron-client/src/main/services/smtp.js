// src/services/smtp.js - SMTP 서비스 (to→recipient로 변경)
import nodemailer from "nodemailer"; // require를 import로 변경

class SmtpService {
  constructor(account) {
    this.account = account;
    this.transporter = nodemailer.createTransport({
      host: account.smtpHost || "k12a204.p.ssafy.io",
      port: account.smtpPort || 8443,
      secure: true, // SSL/TLS 사용
      auth: {
        user: account.email,
        pass: account.password,
      },
      tls: {
        rejectUnauthorized: true, // SSL/TLS 사용
      },
    });
  }

  async sendEmail(emailData) {
    const { to, cc, bcc, subject, text, html, attachments } = emailData;

    const mailOptions = {
      from: this.account.email,
      to, // 여전히 'to'를 사용 (nodemailer API는 변경하지 않음)
      cc,
      bcc,
      subject,
      text,
      html,
    };

    // 첨부파일 추가
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("이메일 전송 실패:", error);
      return { success: false, error: error.message };
    }
  }
}

export default SmtpService; // module.exports를 export default로 변경
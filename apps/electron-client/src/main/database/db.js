// src/database/db.js - 데이터베이스 설정 (ESM 버전)
import sqlite3 from "sqlite3"; // require를 import로 변경
import path from "path"; // require를 import로 변경
import { app } from "electron"; // app 객체는 여기서 직접 사용하지 않으므로 제거 가능

// process.cwd()는 Node.js 전역 객체이므로 그대로 사용 가능
const dbPath = path.join(process.cwd(), "email-client.db");
const db = new sqlite3.Database(dbPath);

// 테이블 초기화
const initDb = () => {
  db.serialize(() => {
    // 계정 테이블 - email을 UNIQUE로 설정
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      imapHost TEXT NOT NULL,
      imapPort INTEGER NOT NULL,
      smtpHost TEXT NOT NULL,
      smtpPort INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 폴더 테이블 - accountId와 path 조합을 UNIQUE로 설정 (name 대신 path 기준)
    db.run(`CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(accountId, path)
    )`);

    // 이메일 테이블 - from을 sender로, to를 recipient로 변경
    db.run(`CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      folderId INTEGER NOT NULL,
      messageId TEXT,
      sender TEXT NOT NULL,
      recipient TEXT NOT NULL,
      cc TEXT,
      bcc TEXT,
      subject TEXT,
      body TEXT,
      bodyHtml TEXT,
      isRead BOOLEAN DEFAULT 0,
      isFlagged BOOLEAN DEFAULT 0,
      receivedDate TIMESTAMP,
      sentDate TIMESTAMP,
      hasAttachments BOOLEAN DEFAULT 0,
      uid TEXT,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
    )`);

    // 첨부파일 테이블
    db.run(`CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emailId INTEGER NOT NULL,
      filename TEXT NOT NULL,
      contentType TEXT,
      size INTEGER,
      path TEXT,
      FOREIGN KEY (emailId) REFERENCES emails(id) ON DELETE CASCADE
    )`);
  });
};

initDb();

export default db; // module.exports를 export default로 변경

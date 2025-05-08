// apps/electron-client/src/main/config/dbConfig.js
import sqlite3 from "sqlite3";
import { join } from "path";
import fs from "fs";

// SQLite 데이터베이스 연결
let db = null;

/**
 * 데이터베이스 연결 가져오기
 * @returns {sqlite3.Database} 데이터베이스 연결 객체
 */
export const getConnection = () => {
  if (db) return db;

  // 테스트 환경 확인
  const isTest = process.env.NODE_ENV === "test";
  let dbPath;

  if (isTest) {
    // 테스트 환경에서는 임시 DB 경로 사용
    const tempDir = join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    dbPath = join(tempDir, "test-emaildb.sqlite");
  } else {
    try {
      // Electron 환경일 경우
      const { app } = require("electron");
      const userDataPath = app.getPath("userData");
      dbPath = join(userDataPath, "emaildb.sqlite");
    } catch (error) {
      // Electron이 없거나 require가 실패했을 경우 기본 경로 사용
      console.warn(
        "Electron 앱 객체를 가져올 수 없습니다. 기본 경로를 사용합니다."
      );
      dbPath = join(process.cwd(), "emaildb.sqlite");
    }
  }

  console.log(`데이터베이스 경로: ${dbPath}`);

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(`데이터베이스 연결 오류: ${err.message}`);
      throw new Error(`데이터베이스 연결 실패: ${err.message}`);
    }
    console.log(`데이터베이스 연결 성공: ${dbPath}`);
  });

  return db;
};

/**
 * 데이터베이스 연결 종료
 */
export const closeConnection = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error(`데이터베이스 연결 종료 오류: ${err.message}`);
      } else {
        console.log("데이터베이스 연결이 종료되었습니다.");
      }
    });
    db = null;
  }
};

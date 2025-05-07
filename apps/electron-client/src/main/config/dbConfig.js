// src/config/dbConfig.js
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { app } from 'electron';

// SQLite 데이터베이스 연결
let db = null;

/**
 * 데이터베이스 연결 가져오기
 * @returns {sqlite3.Database} 데이터베이스 연결 객체
 */
export const getConnection = () => {
  if (db) return db;
  
  // 일렉트론 환경에서 앱 데이터 디렉토리 사용
  const userDataPath = app.getPath('userData');
  const dbPath = join(userDataPath, 'emaildb.sqlite');
  
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
        console.log('데이터베이스 연결이 종료되었습니다.');
      }
    });
    db = null;
  }
};
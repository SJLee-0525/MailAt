// src/services/imap.js - 완전히 개선된 IMAP 서비스 (ESM 버전)
import Imap from "node-imap"; // require를 import로 변경
import { simpleParser } from "mailparser"; // require를 import로 변경
import fs from "fs"; // require를 import로 변경
import path from "path"; // require를 import로 변경
import { app } from "electron"; // require를 import로 변경
import iconv from "iconv-lite"; // require를 import로 변경
import charsetDetector from "chardet"; // require를 import로 변경
import quotedPrintable from 'quoted-printable';
const { decode: quotedPrintableDecode } = quotedPrintable;


/**
 * 향상된 IMAP 서비스 클래스
 * - 안정적인 이메일 처리
 * - 한글 인코딩 문제 해결
 * - 성능 최적화
 */
class ImapService {
  /**
   * IMAP 서비스 생성자
   * @param {Object} account - 계정 정보
   */
  constructor(account) {
    this.account = account;

    try {
      // IMAP 객체 초기화
      this.imap = new Imap({
        user: account.email,
        password: account.password,
        host: account.imapHost || "imap.gmail.com",
        port: account.imapPort || 993,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false, // 자체 서명 인증서 허용
          secureProtocol: "TLSv1_2_method",
        },
        connTimeout: 30000, // 30초
        authTimeout: 30000, // 30초
        debug: process.env.NODE_ENV === "development" ? this.logDebug : null,
      });

      // 이벤트 리스너 등록
      this.setupEventListeners();
      console.log("IMAP 객체 생성 완료");
    } catch (err) {
      console.error("IMAP 객체 생성 실패:", err);
      this.imap = null;
    }
  }

  /**
   * IMAP 디버그 로그 함수
   * @param {String} info - 디버그 정보
   */
  logDebug(info) {
    console.log(`[IMAP 디버그] ${info}`);
  }

  /**
   * IMAP 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (!this.imap) return;

    this.imap.on("error", (err) => {
      console.error("IMAP 에러 발생:", err);
    });

    this.imap.on("end", () => {
      console.log("IMAP 연결 종료");
    });

    this.imap.on("close", (hadError) => {
      if (hadError) {
        console.error("IMAP 연결이 오류로 종료됨");
      } else {
        console.log("IMAP 연결 정상 종료");
      }
    });
  }

  /**
   * IMAP 서버에 연결
   * @returns {Promise} 연결 성공/실패 Promise
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error("IMAP 객체가 초기화되지 않았습니다"));
      }

      // 타임아웃 설정
      const connectTimeout = setTimeout(() => {
        console.error("IMAP 연결 타임아웃");
        reject(new Error("IMAP 연결 타임아웃"));
      }, 30000);

      // 연결 이벤트 핸들러
      const onReady = () => {
        clearTimeout(connectTimeout);
        console.log("IMAP 서버에 성공적으로 연결됨");
        resolve();
      };

      const onError = (err) => {
        clearTimeout(connectTimeout);
        console.error("IMAP 연결 실패:", err);
        reject(err);
      };

      // 일회성 이벤트 리스너 등록
      this.imap.once("ready", onReady);
      this.imap.once("error", onError);

      try {
        // 연결 시작
        this.imap.connect();
      } catch (err) {
        clearTimeout(connectTimeout);
        // 이벤트 리스너 제거
        this.imap.removeListener("ready", onReady);
        this.imap.removeListener("error", onError);
        console.error("IMAP 연결 시도 중 예외 발생:", err);
        reject(err);
      }
    });
  }

  /**
   * IMAP 연결 종료
   */
  disconnect() {
    if (this.imap && this.imap.state !== "disconnected") {
      try {
        this.imap.end();
      } catch (err) {
        console.error("IMAP 연결 종료 중 오류:", err);
      }
    }
  }

  /**
   * 이메일 헤더 디코딩 (RFC 2047)
   * @param {String} header - 인코딩된 헤더 문자열
   * @returns {String} 디코딩된 헤더 문자열
   */
  decodeEmailHeader(header) {
    if (!header) return "";

    try {
      // RFC 2047 인코딩 패턴: =?인코딩?인코딩방식?인코딩된텍스트?=
      return header.replace(
        /=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g,
        (match, charset, encoding, text) => {
          try {
            if (encoding.toUpperCase() === "B") {
              // Base64 디코딩
              const buffer = Buffer.from(text, "base64");
              return iconv.decode(buffer, charset);
            } else if (encoding.toUpperCase() === "Q") {
              // Quoted-Printable 디코딩
              const decodedText = text
                .replace(/_/g, " ")
                .replace(/=([0-9A-F]{2})/gi, (_, hex) =>
                  String.fromCharCode(parseInt(hex, 16))
                );
              return iconv.decode(Buffer.from(decodedText), charset);
            }
            return match;
          } catch (err) {
            console.error("헤더 디코딩 실패:", err);
            return match;
          }
        }
      );
    } catch (err) {
      console.error("헤더 디코딩 중 오류:", err);
      return header;
    }
  }

  /**
   * 폴더 목록 가져오기
   * @returns {Promise<Array>} 폴더 목록
   */
  async getFolders() {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.getBoxes((err, boxes) => {
          if (err) {
            reject(err);
            return;
          }

          const folders = this.parseFolders(boxes);
          resolve(folders);
          this.disconnect();
        });
      });
    } catch (err) {
      this.disconnect();
      throw err;
    }
  }

  /**
   * 폴더 구조 파싱
   * @param {Object} boxes - IMAP 폴더 정보
   * @param {String} path - 현재 경로 (재귀 호출용)
   * @returns {Array} 파싱된 폴더 목록
   */
  parseFolders(boxes, path = "") {
    let folders = [];
    if (!boxes) return folders;

    Object.keys(boxes).forEach((key) => {
      const box = boxes[key];
      if (!box) return;

      const folderPath = path ? `${path}${this.imap.delimiter}${key}` : key;
      folders.push({
        name: key,
        path: folderPath,
        delimiter: this.imap.delimiter,
        hasChildren: box.children ? true : false,
      });

      if (box.children) {
        folders = folders.concat(this.parseFolders(box.children, folderPath));
      }
    });

    return folders;
  }

  /**
   * 이메일 헤더만 페이지별로 가져오기
   * @param {String} folderPath - 폴더 경로
   * @param {Number} page - 페이지 번호 (1부터 시작)
   * @param {Number} pageSize - 페이지 크기
   * @returns {Promise<Object>} 헤더 목록과 총 이메일 수
   */
  async getEmailHeaders(folderPath, page = 1, pageSize = 20) {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.openBox(folderPath, true, (err, box) => {
          if (err) {
            this.disconnect();
            return reject(err);
          }

          const total = box.messages.total;
          if (total === 0) {
            this.disconnect();
            return resolve({ headers: [], total: 0 });
          }

          // 모든 이메일 검색
          this.imap.search(["ALL"], (err, results) => {
            if (err) {
              this.disconnect();
              return reject(err);
            }

            if (results.length === 0) {
              this.disconnect();
              return resolve({ headers: [], total: 0 });
            }

            // 최신 이메일이 먼저 오도록 내림차순 정렬
            results.sort((a, b) => b - a);

            // 페이지네이션 적용
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageResults = results.slice(start, end);

            if (pageResults.length === 0) {
              this.disconnect();
              return resolve({ headers: [], total });
            }

            const headers = [];
            const fetchOptions = {
              bodies: [
                "HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID CONTENT-TYPE)",
              ],
              struct: true,
            };

            const fetch = this.imap.fetch(pageResults, fetchOptions);

            fetch.on("message", (msg, seqno) => {
              const header = {
                uid: null,
                messageId: "",
                sender: "",
                recipient: "",
                cc: "",
                bcc: "",
                subject: "",
                date: null,
                hasAttachments: false,
              };

              msg.on("body", (stream, info) => {
                let buffer = Buffer.alloc(0);

                stream.on("data", (chunk) => {
                  buffer = Buffer.concat([buffer, chunk]);
                });

                stream.once("end", () => {
                  if (info.which.includes("HEADER")) {
                    const parsed = Imap.parseHeader(buffer.toString("utf8"));

                    // 헤더 디코딩
                    header.messageId = parsed["message-id"]
                      ? parsed["message-id"][0]
                      : "";
                    header.sender = this.decodeEmailHeader(
                      parsed.from ? parsed.from[0] : ""
                    );
                    header.recipient = this.decodeEmailHeader(
                      parsed.to ? parsed.to[0] : ""
                    );
                    header.cc = this.decodeEmailHeader(
                      parsed.cc ? parsed.cc[0] : ""
                    );
                    header.bcc = this.decodeEmailHeader(
                      parsed.bcc ? parsed.bcc[0] : ""
                    );
                    header.subject = this.decodeEmailHeader(
                      parsed.subject ? parsed.subject[0] : ""
                    );

                    if (parsed.date && parsed.date[0]) {
                      try {
                        header.date = new Date(parsed.date[0]);
                      } catch (e) {
                        console.error("날짜 파싱 오류:", e);
                        header.date = null;
                      }
                    }
                  }
                });
              });

              msg.once("attributes", (attrs) => {
                header.uid = attrs.uid;

                // 첨부파일 여부 확인
                if (attrs.struct) {
                  const attachments = this.getAttachmentInfo(attrs.struct);
                  header.hasAttachments = attachments.length > 0;
                }
              });

              msg.once("end", () => {
                headers.push(header);
              });
            });

            fetch.once("error", (err) => {
              console.error("이메일 헤더 가져오기 오류:", err);
              this.disconnect();
              reject(err);
            });

            fetch.once("end", () => {
              // 날짜 기준 정렬 (최신순)
              headers.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return b.date - a.date;
              });

              this.disconnect();
              resolve({ headers, total });
            });
          });
        });
      });
    } catch (err) {
      this.disconnect();
      throw err;
    }
  }

  /**
   * 이메일 본문 가져오기
   * @param {Number} uid - 이메일 UID
   * @param {String} folderPath - 폴더 경로
   * @returns {Promise<Object>} 이메일 데이터
   */
  async getEmailBody(uid, folderPath) {
    console.log(`이메일 본문 가져오기 시작 (UID: ${uid}, 폴더: ${folderPath})`);

    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.openBox(folderPath, true, (err) => {
          if (err) {
            console.error("메일함 열기 실패:", err);
            this.disconnect();
            return reject(err);
          }

          console.log("메일함 열기 성공, 이메일 가져오기 시작");

          // 전체 이메일 데이터 가져오기
          const fetch = this.imap.fetch(uid, { bodies: [""], struct: true });

          let rawEmail = null;
          let attrs = null;

          fetch.on("message", (msg) => {
            msg.on("body", (stream, info) => {
              // 이메일 전체 내용 스트림으로 받기
              let chunks = [];

              stream.on("data", (chunk) => {
                chunks.push(chunk);
              });

              stream.once("end", () => {
                rawEmail = Buffer.concat(chunks);
                console.log(
                  `이메일 데이터 수신 완료 (${rawEmail.length} 바이트)`
                );
              });
            });

            msg.once("attributes", (attributes) => {
              attrs = attributes;
            });
          });

          fetch.once("error", (err) => {
            console.error("이메일 가져오기 오류:", err);
            this.disconnect();
            reject(err);
          });

          fetch.once("end", () => {
            if (!rawEmail) {
              console.error("이메일 데이터가 없습니다");
              this.disconnect();
              return reject(new Error("이메일 데이터가 없습니다"));
            }

            console.log("이메일 데이터 파싱 시작");

            // mailparser로 이메일 파싱
            simpleParser(rawEmail, { skipHtmlToText: false })
              .then((parsedEmail) => {
                // 첨부파일 정보 추출
                const attachments = [];

                if (attrs && attrs.struct) {
                  console.log("첨부파일 정보 추출");
                  const attachmentInfo = this.getAttachmentInfo(attrs.struct);

                  if (
                    parsedEmail.attachments &&
                    parsedEmail.attachments.length > 0
                  ) {
                    // simpleParser로 추출한 첨부파일 정보와 병합
                    parsedEmail.attachments.forEach((attachment) => {
                      // 첨부파일 추가
                      attachments.push({
                        filename: attachment.filename,
                        contentType: attachment.contentType,
                        size: attachment.size,
                        content: attachment.content,
                      });
                    });
                  } else if (attachmentInfo.length > 0) {
                    // 구조적 정보만 있는 경우 (내용 없음)
                    attachments.push(...attachmentInfo);
                  }
                }

                // 이메일 객체 구성
                const email = {
                  uid: uid,
                  messageId: parsedEmail.messageId || "",
                  sender: parsedEmail.from ? parsedEmail.from.text : "",
                  recipient: parsedEmail.to ? parsedEmail.to.text : "",
                  cc: parsedEmail.cc ? parsedEmail.cc.text : "",
                  bcc: parsedEmail.bcc ? parsedEmail.bcc.text : "",
                  subject: parsedEmail.subject || "",
                  body: parsedEmail.text || "",
                  bodyHtml: parsedEmail.html || "",
                  date: parsedEmail.date,
                  hasAttachments: attachments.length > 0,
                  attachments: attachments,
                };

                console.log("이메일 파싱 완료");
                this.disconnect();
                resolve(email);
              })
              .catch((err) => {
                console.error("이메일 파싱 실패:", err);

                // 파싱 실패 시 기본 정보라도 반환
                const basicEmail = {
                  uid: uid,
                  messageId: "",
                  sender: "",
                  recipient: "",
                  subject: "(파싱 실패)",
                  body: "(이메일 내용을 파싱할 수 없습니다)",
                  bodyHtml: "",
                  date: new Date(),
                  hasAttachments: false,
                  attachments: [],
                  error: err.message,
                };

                this.disconnect();
                resolve(basicEmail);
              });
          });
        });
      });
    } catch (err) {
      console.error("이메일 본문 가져오기 전체 오류:", err);
      this.disconnect();
      throw err;
    }
  }

  /**
   * MIME 구조에서 첨부파일 정보 추출
   * @param {Object} struct - MIME 구조 객체
   * @returns {Array} 첨부파일 정보 배열
   */
  getAttachmentInfo(struct) {
    const attachments = [];

    try {
      const traverse = (struct, partPath = []) => {
        if (!struct) return;

        if (Array.isArray(struct)) {
          struct.forEach((part, i) => {
            traverse(part, [...partPath, String(i + 1)]);
          });
          return;
        }

        // 파트가 객체인지 확인
        if (typeof struct !== "object") return;

        // 첨부파일 여부 확인
        const isAttachment =
          (struct.disposition &&
            struct.disposition.type &&
            struct.disposition.type.toLowerCase() === "attachment") ||
          (struct.disposition &&
            struct.disposition.type &&
            struct.disposition.type.toLowerCase() === "inline" &&
            struct.params &&
            struct.params.name);

        if (isAttachment) {
          const disposition = struct.disposition || {};
          const params = struct.params || {};
          const dParams = disposition.params || {};

          const filename = this.decodeEmailHeader(
            dParams.filename || dParams.name || params.name || "unknown"
          );

          attachments.push({
            filename: filename,
            contentType: struct.type
              ? struct.subtype
                ? `${struct.type}/${struct.subtype}`
                : struct.type
              : "application/octet-stream",
            size: parseInt(dParams.size || "0", 10),
            partID: partPath.join("."),
          });
        }

        // 자식 노드 재귀 처리
        if (struct.childNodes) {
          struct.childNodes.forEach((child, i) => {
            traverse(child, [...partPath, String(i + 1)]);
          });
        }
      };

      traverse(struct);
    } catch (err) {
      console.error("첨부파일 정보 추출 오류:", err);
    }

    return attachments;
  }

  /**
   * 첨부파일 다운로드
   * @param {Number} uid - 이메일 UID
   * @param {String} partID - 첨부파일 파트 ID
   * @param {String} folderPath - 폴더 경로
   * @param {String} filename - 저장할 파일명
   * @returns {Promise<String>} 저장된 파일 경로
   */
  async downloadAttachment(uid, partID, folderPath, filename) {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.openBox(folderPath, true, (err) => {
          if (err) {
            this.disconnect();
            return reject(err);
          }

          // 저장 디렉토리 생성
          const attachmentDir = path.join(
            app.getPath("userData"),
            "attachments"
          );

          try {
            if (!fs.existsSync(attachmentDir)) {
              fs.mkdirSync(attachmentDir, { recursive: true });
            }
          } catch (err) {
            console.error("첨부파일 디렉토리 생성 실패:", err);
            this.disconnect();
            return reject(err);
          }

          const safeName = this.sanitizeFilename(filename);
          const savePath = path.join(attachmentDir, safeName);

          // 쓰기 스트림 생성
          const writeStream = fs.createWriteStream(savePath);

          // 해당 파트만 가져오기
          const fetch = this.imap.fetch(uid, {
            bodies: [partID],
            struct: true,
          });

          let fetched = false;

          fetch.on("message", (msg) => {
            msg.on("body", (stream, info) => {
              console.log(`첨부파일 다운로드 시작: ${filename}`);

              fetched = true;
              stream.pipe(writeStream);
            });
          });

          fetch.once("error", (err) => {
            console.error("첨부파일 다운로드 오류:", err);
            writeStream.end();
            this.disconnect();
            reject(err);
          });

          fetch.once("end", () => {
            if (!fetched) {
              console.error("첨부파일 파트를 찾을 수 없음:", partID);
              writeStream.end();
              this.disconnect();
              return reject(new Error("첨부파일 파트를 찾을 수 없습니다"));
            }

            writeStream.on("finish", () => {
              console.log(`첨부파일 다운로드 완료: ${filename}`);
              this.disconnect();
              resolve(savePath);
            });

            writeStream.on("error", (err) => {
              console.error("파일 쓰기 오류:", err);
              this.disconnect();
              reject(err);
            });
          });
        });
      });
    } catch (err) {
      this.disconnect();
      throw err;
    }
  }

  /**
   * 안전한 파일명 생성
   * @param {String} filename - 원본 파일명
   * @returns {String} 안전한 파일명
   */
  sanitizeFilename(filename) {
    // 파일명에서 금지된 문자 제거
    const sanitized = filename.replace(/[\/\\:*?"<>|]/g, "_");

    // 파일명이 너무 길면 자르기
    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      return base.slice(0, 255 - ext.length - 10) + "_" + ext;
    }

    return sanitized;
  }
}

export default ImapService; // module.exports를 export default로 변경

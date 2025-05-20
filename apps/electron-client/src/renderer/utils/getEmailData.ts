import {
  AllEmails,
  EmailSearchFilters,
  EmailSearchFiltersParams,
} from "@/types/emailTypes";

import { mockAllEmails } from "@data/EMAIL_CONSERVATIONS";

export function parseEmailFromName(from: string) {
  // 뒤에서 가장 마지막 '<'와 '>' 위치를 찾습니다.
  const start = from.lastIndexOf("<");
  const end = from.lastIndexOf(">");

  if (start !== -1 && end > start) {
    // <> 사이를 이메일로
    const email = from.slice(start + 1, end).trim();
    // <> 이전 전체를 이름으로
    const name = from.slice(0, start).trim();
    return { name, email };
  }

  // <> 없으면 기존 로직 유지
  const parts = from.split(" ");
  if (parts.length > 1) {
    const name = parts.slice(0, -1).join(" ");
    const email = parts[parts.length - 1].replace(/<|>/g, "").trim();
    return { name, email };
  }

  // 단일 문자열인 경우
  return { name: from.trim(), email: from.trim() };
}

export function searchEmails(filters: EmailSearchFilters): AllEmails[] {
  const {
    from,
    // to,
    subject,
    includeKeywords,
    excludeKeywords,
    // attachmentSize,
    startDate,
    endDate,
  } = filters;

  return mockAllEmails.filter((email) => {
    // 1) 날짜 범위 검사
    if (startDate || endDate) {
      const sent = new Date(email.sentAt).getTime();
      if (startDate && sent < startDate.getTime()) return false;
      if (endDate && sent > endDate.getTime()) return false;
    }

    // 2) from 필터
    if (from) {
      const fromLower = email.fromEmail.toLowerCase();
      const fromMatch = from.some((f) => fromLower.includes(f.toLowerCase()));
      if (!fromMatch) {
        return false;
      }
    }

    // 3) to 필터
    // if (to) {
    //   const toLower = email.to.toLowerCase();
    //   const toMatch = to.some((t) => toLower.includes(t.toLowerCase()));
    //   if (!toMatch) {
    //     return false;
    //   }
    // }

    // 4) subject 필터
    if (subject) {
      const subjectLower = email.subject.toLowerCase();
      const subjectMatch = subject.some((s) =>
        subjectLower.includes(s.toLowerCase())
      );
      if (!subjectMatch) {
        return false;
      }
    }

    // 5) includeKeywords 필터
    if (includeKeywords && includeKeywords.length > 0) {
      const haystack = [
        email.subject,
        email.fromName,
        email.fromEmail,
        email.snippet,
        // email.body,
      ]
        .join(" ")
        .toLowerCase();

      for (const kw of includeKeywords) {
        if (!haystack.includes(kw.toLowerCase())) {
          return false;
        }
      }
    }

    // 6) excludeKeywords 필터
    if (excludeKeywords && excludeKeywords.length > 0) {
      const haystack = [
        email.subject,
        email.fromName,
        email.fromEmail,
        email.snippet,
        // email.body,
      ]
        .join(" ")
        .toLowerCase();

      for (const kw of excludeKeywords) {
        if (haystack.includes(kw.toLowerCase())) {
          return false;
        }
      }
    }

    // 7) minAttachmentSize 필터
    // if (attachmentSize != null) {
    //   // 첨부파일 중 하나라도 size >= minAttachmentSize 여야 통과
    //   const hasLarge = email.attachments.some(
    //     (att) => att.size >= attachmentSize!
    //   );
    //   if (!hasLarge) {
    //     return false;
    //   }
    // }

    // 통과한 이메일 반환
    return true;
  });
}

export function queryToSQL({
  name,
  searchQuery,
}: {
  name: string;
  searchQuery: string;
}): string {
  let whereClause = "";

  switch (name) {
    case "from":
      // 보낸사람 부분 일치
      whereClause = `\`from\` LIKE '%${searchQuery}%'`;
      break;

    case "to":
      // 받는사람 부분 일치
      whereClause = `\`to\` LIKE '%${searchQuery}%'`;
      break;

    case "subject":
      // 제목 부분 일치
      whereClause = `subject LIKE '%${searchQuery}%'`;
      break;

    case "includeKeywords":
      // 쉼표 구분 키워드 모두 포함 (제목 or 본문)
      whereClause = searchQuery
        .split(",")
        .map((kw) => {
          const k = kw.trim().replace(/'/g, "''");
          return `(subject LIKE '%${k}%' OR body LIKE '%${k}%')`;
        })
        .join(" AND ");
      break;

    case "excludeKeywords":
      // 쉼표 구분 키워드 모두 제외 (제목 & 본문)
      whereClause = searchQuery
        .split(",")
        .map((kw) => {
          const k = kw.trim().replace(/'/g, "''");
          return `(subject NOT LIKE '%${k}%' AND body NOT LIKE '%${k}%')`;
        })
        .join(" AND ");
      break;

    case "minAttachmentSize":
      // 최소 첨부파일 크기 이상 이메일
      const size = parseInt(searchQuery, 10);
      if (!isNaN(size)) {
        whereClause = `
                EXISTS (
                  SELECT 1
                  FROM attachments a
                  WHERE a.emailId = emails.id
                    AND a.size >= ${size}
                )
              `;
      }
      break;

    case "startDate":
      // 이 날짜 이후(포함)
      const sd = new Date(searchQuery);
      if (!isNaN(sd.getTime())) {
        whereClause = `date >= '${sd.toISOString()}'`;
      }
      break;

    case "endDate":
      // 이 날짜 이전(포함)
      const ed = new Date(searchQuery);
      if (!isNaN(ed.getTime())) {
        whereClause = `date <= '${ed.toISOString()}'`;
      }
      break;

    default:
      break;
  }

  return whereClause;
}

export function queryToShortenedWord({
  name,
  searchQuery,
}: {
  name: string;
  searchQuery: string;
}): string {
  let part = "";

  switch (name) {
    case "from":
    case "to":
    case "subject":
      // from:값, to:값, subject:값
      part = `${name}:${searchQuery}`;
      break;

    case "includeKeywords":
      // 콤마로 분리된 키워드 → ["키1","키2"] → "키1 키2"
      part = searchQuery
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean)
        .join(" ");
      break;

    case "searchQuery":
      part = searchQuery;
      break;

    case "excludeKeywords":
      // "-키1 -키2"
      part = searchQuery
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean)
        .map((kw) => `-${kw}`)
        .join(" ");
      break;

    case "minAttachmentSize":
      // 숫자 끝에 M 붙여서 larger:123M
      const n = parseInt(searchQuery, 10);
      if (!isNaN(n)) {
        part = `larger:${n}MB`;
      }
      break;

    case "startDate":
      // yyyy-mm-dd 로 포맷되어 들어온다고 가정 → after:2025-04-28
      part = `after:${searchQuery}`;
      break;

    case "endDate":
      part = `before:${searchQuery}`;
      break;

    default:
      break;
  }

  return part;
}

export function splitSearchQuery(query: string) {
  const parts = query.split(/\s+/); // 공백으로 분리
  if (parts.length === 0) return {}; // 빈 쿼리 처리

  const filters: EmailSearchFilters = {};

  for (const part of parts) {
    const [key, value] = part.split(":"); // key:value 형태로 분리
    if (value) {
      const trimmedValue = value.trim();
      if (key === "from" || key === "to" || key === "subject") {
        filters[key] = filters[key] || [];
        filters[key]!.push(trimmedValue);
      } else if (key === "larger") {
        filters.attachmentSize = parseInt(trimmedValue, 10); // 숫자로 변환
      }
    } else {
      if (part.startsWith("-")) {
        const trimmedPart = part.slice(1).trim();
        filters.excludeKeywords = filters.excludeKeywords || [];
        filters.excludeKeywords.push(trimmedPart);
      } else {
        filters.includeKeywords = filters.includeKeywords || [];
        const trimmedPart = part.trim();
        if (trimmedPart) {
          filters.includeKeywords.push(trimmedPart);
        }
      }
    }
  }

  return filters;
}

// utils/buildQuery.ts
export const buildFilterQueryString = (
  userId: number,
  folderName: string | null,
  filters: EmailSearchFilters
) => {
  const params = new URLSearchParams();

  // 필수 파라미터
  params.append("accountId", String(userId));

  // 선택적 파라미터
  if (folderName) {
    params.append("folderName", folderName);
  }

  // 1) 배열 타입 키를 명시적으로 뽑아두고
  const multiValueKeys: Array<keyof EmailSearchFilters> = [
    "from",
    "to",
    "subject",
    "includeKeywords",
    "excludeKeywords",
  ];

  // 2) forEach나 for..of로 순회하며, 배열일 때만 append
  for (const key of multiValueKeys) {
    const arr = filters[key];
    if (Array.isArray(arr)) {
      arr.forEach((v) => {
        params.append(key, v);
      });
    }
  }

  // 숫자 타입 필터
  if (filters.attachmentSize != null) {
    params.append("attachmentSize", String(filters.attachmentSize));
  }

  // 날짜 타입 필터 (YYYY-MM-DD)
  if (filters.startDate) {
    params.append("startDate", filters.startDate.toISOString().split("T")[0]);
  }
  if (filters.endDate) {
    params.append("endDate", filters.endDate.toISOString().split("T")[0]);
  }

  return params.toString();
};

export function getEmailParams({
  userId,
  folderName,
  filters,
  limit,
  offset,
  sort = "sent_at",
  order = "DESC",
}: {
  userId: number;
  folderName: string | null;
  filters: EmailSearchFilters;
  limit: number;
  offset: number;
  sort?: "sent_at" | "created_at";
  order?: "DESC" | "ASC";
}): EmailSearchFiltersParams {
  const params: EmailSearchFiltersParams = {
    accountId: userId,
    folderName: folderName ? folderName : "INBOX",

    limit,
    offset,
    sort,
    order,
  };

  // 필터 추가
  if (filters.from) {
    params.from = filters.from;
  }

  if (filters.to) {
    params.to = filters.to;
  }

  if (filters.subject) {
    params.subject = filters.subject;
  }

  if (filters.includeKeywords) {
    params.includeKeywords = filters.includeKeywords;
  }

  if (filters.excludeKeywords) {
    params.excludeKeywords = filters.excludeKeywords;
  }

  // if (filters.attachmentSize) {
  //   params.attachmentSize = filters.attachmentSize;
  // }

  if (filters.startDate) {
    params.startDate = filters.startDate.toISOString();
  }

  if (filters.endDate) {
    params.endDate = filters.endDate.toISOString();
  }

  return params;
}

/**
 * IMAP Modified UTF-7 형식으로 인코딩된 문자열 조각을 디코딩합니다.
 * @param encodedNamePart "&...-" 형태의 IMAP Modified UTF-7 인코딩된 문자열 조각
 * @returns 디코딩된 문자열 (예: 폴더 이름 등)
 */
export function decodeImapModifiedUtf7Segment(encodedNamePart: string): string {
  try {
    // 인코딩된 문자열은 항상 &로 시작하고 -로 끝나야 함
    if (!encodedNamePart.startsWith("&") || !encodedNamePart.endsWith("-")) {
      // 이 형식이 아니면 평문 ASCII일 수 있음
      // 또는 전체 IMAP UTF-7 문자열의 일부일 수 있음
      // 이 함수는 단일 인코딩 블록(&...-)만 처리하므로, 다른 경우는 그대로 반환
      return encodedNamePart;
    }

    // 특수한 경우: "&-" 자체는 빈 문자열을 의미
    if (encodedNamePart === "&-") {
      return "";
    }

    // &...- 중 실제 base64 인코딩 부분만 추출 (앞의 &, 뒤의 - 제외)
    const base64Part = encodedNamePart.slice(1, -1);

    // IMAP UTF-7에서는 base64 패딩 문자("=")를 생략함 → 수동으로 패딩 추가
    const paddedBase64 = base64Part.padEnd(
      base64Part.length + ((4 - (base64Part.length % 4)) % 4),
      "="
    );

    // base64 문자열을 바이너리 문자열로 디코딩
    const binaryString = atob(paddedBase64);

    // 바이너리 문자열을 ArrayBuffer로 변환 (TextDecoder에 전달하기 위함)
    const buffer = new ArrayBuffer(binaryString.length);
    const bufferView = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      bufferView[i] = binaryString.charCodeAt(i);
    }

    // UTF-16BE 형식으로 디코딩 (IMAP Modified UTF-7은 UTF-16 Big Endian 사용)
    const decoder = new TextDecoder("utf-16be");
    const decodedString = decoder.decode(bufferView);

    return decodedString;
  } catch (error) {
    // 오류 발생 시 원본 문자열 그대로 반환 (또는 빈 문자열 반환 가능)
    console.error(
      `Error decoding IMAP Modified UTF-7 segment "${encodedNamePart}":`,
      error instanceof Error ? error.message : String(error)
    );
    return encodedNamePart; // 실패 시 fallback
  }
}

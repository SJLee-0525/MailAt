// src/utils/attachmentUtils.ts
import type {
  Attachment,
  DateGroup,
  ContactGroup,
  FileTypeGroup,
} from "../types/attachmentTypes";

// 날짜별 그룹화
export function groupByDate(attachments: Attachment[]): DateGroup[] {
  if (!attachments || !Array.isArray(attachments)) return [];

  const groups: Record<string, Attachment[]> = {};

  attachments.forEach((attachment) => {
    // yyyy-MM-dd 형식으로 날짜 키 생성
    const date = attachment.createdAt.split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(attachment);
  });

  // 날짜 순으로 정렬된 배열로 변환
  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // 최신순
    .map((date) => ({
      date,
      attachments: groups[date],
    }));
}

// 연락처별 그룹화
export function groupByContact(attachments: Attachment[]): ContactGroup[] {
  if (!attachments || !Array.isArray(attachments)) return [];

  const groups: Record<string, Attachment[]> = {};
  const names: Record<string, string> = {};

  attachments.forEach((attachment) => {
    if (!groups[attachment.contactEmail]) {
      groups[attachment.contactEmail] = [];
      names[attachment.contactEmail] = attachment.contactName;
    }
    groups[attachment.contactEmail].push(attachment);
  });

  // 연락처 이름 순으로 정렬된 배열로 변환
  return Object.keys(groups)
    .sort((a, b) => names[a].localeCompare(names[b]))
    .map((contactEmail) => ({
      contactEmail,
      contactName: names[contactEmail],
      attachments: groups[contactEmail],
    }));
}

// 파일 타입 추출
export function getFileType(mimeType: string): string {
  if (!mimeType) return "unknown";
  return mimeType.split("/")[0] || "unknown";
}

// 파일 타입 라벨 가져오기
export function getFileTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    image: "이미지",
    video: "비디오",
    audio: "오디오",
    text: "텍스트",
    application: "문서",
    pdf: "PDF",
    document: "문서",
    spreadsheet: "스프레드시트",
    presentation: "프레젠테이션",
    archive: "압축파일",
    code: "코드",
    unknown: "기타",
  };

  return typeLabels[type] || "기타";
}

// 파일 타입별 그룹화
export function groupByFileType(attachments: Attachment[]): FileTypeGroup[] {
  if (!attachments || !Array.isArray(attachments)) return [];

  const groups: Record<string, Attachment[]> = {};

  attachments.forEach((attachment) => {
    const type = getFileType(attachment.mimeType);
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(attachment);
  });

  const typeOrder = [
    "image",
    "video",
    "audio",
    "pdf",
    "document",
    "spreadsheet",
    "presentation",
    "archive",
    "code",
    "text",
    "application",
    "unknown",
  ];

  // 타입 우선순위에 따라 정렬된 배열로 변환
  return Object.keys(groups)
    .sort((a, b) => {
      const indexA = typeOrder.indexOf(a);
      const indexB = typeOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .map((type) => ({
      type,
      label: getFileTypeLabel(type),
      attachments: groups[type],
    }));
}

// 최신순 정렬
export function sortByRecent(attachments: Attachment[]): Attachment[] {
  if (!attachments || !Array.isArray(attachments)) return [];
  return [...attachments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// 파일 크기 형식화
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// 날짜 형식화
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dateStr === now.toISOString().split("T")[0]) {
    return "오늘";
  }

  if (dateStr === yesterday.toISOString().split("T")[0]) {
    return "어제";
  }

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 파일 아이콘 정보 구하기
export function getFileIconInfo(mimeType: string): {
  type: string;
  color: string;
} {
  const fileType = mimeType?.split("/")[0] || "unknown";
  let type = fileType;

  // 애플리케이션 타입 세분화
  if (fileType === "application") {
    const subType = mimeType.split("/")[1] || "";

    if (subType.includes("pdf")) {
      type = "pdf";
    } else if (subType.includes("word") || subType.includes("doc")) {
      type = "document";
    } else if (subType.includes("excel") || subType.includes("sheet")) {
      type = "spreadsheet";
    } else if (
      subType.includes("powerpoint") ||
      subType.includes("presentation")
    ) {
      type = "presentation";
    } else if (
      subType.includes("zip") ||
      subType.includes("rar") ||
      subType.includes("7z")
    ) {
      type = "archive";
    } else if (
      subType.includes("json") ||
      subType.includes("xml") ||
      subType.includes("html")
    ) {
      type = "code";
    }
  }

  // 타입별 색상
  const colors: Record<string, string> = {
    image: "text-blue-500",
    video: "text-red-500",
    audio: "text-purple-500",
    pdf: "text-red-600",
    document: "text-blue-600",
    spreadsheet: "text-green-600",
    presentation: "text-orange-500",
    archive: "text-gray-600",
    code: "text-cyan-600",
    text: "text-gray-700",
    unknown: "text-gray-500",
  };

  return {
    type,
    color: colors[type] || "text-gray-500",
  };
}

export function getCurrentDate(): string {
  const date = new Date();

  const year: number = date.getFullYear();
  const month: string = String(date.getMonth() + 1).padStart(2, "0");
  const day: string = String(date.getDate()).padStart(2, "0");

  return `${year}년 ${month}월 ${day}일`;
}

export function formatDate(
  dateInput: string,
  type: "date" | "dateTime"
): string {
  const date = new Date(dateInput);

  // 2) 유효하지 않은 날짜면 빈 문자열 반환
  if (isNaN(date.getTime())) {
    console.warn(`[formatDate] 잘못된 날짜 입력: ${dateInput}`);
    return "";
  }

  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 3) 년·월·일
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // 4) 오전/오후 및 12시간제 시:분
  const hours24 = date.getHours();
  const ampm = hours24 < 12 ? "오전" : "오후";
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // 5) 최종 조합
  if (type === "date") {
    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === -1) {
      return "어제";
    } else if (diffDays === -2) {
      return "2일 전";
    } else {
      return `${year}년 ${month}월 ${day}일`;
    }
  }

  return `${year}년 ${month}월 ${day}일 ${ampm} ${String(hours12).padStart(2, "0")}:${minutes}`;
}

export function calculateDaysRemaining(earliestExpiration: string): number {
  const today = new Date();
  const expirationDate = new Date(earliestExpiration);

  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

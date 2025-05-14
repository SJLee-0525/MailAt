import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";

import { useState } from "react";

interface Schedule {
  id: string;
  title: string;
}

interface Schedules {
  [date: string]: Schedule[];
}

export const useCalendar = () => {
  // 현재 날짜 상태를 저장
  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 날짜를 연도, 월, 일로 분할하여 저장
  const [currentYear, currentMonth, currentDay] = format(
    currentDate,
    "yyyy-MM-dd"
  ).split("-");

  // 선택된 날짜 상태를 저장 (기본값: 오늘 날짜)
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // 일정 저장을 위한 상태
  const [schedules, setSchedules] = useState<Schedules>({});

  // 현재 월의 시작과 끝을 계산
  const startCurrentMonth = startOfMonth(currentDate);
  const endCurrentMonth = endOfMonth(currentDate);

  // 현재 월이 포함된 첫째 주의 시작과 마지막 주의 끝을 계산 (일요일 시작 기준)
  const startOfFirstWeek = startOfWeek(startCurrentMonth, { weekStartsOn: 0 });
  const endOfLastWeek = endOfWeek(endCurrentMonth, { weekStartsOn: 0 });

  // 달력에서 표시할 날짜 리스트 생성 (이전 달, 다음 달 포함)
  const days = eachDayOfInterval({
    start: startOfFirstWeek,
    end: endOfLastWeek,
  });

  // 이전 연도로 이동하는 함수
  function handlePrevYear() {
    setCurrentDate((prevDate) => {
      return subYears(prevDate, 1);
    });
  }

  // 다음 연도로 이동하는 함수
  function handleNextYear() {
    setCurrentDate((prevDate) => {
      return addYears(prevDate, 1);
    });
  }

  // 이전 달로 이동하는 함수
  function handlePrevMonth() {
    setCurrentDate((prevDate) => {
      return subMonths(prevDate, 1);
    });
  }

  // 다음 달로 이동하는 함수
  function handleNextMonth() {
    setCurrentDate((prevDate) => {
      return addMonths(prevDate, 1);
    });
  }

  // 날짜를 선택하는 함수
  function handleSelectDate(date: string) {
    setSelectedDate(() => {
      // prevDate is not used, so it can be removed or typed if used later
      handleAutoMoveMonth(date); // 최신 날짜 값을 전달하여 동작
      return date; // 새로운 날짜로 상태 업데이트
    });
  }

  // 선택한 날짜가 현재 달력의 월과 다를 경우, 자동으로 월을 이동하는 함수
  function handleAutoMoveMonth(newSelectedDate: string) {
    // 선택한 날짜에서 연도와 월을 추출
    const [selectedYear, selectedMonth] = newSelectedDate
      .split("-")
      .map(Number);

    // 현재 표시 중인 날짜에서 연도와 월을 추출
    const [currentYear, currentMonth] = [
      currentDate.getFullYear(),
      currentDate.getMonth() + 1, // getMonth()는 0부터 시작하므로 +1 필요
    ];

    // 선택한 날짜가 현재 달력의 월과 다르면 월 변경 처리
    if (currentYear !== selectedYear || currentMonth !== selectedMonth) {
      if (
        selectedYear > currentYear || // 선택한 연도가 더 크거나
        (selectedYear === currentYear && selectedMonth > currentMonth) // 같은 연도에서 선택한 월이 더 큰 경우
      ) {
        handleNextMonth(); // 다음 달로 이동
      } else {
        handlePrevMonth(); // 이전 달로 이동
      }
    }
  }

  // 달력에 표시할 날짜 정보를 객체 배열로 변환
  const daysInMonth = days.map((day: Date) => ({
    date: format(day, "yyyy-MM-dd"),
    year: format(day, "yyyy"),
    month: format(day, "MM"),
    day: format(day, "dd"),
    dayIndexOfWeek: getDay(day), // 요일 인덱스 (0: 일요일 ~ 6: 토요일)
  }));

  // 일정 추가 함수
  function handleAddSchedule(date: string, schedule: Schedule) {
    setSchedules((prevSchedules) => {
      let newScheduleArray: Schedule[];

      // 해당 날짜에 기존 일정이 있는 경우, 기존 일정에 새 일정 추가
      if (prevSchedules[date]) {
        newScheduleArray = [...prevSchedules[date], schedule];
      } else {
        // 해당 날짜에 일정이 없으면 새로운 배열 생성
        newScheduleArray = [schedule];
      }

      return { ...prevSchedules, [date]: newScheduleArray };
    });
  }

  return {
    currentDate: {
      year: currentYear,
      month: currentMonth,
      day: currentDay,
    },
    daysInMonth,
    dispatch: {
      handlePrevYear,
      handleNextYear,
      handlePrevMonth,
      handleNextMonth,
    },
    selectedDate: {
      date: selectedDate,
      selectDate: handleSelectDate,
    },
    schedules: {
      schedules: schedules,
      addSchedule: handleAddSchedule,
    },
  };
};

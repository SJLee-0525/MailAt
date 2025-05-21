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
  parseISO, // ISO 문자열 파싱을 위해 추가
} from "date-fns";

import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import useAuthenticateStore from "@stores/authenticateStore";

interface CalendarEventFromAPI {
  message_id?: number; // DB 스키마 및 실제 응답에 따라 옵셔널 또는 필수
  account_id?: number; // DB 스키마 및 실제 응답에 따라 옵셔널 또는 필수
  summary: string | null;
  scheduled_at: string | null; // ISO 8601 형식 (예: "2025-05-19T05:44:02.172Z")
  task: string | null;
}

interface Schedule {
  id: string;
  task: string;
  // 필요하다면 여기에 원래의 scheduled_at (Date 객체 또는 ISO 문자열)을 저장할 수 있습니다.
  // originalScheduledAt?: Date;
}

interface Schedules {
  [date: string]: Schedule[]; // 키는 "yyyy-MM-dd" 형식
}

export const useCalendar = () => {
  const { user } = useAuthenticateStore();
  const accountId = user?.userId;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [schedules, setSchedules] = useState<Schedules>({});

  const {
    data: apiCalendarEvents,
    isLoading: isLoadingEvents,
    error: calendarEventsError,
  } = useQuery<CalendarEventFromAPI[], Error>({
    queryKey: [
      "calendarEvents",
      accountId,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
    ],
    queryFn: async () => {
      if (!accountId) {
        return [];
      }
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      // calendarService가 ISO 8601 형식으로 날짜를 처리하도록 수정되었다고 가정
      const response = await window.electronAPI.calendar.getEvents({
        accountId,
        year,
        month,
      });
      if (response.success && response.data) {
        return response.data as CalendarEventFromAPI[];
      }
      throw new Error("캘린더 이벤트를 불러오는데 실패했습니다.");
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (apiCalendarEvents) {
      const newSchedules: Schedules = {};
      apiCalendarEvents.forEach((event, index) => {
        if (event.scheduled_at && event.task) {
          try {
            // ISO 8601 형식의 문자열을 Date 객체로 파싱
            const dateObj = parseISO(event.scheduled_at);
            // Date 객체를 "yyyy-MM-dd" 형식의 문자열로 변환하여 키로 사용
            const eventDate = format(dateObj, "yyyy-MM-dd");

            if (!newSchedules[eventDate]) {
              newSchedules[eventDate] = [];
            }
            // message_id가 API 응답에 실제로 오는지 확인 필요. 없다면 index 등을 활용.
            const scheduleId = event.message_id
              ? String(event.message_id)
              : `event-${index}-${Date.now()}`;
            newSchedules[eventDate].push({
              id: scheduleId,
              task: event.task,
              // originalScheduledAt: dateObj, // 필요시 원래 Date 객체도 저장
            });
          } catch (e) {
            console.warn(
              `[useCalendarHook] scheduled_at 파싱 오류 (ISO 형식 예상): ${event.scheduled_at}`,
              e
            );
          }
        }
      });
      setSchedules(newSchedules);
    } else if (calendarEventsError) {
      setSchedules({});
      console.error(
        "[useCalendarHook] 캘린더 이벤트 로딩 오류:",
        calendarEventsError.message
      );
    }
  }, [apiCalendarEvents, calendarEventsError]);

  const startCurrentMonth = startOfMonth(currentDate);
  const endCurrentMonth = endOfMonth(currentDate);
  const startOfFirstWeek = startOfWeek(startCurrentMonth, { weekStartsOn: 0 });
  const endOfLastWeek = endOfWeek(endCurrentMonth, { weekStartsOn: 0 });
  const days = eachDayOfInterval({
    start: startOfFirstWeek,
    end: endOfLastWeek,
  });

  function handlePrevYear() {
    setCurrentDate((prevDate) => subYears(prevDate, 1));
  }

  function handleNextYear() {
    setCurrentDate((prevDate) => addYears(prevDate, 1));
  }

  function handlePrevMonth() {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const [selectedYear, selectedMonth] = date.split("-").map(Number);
    if (
      currentDate.getFullYear() !== selectedYear ||
      currentDate.getMonth() + 1 !== selectedMonth
    ) {
      setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1));
    }
  }

  const daysInMonth = days.map((day: Date) => ({
    date: format(day, "yyyy-MM-dd"),
    year: format(day, "yyyy"),
    month: format(day, "MM"),
    day: format(day, "dd"),
    dayIndexOfWeek: getDay(day),
  }));

  function handleAddSchedule(date: string, schedule: Schedule) {
    // TODO: API 연동 (useMutation 사용)
    setSchedules((prevSchedules) => {
      const newScheduleArray = prevSchedules[date]
        ? [...prevSchedules[date], schedule]
        : [schedule];
      return { ...prevSchedules, [date]: newScheduleArray };
    });
  }

  return {
    currentDateInfo: {
      year: format(currentDate, "yyyy"),
      month: format(currentDate, "MM"),
      day: format(currentDate, "dd"),
      currentFullDate: currentDate,
    },
    daysInMonth,
    dispatch: {
      handlePrevYear,
      handleNextYear,
      handlePrevMonth,
      handleNextMonth,
    },
    selectedDateInfo: {
      date: selectedDate,
      selectDate: handleSelectDate,
    },
    schedulesData: {
      schedules: schedules,
      addSchedule: handleAddSchedule,
      isLoading: isLoadingEvents,
      error: calendarEventsError,
    },
  };
};

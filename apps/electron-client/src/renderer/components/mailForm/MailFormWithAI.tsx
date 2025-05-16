import React, { forwardRef, useState, useEffect, useRef } from "react";

import SenderList from "@components/mailForm/components/SenderList";
import MailTextEditor from "@components/mailForm/components/MailTextEditor";
import useModalStore from "@stores/modalStore";

// Gemini API 설정 상수
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyDwxwFfDd-Z4GQq5kfMDVa1GgUtDlUOOaA";

// 디바운스 훅
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface MailFormWithAIProps {
  sender: string[];
  addSender: (e: React.FormEvent) => void;
  deleteSender: (email: string) => void;
  cc: string[];
  addCc: (e: React.FormEvent) => void;
  deleteCc: (email: string) => void;
  bcc: string[];
  addBcc: (e: React.FormEvent) => void;
  deleteBcc: (email: string) => void;
  initialHtml: string;
  setHtml: (html: string) => void;
}

// 부모로부터 title input ref를 받아서 연동하기 위해 forwardRef 사용
const MailFormWithAI = forwardRef<HTMLInputElement, MailFormWithAIProps>(
  (
    {
      sender,
      addSender,
      deleteSender,
      cc,
      addCc,
      deleteCc,
      bcc,
      addBcc,
      deleteBcc,
      initialHtml,
      setHtml,
    },
    titleRef
  ) => {
    const { openAlertModal } = useModalStore();
    const [isCcOpen, setIsCcOpen] = useState(false);
    const [isBccOpen, setIsBccOpen] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [mode, setMode] = useState<"autocomplete" | "full-email">(
      "autocomplete"
    );

    // AI 관련 상태
    const [suggestion, setSuggestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [correctionMode, setCorrectionMode] = useState(false);
    const [correctionSuggestion, setCorrectionSuggestion] = useState("");
    const [fullEmailSuggestion, setFullEmailSuggestion] = useState("");
    const [plainText, setPlainText] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);

    // 이메일 생성 관련 추가 상태
    const [emailGenerated, setEmailGenerated] = useState(false);
    const [regenerateEnabled, setRegenerateEnabled] = useState(false);
    const regenerateCooldownRef = useRef<NodeJS.Timeout | null>(null);

    // 토스트 표시 상태
    const [showToast, setShowToast] = useState(false);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 제안 비활성화 상태
    const [suggestionPaused, setSuggestionPaused] = useState(false);
    const suggestionPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 에디터의 내용이 변경되면 일반 텍스트로 변환해서 AI에 전달하기 위함
    useEffect(() => {
      if (initialHtml) {
        // HTML에서 태그를 제거하고 텍스트만 추출
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = initialHtml;
        setPlainText(tempDiv.textContent || tempDiv.innerText || "");
      } else {
        setPlainText("");
      }
    }, [initialHtml]);

    // 디바운스된 텍스트
    const debouncedText = useDebounce(plainText, 500);

    // 제안이 있을 때 토스트 메시지 표시
    useEffect(() => {
      if (
        suggestion ||
        correctionMode ||
        fullEmailSuggestion ||
        emailGenerated
      ) {
        setShowToast(true);

        // 이전 타임아웃이 있으면 제거
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        // 10초 후에 토스트 숨기기 (이메일 생성 상태에서는 15초)
        toastTimeoutRef.current = setTimeout(
          () => {
            setShowToast(false);
          },
          emailGenerated ? 15000 : 10000
        );
      } else {
        setShowToast(false);
      }

      return () => {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
      };
    }, [suggestion, correctionMode, fullEmailSuggestion, emailGenerated]);

    // 재생성 활성화 함수
    const enableRegeneration = () => {
      setRegenerateEnabled(true);
      setSuggestionPaused(false);

      // 기존 타임아웃 정리
      if (regenerateCooldownRef.current) {
        clearTimeout(regenerateCooldownRef.current);
      }

      // 일정 시간 후 다시 재생성 비활성화 (선택적)
      regenerateCooldownRef.current = setTimeout(() => {
        setRegenerateEnabled(false);
      }, 300000); // 5분 후 다시 비활성화
    };

    // AI 자동완성 제안 가져오기
    const getSuggestion = async (text: string) => {
      // 이미 생성되었고 재생성이 활성화되지 않았으면 전체 이메일 생성 방지
      if (mode === "full-email" && emailGenerated && !regenerateEnabled) {
        return;
      }

      if (text.length < 5 || !aiEnabled || suggestionPaused) return;

      try {
        setLoading(true);

        // 현재 모든 제안 초기화
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");

        let promptText = "";
        const titleValue =
          (titleRef as React.RefObject<HTMLInputElement>)?.current?.value || "";
        const recipientsText = sender.join(", ");

        if (mode === "autocomplete") {
          // 자동완성 모드 프롬프트
          promptText = `당신은 비즈니스 이메일 자동완성 AI입니다. 입력 내용에 따라 아래 두 가지 모드 중 하나로만 응답하세요:

[맞춤법 수정 모드]
입력 내용에 맞춤법 오류나 비즈니스 톤에 맞지 않는 표현이 있으면, 응답 시작에 "[CORRECTION]"을 붙이고 수정된 전체 문장을 제공하세요.

[자동완성 모드]
맞춤법이나 표현에 문제가 없다면, 응답 시작에 "[COMPLETION]"을 붙이고 커서 위치에서 이어질 자연스러운 문장만 제공하세요.
입력값은 포함하지 마시고 그 뒤에 이어질 자연스러운 문장만 제공하세요.

비즈니스 이메일 톤:
- 공식적이고 예의 바른 표현을 사용하세요.
- 존칭과 높임말을 적절히 사용하세요.
- "~드립니다", "~하겠습니다", "감사합니다" 등의 정중한 표현을 사용하세요.

특별 규칙:
- "안녕하세요" 뒤에는 반드시 "[소속]팀 소속 [이름]입니다."와 같은 형식으로 소속과 이름을 제안하세요.
- 소속과 이름은 구체적 값이 아닌 형식으로만 제공하세요.
- 입력값이 위 형식으로 잘 나타나있으면 수정하지 않습니다.`;
        } else {
          // 전체 이메일 생성 모드 프롬프트
          promptText = `당신은 비즈니스 이메일 생성 AI입니다. 사용자의 간단한 내용을 바탕으로 완전한 비즈니스 이메일 형식으로 변환하세요.

사용자의 초안 내용을 바탕으로, 다음 요소를 포함한 완전한 비즈니스 이메일을 작성하세요:
1. 자기 소개 (필요 시)
2. 주요 내용 (사용자 입력 기반)
3. 추가 필요한 정보 요청 또는 다음 단계 제안
4. 정중한 마무리 인사

응답 시작에 "[FULL-EMAIL]"을 붙이고 전체 이메일 내용을 제공하세요.
제목은 다시 제공할 필요가 없습니다.
가독성이 좋을 수 있도록 적절하게 띄어쓰기를 적용하여 답변하세요.
사용자가 직접 입력할 부분은 [대괄호]로 표시하고, 해당 내용이 무엇인지 간단히 설명해주세요. 
예: [회사명], [이름], [직책], [날짜] 등

비즈니스 이메일 톤:
- 공식적이고 예의 바른 표현을 사용하세요.
- 존칭과 높임말을 적절히 사용하세요.
- "~드립니다", "~하겠습니다", "감사합니다" 등의 정중한 표현을 사용하세요.
- 간결하고 명확하게 작성하세요. 작성 목적 및 핵심을 잘 표현하는게 중요합니다.`;
        }

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `${promptText}

수신자: ${recipientsText}
제목: ${titleValue}
내용: ${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: mode === "autocomplete" ? 50 : 300,
            topK: 40,
            topP: 0.95,
          },
        };

        const response = await fetch(
          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
          const responseText = data.candidates[0].content.parts[0].text.trim();

          if (mode === "autocomplete") {
            // 자동완성 모드 응답 처리
            if (responseText.startsWith("[CORRECTION]")) {
              // 맞춤법 수정 제안
              const correctedText = responseText
                .replace("[CORRECTION]", "")
                .trim();
              setCorrectionMode(true);
              setCorrectionSuggestion(correctedText);
              setSuggestion("");
              setFullEmailSuggestion("");
            } else if (responseText.startsWith("[COMPLETION]")) {
              // 자동완성 제안
              const completionText = responseText
                .replace("[COMPLETION]", "")
                .trim();
              setCorrectionMode(false);
              setSuggestion(completionText);
              setFullEmailSuggestion("");
            } else {
              // 태그가 없는 경우 기본적으로 자동완성으로 처리
              setCorrectionMode(false);
              setSuggestion(responseText);
              setFullEmailSuggestion("");
            }
          } else {
            // 전체 이메일 생성 모드 응답 처리
            const fullEmail = responseText.replace("[FULL-EMAIL]", "").trim();
            setFullEmailSuggestion(fullEmail);
            setSuggestion("");
            setCorrectionMode(false);
          }
        } else {
          setSuggestion("");
          setCorrectionMode(false);
          setFullEmailSuggestion("");
        }
      } catch (error) {
        console.error("AI 제안 가져오기 오류:", error);
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
      } finally {
        setLoading(false);
      }
    };

    // 텍스트 변경될 때마다 추천 업데이트
    useEffect(() => {
      // 제안 일시 중단 상태거나 AI가 비활성화되었으면 제안 생성하지 않음
      if (suggestionPaused || !aiEnabled || !debouncedText) {
        return;
      }

      // 이미 생성되었고 재생성이 활성화되지 않았으면 전체 이메일 모드에서 생성하지 않음
      if (mode === "full-email" && emailGenerated && !regenerateEnabled) {
        return;
      }

      getSuggestion(debouncedText);
    }, [
      debouncedText,
      mode,
      aiEnabled,
      suggestionPaused,
      emailGenerated,
      regenerateEnabled,
    ]);

    // 제안 일시 중단 함수
    const pauseSuggestion = (durationMs = 2000) => {
      setSuggestionPaused(true);

      // 이전 타이머가 있으면 제거
      if (suggestionPauseTimeoutRef.current) {
        clearTimeout(suggestionPauseTimeoutRef.current);
      }

      // 지정된 시간 후 다시 제안 활성화
      suggestionPauseTimeoutRef.current = setTimeout(() => {
        setSuggestionPaused(false);
      }, durationMs);
    };

    // 자동완성 제안 수락 처리
    const acceptSuggestion = () => {
      if (suggestion) {
        // 현재 HTML에 제안 추가 (줄바꿈 보존)
        const formattedSuggestion = suggestion
          .replace(/\n/g, "<br>")
          .replace(/\s\s/g, "&nbsp;&nbsp;");

        const newHtml = initialHtml + formattedSuggestion;
        setHtml(newHtml);
        setSuggestion("");
        setShowToast(false);

        // 제안 일시 중단 (1.5초)
        pauseSuggestion(1500);
      }
    };

    // 맞춤법 수정 제안 수락 처리
    const acceptCorrection = () => {
      if (correctionSuggestion) {
        // 텍스트를 HTML로 변환 (줄바꿈 보존)
        const formattedCorrection = correctionSuggestion
          .replace(/\n/g, "<br>")
          .replace(/\s\s/g, "&nbsp;&nbsp;");

        setHtml(formattedCorrection);
        setCorrectionMode(false);
        setCorrectionSuggestion("");
        setShowToast(false);

        // 제안 일시 중단 (1.5초)
        pauseSuggestion(1500);
      }
    };

    // 전체 이메일 제안 수락
    const acceptFullEmail = () => {
      if (fullEmailSuggestion) {
        // HTML 형식으로 변환 (줄바꿈 보존)
        const formattedHtml = fullEmailSuggestion
          .replace(/\n/g, "<br>")
          .replace(/\s\s/g, "&nbsp;&nbsp;");

        setHtml(formattedHtml);
        setFullEmailSuggestion("");
        setShowToast(false);

        // 이메일 생성 완료 상태로 설정
        setEmailGenerated(true);
        // 재생성 비활성화
        setRegenerateEnabled(false);

        // 제안 일시 중단 (장시간 - 사실상 수동으로 활성화할 때까지 중단)
        pauseSuggestion(3600000); // 1시간 동안 제안 일시 중단

        // 재생성 버튼을 위한 토스트 표시
        setShowToast(true);

        // 이전 타임아웃이 있으면 제거
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        // 토스트 메시지 지속 시간 설정
        toastTimeoutRef.current = setTimeout(() => {
          setShowToast(false);
        }, 15000); // 15초 동안 토스트 표시
      }
    };

    // AI 활성화/비활성화 토글
    const toggleAI = () => {
      setAiEnabled(!aiEnabled);
      // AI 비활성화 시 모든 제안 초기화
      if (aiEnabled) {
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
        setShowToast(false);
      }
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        if (suggestionPauseTimeoutRef.current) {
          clearTimeout(suggestionPauseTimeoutRef.current);
        }
        if (regenerateCooldownRef.current) {
          clearTimeout(regenerateCooldownRef.current);
        }
      };
    }, []);

    // Tab 키로 제안 수락 처리
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Tab" && showToast) {
        if (suggestion) {
          e.preventDefault();
          acceptSuggestion();
        } else if (correctionMode) {
          e.preventDefault();
          acceptCorrection();
        } else if (fullEmailSuggestion) {
          e.preventDefault();
          acceptFullEmail();
        }
      } else if (e.key === "Escape" && showToast) {
        e.preventDefault();
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
        setShowToast(false);
      }
    };

    return (
      <div
        className="relative flex flex-col w-full h-full rounded-lg bg-white p-2 font-pre-bold"
        onKeyDown={handleKeyDown}
      >
        {/* 모던한 AI 컨트롤 */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`flex items-center gap-3 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              aiEnabled
                ? "bg-gradient-to-r from-theme/90 to-theme shadow-md"
                : "bg-gradient-to-r from-light2 to-light1"
            }`}
            onClick={toggleAI}
          >
            <div className="flex items-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-colors"
                stroke={aiEnabled ? "#ffffff" : "#7d7983"}
                strokeWidth="1.5"
              >
                <path
                  d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  fill={aiEnabled ? "#ffffff" : "none"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className={`ml-1 text-sm font-pre-medium transition-colors ${aiEnabled ? "text-white" : "text-title"}`}
              >
                AI {aiEnabled ? "활성화" : "비활성화"}
              </span>
            </div>

            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${
                aiEnabled ? "bg-white/30" : "bg-light3"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  aiEnabled ? "translate-x-5" : ""
                }`}
              ></div>
            </div>
          </div>

          {aiEnabled && (
            <div className="flex-1 flex rounded-full overflow-hidden shadow-sm">
              <button
                type="button"
                className={`flex-1 text-xs px-4 py-1.5 transition-all duration-200 ${
                  mode === "autocomplete"
                    ? "bg-theme text-white font-pre-semibold"
                    : "bg-white text-content hover:bg-light1/50"
                }`}
                onClick={() => {
                  setMode("autocomplete");
                  // 자동 완성 모드로 변경 시 이메일 생성 상태 초기화 옵션
                  // setEmailGenerated(false);
                }}
              >
                자동완성
              </button>
              <button
                type="button"
                className={`flex-1 text-xs px-4 py-1.5 transition-all duration-200 ${
                  mode === "full-email"
                    ? "bg-theme text-white font-pre-semibold"
                    : "bg-white text-content hover:bg-light1/50"
                }`}
                onClick={() => setMode("full-email")}
              >
                전체 이메일 생성
              </button>
            </div>
          )}

          {aiEnabled && loading && (
            <div className="absolute top-14 left-0 right-0 h-0.5">
              <div className="h-full bg-theme/70 rounded-full animate-pulse-loading shadow-sm"></div>
            </div>
          )}
        </div>

        {/* 수신자 표시 */}
        {(sender.length > 0 || cc.length > 0 || bcc.length > 0) && (
          <SenderList
            sender={sender}
            deleteSender={deleteSender}
            cc={cc}
            deleteCc={deleteCc}
            bcc={bcc}
            deleteBcc={deleteBcc}
          />
        )}

        {/* 받는 사람 입력 폼 */}
        <form
          onSubmit={addSender}
          className="flex justify-between items-center h-fit border-b-2 border-light1"
        >
          <input
            name="sender"
            type="text"
            placeholder="받는 사람"
            className="w-full h-9 text-sm focus:outline-none focus:bg-gray-100"
          />
          <span className="flex items-center justify-between w-fit h-9 gap-2.5 text-sm">
            <button
              type="button"
              onClick={() => setIsCcOpen(!isCcOpen)}
              className="font-pre-bold text-xs whitespace-nowrap"
            >
              참조
            </button>
            <button
              type="button"
              onClick={() => setIsBccOpen(!isBccOpen)}
              className="font-pre-bold text-xs whitespace-nowrap"
            >
              숨은 참조
            </button>
          </span>
        </form>

        {/* 참조 입력 폼 */}
        {isCcOpen && (
          <form className="h-fit" onSubmit={addCc}>
            <input
              name="cc"
              type="text"
              placeholder="참조"
              className="w-full h-9 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
            />
          </form>
        )}

        {/* 숨은 참조 입력 폼 */}
        {isBccOpen && (
          <form className="h-fit" onSubmit={addBcc}>
            <input
              name="bcc"
              type="text"
              placeholder="숨은 참조"
              className="w-full h-9 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
            />
          </form>
        )}

        {/* 제목 입력 */}
        <input
          ref={titleRef}
          name="title"
          type="text"
          placeholder="제목"
          className="w-full h-10 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
        />

        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between w-full h-9 text-sm">
            본문
          </div>

          {/* AI 로딩 인디케이터 제거 - 상단에 통합 */}

          {/* 본문 에디터 */}
          <div className="relative flex-1 overflow-hidden">
            <MailTextEditor initialHtml={initialHtml} setHtml={setHtml} />

            {/* 토스트 메시지 - 제안 표시 */}
            {showToast && (
              <div className="fixed bottom-4 right-4 max-w-xs z-50 transform transition-all duration-300 ease-in-out">
                {/* 자동완성 제안 */}
                {suggestion && (
                  <div className="bg-white rounded-lg shadow-lg p-3 mb-2 border-l-4 border-theme animate-fade-in">
                    <p className="text-xs text-content mb-1 flex justify-between">
                      <span>자동완성 제안</span>
                      <span className="text-theme">Tab 키로 수락</span>
                    </p>
                    <p className="text-sm bg-light1 p-2 rounded whitespace-pre-wrap">
                      {suggestion}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowToast(false)}
                        className="text-xs px-2 py-1 rounded bg-light2 hover:bg-light3 text-title"
                      >
                        무시
                      </button>
                      <button
                        type="button"
                        onClick={acceptSuggestion}
                        className="text-xs px-2 py-1 rounded bg-theme text-white hover:bg-theme-dark"
                      >
                        수락
                      </button>
                    </div>
                  </div>
                )}

                {/* 맞춤법 수정 제안 */}
                {correctionMode && (
                  <div className="bg-white rounded-lg shadow-lg p-3 mb-2 border-l-4 border-warning animate-fade-in">
                    <p className="text-xs text-content mb-1 flex justify-between">
                      <span>맞춤법 수정 제안</span>
                      <span className="text-warning">Tab 키로 수락</span>
                    </p>
                    <p className="text-sm bg-light1 p-2 rounded whitespace-pre-wrap">
                      {correctionSuggestion}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowToast(false)}
                        className="text-xs px-2 py-1 rounded bg-light2 hover:bg-light3 text-title"
                      >
                        무시
                      </button>
                      <button
                        type="button"
                        onClick={acceptCorrection}
                        className="text-xs px-2 py-1 rounded bg-warning text-white hover:bg-amber-600"
                      >
                        수정
                      </button>
                    </div>
                  </div>
                )}

                {/* 전체 이메일 제안 */}
                {fullEmailSuggestion && (
                  <div className="bg-white rounded-lg shadow-lg p-3 mb-2 border-l-4 border-accept animate-fade-in">
                    <p className="text-xs text-content mb-1 flex justify-between">
                      <span>이메일 자동 작성</span>
                      <span className="text-accept">Tab 키로 수락</span>
                    </p>
                    {/* 전체 이메일 제안 */}
                    <div className="text-sm bg-light1 p-2 rounded max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {fullEmailSuggestion}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowToast(false)}
                        className="text-xs px-2 py-1 rounded bg-light2 hover:bg-light3 text-title"
                      >
                        무시
                      </button>
                      <button
                        type="button"
                        onClick={acceptFullEmail}
                        className="text-xs px-2 py-1 rounded bg-accept text-white hover:bg-blue-700"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default MailFormWithAI;

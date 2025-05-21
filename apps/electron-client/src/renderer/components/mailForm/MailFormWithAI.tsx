import React, { forwardRef, useState, useEffect, useRef } from "react";

import { MailFormWithAIProps } from "@/types/emailTypes";
import {
  AUTO_COMPLETE_PROMPT_TEXT,
  AUTO_COMPLETE_ALL_PROMPT_TEXT,
} from "@data/AI_AUTOFILL";

import useUserProgressStore from "@stores/userProgressStore";

import { generateEmailContent } from "@apis/emailApi";
import { useDebounce } from "@hooks/useDebounceHook";

import SenderList from "@components/mailForm/components/SenderList";
import MailTextEditor from "@components/mailForm/components/MailTextEditor";

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
    const {
      setLoading: setApiLoading,
      setLoadingMessage,
      setCloseLoadingMessage,
    } = useUserProgressStore();

    // UI 관련 상태
    const [isCcOpen, setIsCcOpen] = useState(false);
    const [isBccOpen, setIsBccOpen] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [mode, setMode] = useState<"autocomplete" | "full-email">(
      "autocomplete"
    );

    // AI 관련 상태
    const [suggestion, setSuggestion] = useState(""); // 커서 뒤 고스트 텍스트
    const [loading, setLoading] = useState(false);
    const [correctionMode, setCorrectionMode] = useState(false);
    const [correctionSuggestion, setCorrectionSuggestion] = useState("");
    const [fullEmailSuggestion, setFullEmailSuggestion] = useState("");
    const [plainText, setPlainText] = useState("");
    const [cursorBounds, setCursorBounds] = useState<{
      left: number;
      top: number;
      height: number;
      width: number;
    } | null>(null);

    // 이메일 생성 상태 (full-email 모드 전용)
    const [emailGenerated, setEmailGenerated] = useState(false);
    const [regenerateEnabled, setRegenerateEnabled] = useState(false);
    const regenerateCooldownRef = useRef<NodeJS.Timeout | null>(null);

    // 토스트(맞춤법/전체메일) 표시 상태
    const [showToast, setShowToast] = useState(false);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. 에디터 HTML → plain text 변환
    useEffect(() => {
      if (initialHtml) {
        const tmp = document.createElement("div");
        tmp.innerHTML = initialHtml;
        setPlainText(tmp.textContent || tmp.innerText || "");
      } else {
        setPlainText("");
      }
    }, [initialHtml]);

    const debouncedText = useDebounce(plainText, 500);

    // 2. Gemini API 호출
    async function getSuggestion(text: string) {
      if (text.length < 5 || !aiEnabled) return;
      // full-email 모드에서 이미 생성됐고 재생성 비활성화 시 무시
      if (mode === "full-email" && emailGenerated && !regenerateEnabled) return;

      setApiLoading(true);
      setLoadingMessage("AI 제안 중...");

      try {
        setLoading(true);

        // 프롬프트 준비
        const title =
          (titleRef as React.RefObject<HTMLInputElement>)?.current?.value || "";
        const recipients = sender.join(", ");
        const promptText =
          mode === "autocomplete"
            ? AUTO_COMPLETE_PROMPT_TEXT
            : AUTO_COMPLETE_ALL_PROMPT_TEXT;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `${promptText}
                  수신자: ${recipients}
                  제목: ${title}
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

        const data = await generateEmailContent(requestBody);
        const responseText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

        if (mode === "autocomplete") {
          if (responseText.startsWith("[CORRECTION]")) {
            setLoadingMessage("AI 맞춤법 제안 중...");
            setCorrectionMode(true);
            setCorrectionSuggestion(
              responseText.replace("[CORRECTION]", "").trim()
            );
            setSuggestion("");
          } else {
            const compText = responseText.replace("[COMPLETION]", "").trim();

            setLoadingMessage("AI 자동완성 제안 중...");
            setCorrectionMode(false);
            setSuggestion(compText);
          }
        } else {
          setFullEmailSuggestion(
            responseText.replace("[FULL-EMAIL]", "").trim()
          );

          setLoadingMessage("AI 전체메일 제안 중...");
          setCorrectionMode(false);
          setSuggestion("");
        }
      } catch (err) {
        // console.error("AI 제안 오류", err);
        setLoadingMessage("AI 제안 오류");
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
      } finally {
        setLoading(false);
        setApiLoading(false);
        setLoadingMessage("AI 제안 완료");
        setCloseLoadingMessage();
      }
    }

    // 3. 디바운스된 텍스트 감시
    useEffect(() => {
      if (!aiEnabled) return;
      if (mode === "autocomplete") {
        if (debouncedText) getSuggestion(debouncedText);
      } else {
        // full-email 모드 처리
        if (debouncedText) getSuggestion(debouncedText);
      }
    }, [debouncedText, aiEnabled, mode]);

    // 4. 맞춤법/전체메일 토스트 표시 관리
    useEffect(() => {
      if (correctionMode || fullEmailSuggestion) {
        setShowToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowToast(false), 15000);
      } else {
        setShowToast(false);
      }

      return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
    }, [correctionMode, fullEmailSuggestion]);

    // 5. 제안 수락/거절 핸들러
    function acceptSuggestion() {
      if (!suggestion) return;
      const formatted = suggestion
        .replace(/\n/g, "<br>")
        .replace(/\s\s/g, "&nbsp;&nbsp;");
      setHtml(initialHtml + formatted);
      setSuggestion("");
    }

    function acceptCorrection() {
      if (!correctionSuggestion) return;
      const formatted = correctionSuggestion
        .replace(/\n/g, "<br>")
        .replace(/\s\s/g, "&nbsp;&nbsp;");
      setHtml(formatted);
      setCorrectionMode(false);
      setCorrectionSuggestion("");
    }

    function acceptFullEmail() {
      if (!fullEmailSuggestion) return;
      const formatted = fullEmailSuggestion
        .replace(/\n/g, "<br>")
        .replace(/\s\s/g, "&nbsp;&nbsp;");
      setHtml(formatted);
      setFullEmailSuggestion("");
      setEmailGenerated(true);
      setRegenerateEnabled(false);
    }

    // 6. Tab / Esc 단축키
    function handleKeyDown(e: React.KeyboardEvent) {
      if (e.key === "Tab") {
        if (suggestion) {
          acceptSuggestion();
          e.preventDefault();
        } else if (correctionMode) {
          acceptCorrection();
          e.preventDefault();
        } else if (fullEmailSuggestion) {
          acceptFullEmail();
          e.preventDefault();
        }
      }
      if (e.key === "Escape") {
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
      }
    }

    // 7. AI 토글
    function toggleAI() {
      setAiEnabled(!aiEnabled);
      if (aiEnabled) {
        setSuggestion("");
        setCorrectionMode(false);
        setFullEmailSuggestion("");
      }
    }

    // 8. 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        if (regenerateCooldownRef.current)
          clearTimeout(regenerateCooldownRef.current);
      };
    }, []);

    // 9. JSX 렌더링
    return (
      <div
        className="flex flex-col w-full h-full justify-start items-center rounded-lg bg-white text-text p-2 font-pre-bold"
        onKeyDown={handleKeyDown}
      >
        {/* 수신자 블록 */}
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

        {/* 받는 사람 입력 */}
        <form
          onSubmit={addSender}
          className="flex justify-between items-center w-full h-fit border-b-2 border-light1"
        >
          <input
            name="sender"
            type="text"
            placeholder="받는 사람"
            className="w-full h-9 px-1 text-sm focus:outline-none focus:bg-light"
          />
          <span className="flex items-center justify-between w-fit h-9 gap-2.5 text-sm">
            <button
              type="button"
              onClick={() => setIsCcOpen(!isCcOpen)}
              className={`font-pre-bold text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                isCcOpen ? "bg-orange-400 text-white" : ""
              }`}
            >
              참조
            </button>
            <button
              type="button"
              onClick={() => setIsBccOpen(!isBccOpen)}
              className={`font-pre-bold text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                isBccOpen ? "bg-red-500 text-white" : ""
              }`}
            >
              숨은 참조
            </button>
          </span>
        </form>

        {/* 참조 입력 */}
        {isCcOpen && (
          <form className="w-full h-fit" onSubmit={addCc}>
            <input
              name="cc"
              type="text"
              placeholder="참조"
              className="w-full h-9 px-1 text-sm border-b-2 border-light1 bg-light focus:outline-none"
            />
          </form>
        )}

        {/* 숨은 참조 입력 */}
        {isBccOpen && (
          <form className="w-full h-fit" onSubmit={addBcc}>
            <input
              name="bcc"
              type="text"
              placeholder="숨은 참조"
              className="w-full h-9 px-1 text-sm border-b-2 border-light1 bg-light focus:outline-none"
            />
          </form>
        )}

        {/* 제목 입력 */}
        <div className="w-full h-fit">
          <input
            ref={titleRef}
            name="title"
            type="text"
            placeholder="제목"
            className="w-full h-9 px-1 text-sm border-b-2 border-light1 focus:outline-none focus:bg-light"
          />
        </div>

        {/* 본문 */}
        <div className="flex flex-col w-full flex-1 overflow-y-hidden">
          <div className="flex items-center justify-between w-full h-9 px-1 text-sm">
            본문
          </div>

          {/* AI 컨트롤 바 */}
          <div className="relative flex items-center w-full h-10 gap-4">
            {/* AI 토글 스위치 */}
            <div
              className={`flex items-center gap-3 px-3 py-1 rounded-full transition-all cursor-pointer ${
                aiEnabled ? "bg-accept shadow-md" : "bg-light"
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
                  className={`ml-1 text-sm font-pre-medium transition-colors ${
                    aiEnabled ? "text-[#ffffff]" : "text-light3"
                  }`}
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
                      ? "bg-accept text-[#ffffff] font-pre-semibold"
                      : "bg-light text-light3 hover:bg-light1/50"
                  }`}
                  onClick={() => {
                    setMode("autocomplete");
                    setSuggestion("");
                    setCorrectionMode(false);
                    setFullEmailSuggestion("");
                    if (emailGenerated) setRegenerateEnabled(true);
                  }}
                >
                  자동완성
                </button>
                <button
                  type="button"
                  className={`flex-1 text-xs px-4 py-1.5 transition-all duration-200 ${
                    mode === "full-email"
                      ? "bg-accept text-[#ffffff] font-pre-semibold"
                      : "bg-light text-light3 hover:bg-light1/50"
                  }`}
                  onClick={() => {
                    setMode("full-email");
                    setSuggestion("");
                    setCorrectionMode(false);
                    setFullEmailSuggestion("");
                  }}
                >
                  전체 이메일 생성
                </button>
              </div>
            )}

            {aiEnabled && loading && (
              <div className="absolute top-9 left-0 right-0 h-0.5">
                <div className="h-full bg-theme/70 rounded-full animate-pulse-loading shadow-sm"></div>
              </div>
            )}
          </div>

          {/* 에디터 */}
          <div className="relative h-full overflow-hidden">
            <MailTextEditor
              initialHtml={initialHtml}
              setHtml={setHtml}
              onCursorBoundsChange={setCursorBounds}
              ghostText={suggestion}
              cursorBounds={cursorBounds}
            />

            {/* 맞춤법/전체메일 토스트 */}
            {showToast && correctionMode && (
              <div className="fixed bottom-4 right-4 max-w-xs z-50 animate-fade-in">
                <div className="bg-white rounded-lg shadow-lg p-3 mb-2 border-l-4 border-warning">
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
              </div>
            )}

            {showToast && fullEmailSuggestion && (
              <div className="fixed bottom-4 right-4 max-w-xs z-50 animate-fade-in">
                <div className="bg-white rounded-lg shadow-lg p-3 mb-2 border-l-4 border-accept">
                  <p className="text-xs text-content mb-1 flex justify-between">
                    <span>이메일 자동 작성</span>
                    <span className="text-accept">Tab 키로 수락</span>
                  </p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default MailFormWithAI;

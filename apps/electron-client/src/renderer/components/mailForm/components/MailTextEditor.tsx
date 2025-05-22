import { useState, useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

interface Bounds {
  left: number;
  top: number;
  height: number;
  width: number;
}

interface MailTextEditorProps {
  initialHtml: string;
  setHtml: (html: string) => void;
  onCursorBoundsChange?: (b: Bounds | null) => void;
  ghostText?: string; // Copilot‑style 제안
  cursorBounds?: Bounds | null;
}

function useWindowSize() {
  const [height, setHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return height;
}

const GAP_RATIO = 0.043;

const MailTextEditor = ({
  initialHtml,
  setHtml,
  onCursorBoundsChange,
  ghostText,
  cursorBounds,
}: MailTextEditorProps) => {
  const viewportHeight = useWindowSize();
  const { quill, quillRef } = useQuill({
    theme: "snow",
    placeholder: "",
    modules: {
      toolbar: [
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image", "video", "formula"],
      ],
      history: { delay: 1000, maxStack: 50, userOnly: true },
    },
  });

  // 1) Quill 이벤트 등록
  useEffect(() => {
    if (!quill) return;

    const handleTextChange = () => {
      setHtml(quill.root.innerHTML);
      const sel = quill.getSelection();
      if (sel) {
        const b = quill.getBounds(sel.index);
        onCursorBoundsChange?.(b);
      } else {
        onCursorBoundsChange?.(null);
      }
    };

    const handleSelectionChange = (range: any) => {
      if (range) {
        const b = quill.getBounds(range.index);
        onCursorBoundsChange?.(b);
      } else {
        onCursorBoundsChange?.(null);
      }
    };

    quill.on("text-change", handleTextChange);
    quill.on("selection-change", handleSelectionChange);

    // .ql-editor relative 로 설정 (고스트 배치용)
    const editorEl = quill.container.querySelector(".ql-editor") as HTMLElement;
    if (editorEl) editorEl.style.position = "relative";

    return () => {
      quill.off("text-change", handleTextChange);
      quill.off("selection-change", handleSelectionChange);
    };
  }, [quill, setHtml, onCursorBoundsChange]);

  // initialHtml 주입
  useEffect(() => {
    if (!quill || !initialHtml) return;
    if (quill.root.innerHTML === initialHtml) return;
    quill.clipboard.dangerouslyPasteHTML(initialHtml);
    setTimeout(() => {
      if (quill) quill.setSelection(quill.getLength(), 0);
    }, 50);
  }, [quill, initialHtml]);

  // 렌더
  return (
    <div className="flex flex-col w-full h-full py-1 overflow-hidden">
      <div className="relative w-full h-full">
        {/* 에디터 */}
        <div ref={quillRef} className="w-full h-full" />

        {/* Copilot‑style 고스트 텍스트 */}
        {ghostText && cursorBounds && (
          <span
            className="absolute w-full px-4 font-pre-regular text-sm opacity-70 select-none pointer-events-none"
            style={{
              top:
                cursorBounds.top +
                cursorBounds.height +
                viewportHeight * GAP_RATIO, // ← 창 높이에 비례
              left: 0,
              lineHeight: `${cursorBounds.height}px`,
            }}
          >
            {ghostText}
          </span>
        )}
      </div>
    </div>
  );
};

export default MailTextEditor;

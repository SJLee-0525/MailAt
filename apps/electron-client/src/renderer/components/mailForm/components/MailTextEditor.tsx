import { useEffect, useRef } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

interface MailTextEditorProps {
  initialHtml: string;
  setHtml: (html: string) => void;
}

const MailTextEditor = ({ initialHtml, setHtml }: MailTextEditorProps) => {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    placeholder: "",
    modules: {
      toolbar: [
        // [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }], // 리스트: 순서있는 리스트, 순서없는 리스트
        // [{ script: "sub" }, { script: "super" }], // 인용구
        [{ indent: "-1" }, { indent: "+1" }], // 들여쓰기
        [{ align: [] }], // 텍스트 정렬: 왼쪽, 가운데, 오른쪽, 양쪽정렬
        ["link", "image", "video", "formula"], // 링크, 이미지, 비디오, 수식 삽입
      ],

      // 뒤로/앞으로 기능 활성화
      history: {
        delay: 1000, // 입력 취소 대기 시간(ms)
        maxStack: 50, // 최대 스택 수
        userOnly: true, // 사용자 액션만 기록
      },
    },
  });

  // 에디터의 내용 및 커서 위치 업데이트 트래킹을 위한 ref
  const cursorPositionRef = useRef<number>(0);

  // 에디터가 로드되면 change 이벤트 구독
  useEffect(() => {
    if (!quill) return;

    // 텍스트 변경 이벤트 핸들러
    const textChangeHandler = () => {
      const html = quill.root.innerHTML; // HTML 형식으로
      setHtml(html);

      // 현재 커서 위치 저장
      const selection = quill.getSelection();
      if (selection) {
        cursorPositionRef.current = selection.index;
      }
    };

    // 선택 영역 변경 이벤트 핸들러 (커서 위치 추적용)
    const selectionChangeHandler = (range: any) => {
      if (range) {
        cursorPositionRef.current = range.index;
      }
    };

    quill.on("text-change", textChangeHandler);
    quill.on("selection-change", selectionChangeHandler);

    // 에디터 스타일 수정
    if (quill.container) {
      const qlContainer = quill.container.querySelector(".ql-container");
      const qlEditor = quill.container.querySelector(".ql-editor");

      if (qlContainer) {
        (qlContainer as HTMLElement).style.height = "calc(100% - 42px)"; // 툴바 높이 제외
        (qlContainer as HTMLElement).style.overflow = "auto";
      }

      if (qlEditor) {
        (qlEditor as HTMLElement).style.minHeight = "100%";
        (qlEditor as HTMLElement).style.maxHeight = "none";
        (qlEditor as HTMLElement).style.paddingBottom = "80px";
      }
    }

    return () => {
      quill.off("text-change", textChangeHandler);
      quill.off("selection-change", selectionChangeHandler);
    };
  }, [quill, setHtml]);

  // 초기 HTML 설정
  useEffect(() => {
    if (!quill || !initialHtml) return;

    // 이미 에디터에 내용이 있고, 그 내용이 initialHtml과 같다면 다시 설정하지 않음
    if (quill.root.innerHTML === initialHtml) return;

    // 에디터 내용 초기화
    quill.clipboard.dangerouslyPasteHTML(initialHtml);

    // 커서를 끝으로 이동
    setTimeout(() => {
      if (quill) {
        const length = quill.getLength();
        quill.setSelection(length, 0);
      }
    }, 50);
  }, [quill, initialHtml]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div ref={quillRef} className="h-full pb-16" />
    </div>
  );
};

export default MailTextEditor;

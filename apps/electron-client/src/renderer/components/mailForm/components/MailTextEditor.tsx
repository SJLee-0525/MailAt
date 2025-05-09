import { useEffect } from "react";

import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

const MailTextEditor = ({
  initialHtml,
  setHtml,
}: {
  initialHtml: string;
  setHtml: (html: string) => void;
}) => {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    placeholder: "본문을 입력하세요.",
    modules: {
      toolbar: [
        [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
        [{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }], // 리스트: 순서있는 리스트, 순서없는 리스트
        [{ script: "sub" }, { script: "super" }], // 인용구
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

  // 에디터가 로드되면 change 이벤트 구독
  useEffect(() => {
    if (!quill) return;

    const handler = () => {
      const html = quill.root.innerHTML; // HTML 형식으로
      setHtml(html);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [quill]);

  useEffect(() => {
    if (!quill || initialHtml === "") return;

    quill.clipboard.dangerouslyPasteHTML(initialHtml); // innerHTML 직접 대입해도 되지만, 권장 방식은 clipboard.dangerouslyPasteHTML
  }, [quill, initialHtml]);

  return (
    <div className="flex flex-col w-full h-full">
      <div ref={quillRef} className="h-full" />
    </div>
  );
};

export default MailTextEditor;

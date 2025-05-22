import { useState, useEffect } from "react";

import { X, FileX } from "lucide-react";

import * as mammoth from "mammoth"; // mammoth 라이브러리 import

import { useAttachmentPreview } from "@hooks/useAttachments";

interface AttachmentPreviewProps {
  attachmentId: number;
  filename: string;
  mimeType: string;
  onClose: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachmentId,
  filename,
  mimeType,
  onClose,
}) => {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);

  // API 호출을 위한 뮤테이션
  const previewMutation = useAttachmentPreview();

  // 한 번만 실행되는 useEffect
  useEffect(() => {
    // 이미 시도했으면 다시 실행하지 않음
    if (hasAttempted) return;

    setHasAttempted(true);
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      try {
        setIsLoading(true);

        // API 호출로 파일 내용 가져오기
        const response = await previewMutation.mutateAsync(attachmentId);

        // response가 null이면 오류 처리
        if (!response) {
          throw new Error("파일을 불러올 수 없습니다.");
        }

        // content 존재 여부 확인
        if (!response.content) {
          throw new Error("파일 내용이 없습니다.");
        }

        // 파일 타입에 따른 미리보기 처리
        if (mimeType.includes("image/")) {
          // 이미지 파일
          const blob = new Blob([response.content], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setPreviewContent(
            `<img src="${objectUrl}" alt="${filename}" style="max-width: 100%; max-height: 80vh;" />`
          );
        } else if (mimeType === "application/pdf") {
          // PDF 파일
          const blob = new Blob([response.content], {
            type: "application/pdf",
          });
          objectUrl = URL.createObjectURL(blob);
          setPreviewContent(`
            <iframe 
              src="${objectUrl}" 
              style="width: 100%; height: 80vh; border: none;"
            ></iframe>
          `);
        } else if (mimeType.includes("text/")) {
          // 텍스트 파일
          const text = new TextDecoder().decode(response.content);
          setPreviewContent(
            `<pre style="white-space: pre-wrap; word-break: break-all;">${text}</pre>`
          );
        } else if (mimeType.includes("video/")) {
          // 비디오 파일
          const blob = new Blob([response.content], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setPreviewContent(`
            <video controls style="max-width: 100%; max-height: 70vh;">
              <source src="${objectUrl}" type="${mimeType}">
              비디오 재생을 지원하지 않는 브라우저입니다.
            </video>
          `);
        } else if (mimeType.includes("audio/")) {
          // 오디오 파일
          const blob = new Blob([response.content], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setPreviewContent(`
            <audio controls style="width: 100%;">
              <source src="${objectUrl}" type="${mimeType}">
              오디오 재생을 지원하지 않는 브라우저입니다.
            </audio>
          `);
        }
        // DOCX 파일 처리 추가
        else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          try {
            // ArrayBuffer로 변환
            const arrayBuffer = new Uint8Array(response.content).buffer;

            // mammoth.js로 HTML 변환
            const result = await mammoth.convertToHtml({ arrayBuffer });

            // 변환된 HTML에 스타일 적용
            setPreviewContent(`
              <div class="docx-container">
                <div class="docx-content">
                  ${result.value}
                </div>
              </div>
            `);
          } catch (docxError) {
            console.error("DOCX 변환 오류:", docxError);
            throw new Error("DOCX 파일 변환 중 오류가 발생했습니다.");
          }
        } else {
          // 지원하지 않는 파일 타입
          setPreviewContent(`
            <div class="unsupported-file-message">
              <div class="icon-container">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z"></path>
                  <path d="M13 3v6h6"></path>
                </svg>
              </div>
              <h3>미리보기를 지원하지 않는 파일 형식입니다</h3>
              <p>${mimeType} 형식은 현재 미리보기를 지원하지 않습니다.</p>
              <p>파일을 다운로드하여 확인해주세요.</p>
            </div>
          `);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("미리보기 오류:", err);
        let errorMessage = "파일 미리보기를 불러오는 중 오류가 발생했습니다.";

        // 오류 메시지 상세화
        if (err.message && typeof err.message === "string") {
          if (err.message.includes("경로가 없습니다")) {
            errorMessage =
              "이 파일의 경로를 찾을 수 없습니다. 파일이 이동되었거나 삭제되었을 수 있습니다.";
          } else if (err.message.includes("읽을 수 없습니다")) {
            errorMessage =
              "이 파일을 읽을 수 없습니다. 파일이 손상되었거나 접근 권한이 없을 수 있습니다.";
          } else if (err.message.includes("DOCX 파일 변환")) {
            errorMessage =
              "DOCX 파일을 HTML로 변환하는 중 오류가 발생했습니다.";
          }
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadPreview();

    // 컴포넌트 언마운트 시 URL 해제
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachmentId, mimeType, filename, previewMutation]);

  // 재시도 로직을 위한 핸들러
  const handleRetry = () => {
    setHasAttempted(false); // 재시도 플래그 초기화
  };

  return (
    <div className="attachment-preview-modal">
      <div className="preview-header">
        <h2>{filename}</h2>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="preview-content">
        {isLoading ? (
          <div className="preview-loading">
            <div className="spinner"></div>
            <p>미리보기 로딩 중...</p>
          </div>
        ) : error ? (
          <div className="preview-error">
            <FileX size={48} />
            <h3>미리보기 오류</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        ) : (
          <div
            className="preview-document"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        )}
      </div>
    </div>
  );
};

export default AttachmentPreview;

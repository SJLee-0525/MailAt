import { useState } from "react";

import { Eye, Download, Info, X } from "lucide-react";

import type { Attachment } from "@/types/attachmentTypes";

import { useDownloadAttachment } from "@hooks/useAttachments";

import {
  formatFileSize,
  getFileTypeLabel,
  getFileType,
} from "@utils/attachmentUtils";

import FileIconRenderer from "@components/attachment/FileIconRenderer";
import AttachmentPreview from "@components/attachment/AttachmentPreview";

interface FileDetailProps {
  file: Attachment;
  onClose: () => void;
}

const FileDetail: React.FC<FileDetailProps> = ({ file, onClose }) => {
  const [showPreview, setShowPreview] = useState(false);
  const downloadMutation = useDownloadAttachment();

  const isDownloading = downloadMutation.status === "pending";

  const handleDownload = () => {
    if (typeof file.id !== "number") {
      console.error("첨부파일 ID가 숫자가 아닙니다:", file.id);
      return;
    }

    downloadMutation.mutate({
      attachmentId: file.id,
      filename: file.filename,
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // 미리보기를 지원하는 파일 타입인지 확인
  const isSupportedForPreview = (mimeType: string): boolean => {
    return (
      mimeType.includes("image/") ||
      mimeType === "application/pdf" ||
      mimeType.includes("text/") ||
      mimeType.includes("video/") ||
      mimeType.includes("audio/") ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  return (
    <>
      <div className="detail-panel">
        <div className="detail-header">
          <h2 className="detail-title">
            <Info size={18} /> 파일 정보
          </h2>
          <div className="close-button" onClick={onClose}>
            <X size={16} />
          </div>
        </div>

        <div className="detail-icon-container">
          <div className="detail-icon">
            <FileIconRenderer mimeType={file.mimeType} />
          </div>
        </div>

        <div className="detail-file-name">
          {file.filename}
          <div className="detail-file-size">{formatFileSize(file.size)}</div>
        </div>

        <div className="detail-info-list">
          <div className="detail-info-item">
            <span className="detail-info-label">유형:</span>
            <span className="detail-info-value">
              {getFileTypeLabel(getFileType(file.mimeType))}
            </span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">발신자:</span>
            <span className="detail-info-value">{file.contactName}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">이메일:</span>
            <span className="detail-info-value">{file.contactEmail}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">이메일 제목:</span>
            <span className="detail-info-value">{file.messageSubject}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">수신 날짜:</span>
            <span className="detail-info-value">
              {new Date(file.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="detail-button preview-button"
            onClick={handlePreview}
            disabled={!isSupportedForPreview(file.mimeType)}
            title={
              isSupportedForPreview(file.mimeType)
                ? "미리보기"
                : "지원하지 않는 파일 형식입니다"
            }
          >
            <Eye /> 미리보기
          </button>
          <button
            type="button"
            className="detail-button download-button"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download /> {isDownloading ? "다운로드 중..." : "다운로드"}
          </button>
        </div>

        {downloadMutation.status === "error" && (
          <div className="error-message">다운로드 중 오류가 발생했습니다.</div>
        )}

        {downloadMutation.status === "success" && (
          <div className="success-message">다운로드가 완료되었습니다.</div>
        )}
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <AttachmentPreview
          attachmentId={
            typeof file.id === "string" ? parseInt(file.id, 10) : file.id
          }
          filename={file.filename}
          mimeType={file.mimeType}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default FileDetail;

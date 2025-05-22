import type { Attachment } from "@/types/attachmentTypes";

import { formatFileSize } from "@utils/attachmentUtils";

import FileIconRenderer from "@components/attachment/FileIconRenderer";

interface FileItemProps {
  file: Attachment;
  viewMode: "grid";
  isSelected: boolean;
  onSelect: (file: Attachment) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, isSelected, onSelect }) => {
  return (
    <div
      className={`file-card ${isSelected ? "selected" : ""} file-card-grid`}
      onClick={() => onSelect(file)}
    >
      {/* 그리드 뷰 */}
      <div className="file-icon-container">
        <div className="file-icon">
          <FileIconRenderer mimeType={file.mimeType} />
        </div>
      </div>
      <div className="file-info-grid">
        <div className="file-name" title={file.filename}>
          {file.filename}
        </div>
        <div className="file-size">{formatFileSize(file.size)}</div>
      </div>
    </div>
  );
};

export default FileItem;

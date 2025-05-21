import {
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
  FileSpreadsheet,
} from "lucide-react";

import { getFileIconInfo } from "@utils/attachmentUtils";

interface FileIconProps {
  mimeType: string;
}

// 실제 아이콘을 렌더링하는 컴포넌트
const FileIconRenderer: React.FC<FileIconProps> = ({ mimeType }) => {
  const iconInfo = getFileIconInfo(mimeType);

  switch (iconInfo.type) {
    case "image":
      return <Image className={iconInfo.color} />;
    case "video":
      return <Video className={iconInfo.color} />;
    case "audio":
      return <Music className={iconInfo.color} />;
    case "pdf":
    case "document":
      return <FileText className={iconInfo.color} />;
    case "spreadsheet":
      return <FileSpreadsheet className={iconInfo.color} />;
    case "presentation":
      return <FileText className={iconInfo.color} />;
    case "archive":
      return <Archive className={iconInfo.color} />;
    case "code":
      return <FileText className={iconInfo.color} />;
    default:
      return <File className={iconInfo.color} />;
  }
};

export default FileIconRenderer;

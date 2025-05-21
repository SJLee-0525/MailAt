import "@components/attachment/AttachmentViewer.css";

import { useState, useEffect, useRef } from "react";

import {
  FileText,
  Paperclip,
  Clock,
  ChevronDown,
  ChevronRight,
  File,
  Users,
  X,
} from "lucide-react";

import { ContentSearchResult } from "@apis/attachmentApi";

import useUserProgressStore from "@stores/userProgressStore";

import {
  useAllAttachments,
  useSearchAttachmentsByContent,
} from "@hooks/useAttachments";

// 타입 및 유틸리티 함수 가져오기
import type {
  Attachment,
  DateGroup,
  ContactGroup,
  FileTypeGroup,
} from "@/types/attachmentTypes";

import {
  groupByDate,
  groupByContact,
  groupByFileType,
  sortByRecent,
  formatDate,
} from "@utils/attachmentUtils";
import { searchAttachments } from "@utils/getAttachmentData";

import useAuthenticateStore from "@stores/authenticateStore";

import SearchIcon from "@assets/icons/SearchIcon";

// 컴포넌트 가져오기
import FileItem from "@components/attachment/FileItem";
import FileDetail from "@components/attachment/FileDetail";
import FileIconRenderer from "@components/attachment/FileIconRenderer";

type SimplifiedFilterMode = "recent" | "type" | "contact";

const AttachmentViewer = () => {
  const { setAttachmentViewerIsOpen } = useUserProgressStore();

  // 사용자 정보 가져오기
  const { selectedUser } = useAuthenticateStore();
  const accountId = selectedUser?.accountId || 1;

  // React Query로 모든 첨부파일 가져오기
  const {
    data: attachments = [],
    isLoading,
    error,
    status,
  } = useAllAttachments(accountId);

  // 상태 관리
  const [filterMode, setFilterMode] = useState<SimplifiedFilterMode>("recent");
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>(
    []
  );

  // 그룹화된 데이터
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [fileTypeGroups, setFileTypeGroups] = useState<FileTypeGroup[]>([]);

  // 확장 상태 관리
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // 본문 검색 관련 코드
  const contentSearchMutation = useSearchAttachmentsByContent();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [backendSearchResults, setBackendSearchResults] = useState<
    Attachment[]
  >([]);

  // 검색어 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // 이전 타이머 제거
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 검색어가 2글자 이상일 때만 백엔드 검색 실행
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        // 백엔드 API 호출 실행
        contentSearchMutation.mutate({
          accountId,
          keyword: value.trim(),
          limit: 50,
          offset: 0,
        });
      }, 500); // 타이핑 후 500ms 지연
    } else {
      // 검색어가 짧으면 백엔드 검색 결과 초기화
      setBackendSearchResults([]);
    }
  };

  // 백엔드 검색 결과 처리
  useEffect(() => {
    if (contentSearchMutation.data) {
      // data가 ContentSearchResult 타입임을 확신
      const searchResult = contentSearchMutation.data as ContentSearchResult;
      setBackendSearchResults(searchResult.attachments);
    }
  }, [contentSearchMutation.data, contentSearchMutation.isSuccess]);

  // 첫 번째 useEffect: 필터링 데이터 처리
  useEffect(() => {
    if (!attachments || !Array.isArray(attachments)) {
      setFilteredAttachments([]);
      setDateGroups([]);
      setContactGroups([]);
      setFileTypeGroups([]);
      return;
    }

    let filtered: Attachment[] = [];

    if (searchTerm.trim() === "") {
      // 검색어가 없을 때는 기본 첨부파일 목록 사용
      filtered = attachments;
    } else {
      // 1. 프론트엔드 필터링 (파일명, 발신자, 확장자)
      const frontendFiltered = searchAttachments(attachments, searchTerm);

      // 2. 백엔드 필터링 결과와 병합 (중복 제거)
      // 고유 식별자를 사용하여 중복 제거 - 여러 속성 조합으로 확실하게 중복 제거
      const uniqueMap = new Map<string, Attachment>();

      // 먼저 프론트엔드 검색 결과 추가
      frontendFiltered.forEach((item) => {
        // 고유 키 생성: 파일명 + 메시지ID + 크기 조합으로 고유성 확보
        const uniqueKey = `${item.filename}_${item.messageId}_${item.size}`;
        uniqueMap.set(uniqueKey, item);
      });

      // 백엔드 검색 결과 추가 (중복은 덮어쓰기됨)
      if (backendSearchResults.length > 0) {
        backendSearchResults.forEach((item) => {
          const uniqueKey = `${item.filename}_${item.messageId}_${item.size}`;
          if (!uniqueMap.has(uniqueKey)) {
            uniqueMap.set(uniqueKey, item);
          }
        });
      }

      // Map의 값들을 배열로 변환
      filtered = Array.from(uniqueMap.values());
    }

    setFilteredAttachments(filtered);

    // 날짜별, 연락처별, 파일 타입별 그룹화
    setDateGroups(groupByDate(filtered));
    setContactGroups(groupByContact(filtered));
    setFileTypeGroups(groupByFileType(filtered));
  }, [attachments, searchTerm, backendSearchResults]);

  // 두 번째 useEffect: 그룹 데이터가 변경될 때만 expandedGroups 업데이트
  useEffect(() => {
    // 초기 확장 상태 설정
    const initialExpandedGroups: Record<string, boolean> = {
      ...expandedGroups,
    }; // 기존 상태 복사

    // 새로운 그룹에 대해서만 초기 상태 설정
    dateGroups.forEach((group) => {
      const key = `date-${group.date}`;
      if (initialExpandedGroups[key] === undefined) {
        initialExpandedGroups[key] = true;
      }
    });

    fileTypeGroups.forEach((group) => {
      const key = `type-${group.type}`;
      if (initialExpandedGroups[key] === undefined) {
        initialExpandedGroups[key] = true;
      }
    });

    contactGroups.forEach((group) => {
      const key = `contact-${group.contactEmail}`;
      if (initialExpandedGroups[key] === undefined) {
        initialExpandedGroups[key] = true;
      }
    });

    // 객체 참조 비교가 아닌 깊은 비교를 통해 실제 변경이 있는지 확인
    if (
      JSON.stringify(expandedGroups) !== JSON.stringify(initialExpandedGroups)
    ) {
      setExpandedGroups(initialExpandedGroups);
    }
  }, [dateGroups, contactGroups, fileTypeGroups]);

  // 그룹 토글 처리
  const toggleGroup = (key: string): void => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 사이드바에서 연락처 필터 선택 처리
  const handleContactSelect = (contactEmail: string): void => {
    if (selectedContact === contactEmail) {
      setSelectedContact(null);
      setFilterMode("recent");
    } else {
      setSelectedContact(contactEmail);
      setFilterMode("contact");
    }
  };

  // 현재 필터 모드에 따라 표시할 내용 결정
  const renderContent = (): React.ReactNode => {
    if (!filteredAttachments || filteredAttachments.length === 0) {
      return (
        <div className="empty-state">
          <File size={48} />
          <h3 className="empty-state-title">파일을 찾을 수 없습니다</h3>
          <p className="empty-state-message">
            검색어를 변경하거나 다른 필터를 적용해 보세요.
          </p>
        </div>
      );
    }

    switch (filterMode) {
      case "recent":
        // 최근 파일 모드 (날짜별 정렬)
        return (
          <>
            <div className="current-path">
              <Clock
                size={16}
                style={{ display: "inline", marginRight: "5px" }}
              />
              최근 파일
            </div>
            <div className="file-list">
              {dateGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="group-container">
                  <div
                    className="group-header"
                    onClick={() => toggleGroup(`date-${group.date}`)}
                  >
                    {expandedGroups[`date-${group.date}`] ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                    <h2 className="group-title">{formatDate(group.date)}</h2>
                    <span className="group-count">
                      ({group.attachments.length}개 파일)
                    </span>
                  </div>

                  {expandedGroups[`date-${group.date}`] && (
                    <div className="files-grid">
                      {group.attachments.map((file, fileIndex) => (
                        <FileItem
                          key={fileIndex}
                          file={file}
                          viewMode="grid"
                          isSelected={selectedFile?.id === file.id}
                          onSelect={setSelectedFile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case "type":
        // 파일 유형별 분류 모드
        return (
          <>
            <div className="current-path">
              <FileText
                size={16}
                style={{ display: "inline", marginRight: "5px" }}
              />
              파일 유형별 보기
            </div>
            <div className="file-list">
              {fileTypeGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="group-container">
                  <div
                    className="group-header"
                    onClick={() => toggleGroup(`type-${group.type}`)}
                  >
                    {expandedGroups[`type-${group.type}`] ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                    <h2 className="group-title">{group.label}</h2>
                    <span className="group-count">
                      ({group.attachments.length}개 파일)
                    </span>
                  </div>

                  {expandedGroups[`type-${group.type}`] && (
                    <div className="files-grid">
                      {sortByRecent(group.attachments).map(
                        (file, fileIndex) => (
                          <FileItem
                            key={fileIndex}
                            file={file}
                            viewMode="grid"
                            isSelected={selectedFile?.id === file.id}
                            onSelect={setSelectedFile}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case "contact": {
        // 연락처별 분류 모드
        const selectedContactData = selectedContact
          ? contactGroups.find((g) => g.contactEmail === selectedContact)
          : null;

        if (selectedContact && selectedContactData) {
          return (
            <>
              <div className="current-path">
                <Users
                  size={16}
                  style={{ display: "inline", marginRight: "5px" }}
                />
                연락처 :<span>{selectedContactData.contactName}</span>
              </div>
              <div className="file-list">
                {groupByDate(selectedContactData.attachments).map(
                  (dateGroup, groupIndex) => (
                    <div key={groupIndex} className="group-container">
                      <div
                        className="group-header"
                        onClick={() =>
                          toggleGroup(`contact-date-${dateGroup.date}`)
                        }
                      >
                        {expandedGroups[`contact-date-${dateGroup.date}`] ? (
                          <ChevronDown />
                        ) : (
                          <ChevronRight />
                        )}
                        <h2 className="group-title">
                          {formatDate(dateGroup.date)}
                        </h2>
                        <span className="group-count">
                          ({dateGroup.attachments.length}개 파일)
                        </span>
                      </div>

                      {expandedGroups[`contact-date-${dateGroup.date}`] !==
                        false && (
                        <div className="files-grid">
                          {dateGroup.attachments.map((file, fileIndex) => (
                            <FileItem
                              key={fileIndex}
                              file={file}
                              viewMode="grid"
                              isSelected={selectedFile?.id === file.id}
                              onSelect={setSelectedFile}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </>
          );
        } else {
          return (
            <>
              <div className="current-path">
                <Users
                  size={16}
                  style={{ display: "inline", marginRight: "5px" }}
                />
                모든 연락처
              </div>
              <div className="file-list">
                {contactGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="group-container">
                    <div
                      className="group-header"
                      onClick={() =>
                        toggleGroup(`contact-${group.contactEmail}`)
                      }
                    >
                      {expandedGroups[`contact-${group.contactEmail}`] ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                      <h2 className="group-title">{group.contactName}</h2>
                      <span className="group-count">
                        ({group.attachments.length}개 파일)
                      </span>
                    </div>

                    {expandedGroups[`contact-${group.contactEmail}`] && (
                      <div className="files-grid">
                        {sortByRecent(group.attachments).map(
                          (file, fileIndex) => (
                            <FileItem
                              key={fileIndex}
                              file={file}
                              viewMode="grid"
                              isSelected={selectedFile?.id === file.id}
                              onSelect={setSelectedFile}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          );
        }
      }

      default:
        return <div>알 수 없는 필터 모드</div>;
    }
  };

  // 로딩 상태 표시
  if (status === "pending" || isLoading) {
    return (
      <div className="attachment-container">
        <div className="empty-state">
          <div className="animate-pulse">
            <File size={48} />
          </div>
          <h3 className="empty-state-title">첨부파일 로딩 중...</h3>
          <p className="empty-state-message">
            첨부파일을 불러오는 중입니다. 잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (status === "error" || error) {
    return (
      <div className="attachment-container">
        <div className="empty-state">
          <File size={48} />
          <h3 className="empty-state-title">오류가 발생했습니다</h3>
          <p className="empty-state-message">
            첨부파일을 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col w-full min-w-96 h-full bg-header transition-all duration-300 ease-in-out pointer-events-auto`}
    >
      {/* 헤더와 닫기 버튼 */}
      <div className="flex justify-between items-center p-4 border-b border-light1">
        <h1 className="flex items-center gap-2 text-lg text-text font-pre-bold">
          <Paperclip size={20} /> 첨부파일
        </h1>
        <button
          onClick={() => setAttachmentViewerIsOpen(false)}
          className="p-2 rounded-full bg-default hover:bg-error transition-colors duration-300 ease-in-out"
        >
          <X size={20} stroke="#fff" />
        </button>
      </div>

      <div className="flex h-full overflow-hidden">
        {/* 사이드바 */}
        <div className="w-64 h-full border-r border-light1 p-4 overflow-y-auto">
          <div className="sidebar-menu">
            <div
              className={`sidebar-menu-item ${
                filterMode === "recent" ? "active" : ""
              }`}
              onClick={() => {
                setFilterMode("recent");
                setSelectedContact(null);
              }}
            >
              <Clock /> <span>최근 파일</span>
            </div>
            <div
              className={`sidebar-menu-item ${
                filterMode === "type" ? "active" : ""
              }`}
              onClick={() => {
                setFilterMode("type");
                setSelectedContact(null);
              }}
            >
              <FileText /> <span>파일 유형별</span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <div>
                <Users
                  size={16}
                  style={{ marginRight: "5px", display: "inline" }}
                />
                연락처
              </div>
              {selectedContact && (
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setFilterMode("recent");
                  }}
                >
                  초기화
                </button>
              )}
            </div>
            <div>
              {contactGroups.map((contact, index) => (
                <div
                  key={index}
                  className={`contact-item ${
                    selectedContact === contact.contactEmail ? "active" : ""
                  }`}
                  onClick={() => handleContactSelect(contact.contactEmail)}
                >
                  <div className="contact-avatar">
                    {contact.contactName.charAt(0)}
                  </div>
                  <span>{contact.contactName}</span>
                  <span className="file-count">
                    {contact.attachments.length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <div>
                <FileText
                  size={16}
                  style={{ marginRight: "5px", display: "inline" }}
                />
                파일 유형
              </div>
            </div>
            <div>
              {fileTypeGroups.map((fileType, index) => (
                <div
                  key={index}
                  className="contact-item"
                  onClick={() => {
                    setFilterMode("type");
                    setSelectedContact(null);
                    toggleGroup(`type-${fileType.type}`);
                  }}
                >
                  <div className="file-type-icon">
                    <FileIconRenderer mimeType={`${fileType.type}/x`} />
                  </div>
                  <span>{fileType.label}</span>
                  <span className="file-count">
                    {fileType.attachments.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 h-full overflow-y-auto">
          {/* 검색 바 */}
          <div className="p-4">
            <div className="relative w-full">
              <div className="flex items-center justify-between w-full h-13 px-4 bg-white text-text backdrop-blur-md bordershadow-sm rounded-full">
                <input
                  type="text"
                  placeholder="파일명, 발신자, 이메일 내용 검색..."
                  className="font-pre-regular w-full h-full px-4 py-auto border-none rounded-full focus:outline-none bg-transparent"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div className="flex items-center">
                  {contentSearchMutation.isPending &&
                    searchTerm.trim().length >= 2 && (
                      <div className="mr-2">
                        <div className="spinner-small"></div>
                      </div>
                    )}
                  <button
                    type="button"
                    className="p-2 rounded-full bg-theme text-white hover:bg-theme-dark transition-all duration-300"
                  >
                    <SearchIcon
                      width={20}
                      height={20}
                      className="transition-all duration-300"
                      strokeColor="white"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 목록 */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-shadow-title">
                <div>로딩 중...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-error">
                오류가 발생했습니다: {(error as Error).message}
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>

      {/* 파일 상세 정보 패널 - 별도 위치에 배치 */}
      {selectedFile && (
        <div className={`detail-overlay ${selectedFile ? "active" : ""}`}>
          <FileDetail
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AttachmentViewer;

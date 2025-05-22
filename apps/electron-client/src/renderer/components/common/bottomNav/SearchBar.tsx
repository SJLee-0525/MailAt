import { useEffect, useRef } from "react";

import { searchGraphNode } from "@apis/graphApi";

import useUserProgressStore from "@stores/userProgressStore";
import useConversationsStore from "@stores/conversationsStore";

import IconButton from "@components/common/button/IconButton";

import SearchIcon from "@assets/icons/SearchIcon";

const SearchBar = () => {
  const {
    bottomNavProgress,
    setBottomNavProgress,
    setLoading,
    setLoadingMessage,
    setCloseLoadingMessage,
  } = useUserProgressStore();
  const { setGraphData } = useConversationsStore();

  const wrapperRef = useRef<HTMLFormElement>(null);

  // 외부 클릭 시 검색바 닫기
  useEffect(() => {
    if (bottomNavProgress !== "search") return;

    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setBottomNavProgress(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bottomNavProgress, setBottomNavProgress]);

  // 검색어 제출 시 처리
  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const searchQuery = Object.fromEntries(fd.entries()).searchQuery as string;

    if (searchQuery.trim() === "") return;

    setLoading(true);
    setLoadingMessage("검색 중입니다.");

    // 검색어가 비어있지 않을 때만 검색 수행
    try {
      const response = await searchGraphNode({ keyword: searchQuery });
      if (response) {
        // console.log("Search results:", response);
        setGraphData(response);

        setBottomNavProgress(null);
        setLoading(false);
        setLoadingMessage("검색 완료");
      }
    } catch (error) {
      console.error("Error searching graph node:", error);
      setLoading(false);
      setLoadingMessage("검색 실패");
    } finally {
      setCloseLoadingMessage();
    }
  }

  if (bottomNavProgress !== "search") return null;

  return (
    <form
      ref={wrapperRef}
      className="flex items-center justify-between mb-10 w-80 p-1 gap-2 bg-bg rounded-full shadow-sm"
      onSubmit={handleSearch}
    >
      <input
        name="searchQuery"
        type="text"
        placeholder="검색어를 입력하세요."
        className="font-pre-regular w-full h-12 px-5 py-auto bg-header text-text border-none rounded-full focus:outline-none"
      />
      <IconButton
        type="submit"
        icon={<SearchIcon strokeColor="#fff" />}
        className="p-2.5 bg-bg hover:bg-warning"
      />
    </form>
  );
};

export default SearchBar;

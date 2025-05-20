import { useEffect, useRef } from "react";

import useUserProgressStore from "@stores/userProgressStore";

import IconButton from "@components/common/button/IconButton";

import SearchIcon from "@assets/icons/SearchIcon";

const SearchBar = () => {
  const { bottomNavProgress, setBottomNavProgress } = useUserProgressStore();

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
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const searchQuery = Object.fromEntries(fd.entries()).searchQuery as string;

    if (searchQuery.trim() === "") return;

    console.log("Search query:", searchQuery);
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
        className="font-pre-regular w-full h-12 px-5 py-auto bg-white text-gray-700 border-none rounded-full focus:outline-none"
      />
      <IconButton
        type="submit"
        icon={<SearchIcon />}
        className="p-2.5 bg-bg hover:bg-warning"
      />
    </form>
  );
};

export default SearchBar;

import { useState } from "react";

import useConversationsStore from "@stores/conversationsStore";

import { getEmailsData } from "@apis/emailApi";

// import { useGetAllEmails } from "@hooks/useGetConversations";

import { splitSearchQuery } from "@utils/getEmailData";

import IconButton from "@components/common/button/IconButton";
import InboxFilter from "@components/inbox/components/InboxFilter";

import SearchIcon from "@assets/icons/SearchIcon";
import FilterIcon from "@assets/icons/FilterIcon";

const InboxSearchForm = () => {
  const { setFilters } = useConversationsStore();

  // const { refetch } = useGetAllEmails();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  // 검색어 제출 시 처리
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newFilters = splitSearchQuery(searchQuery);
    setFilters(newFilters);

    // const filteredEmails = searchEmails(filters);
    // setConversations(filteredEmails); // 필터링된 이메일로 업데이트
    // setSearchQuery(""); // 검색어 초기화
    setIsExpanded(false); // 필터 닫기
  }

  return (
    <div className="relative flex justify-center items-center z-10 w-full h-full px-3 py-1.5">
      <form
        className="flex items-center justify-between p-1 w-full h-full bg-white text-gray-700 rounded-full"
        onSubmit={handleSearch}
      >
        <input
          name="searchQuery"
          type="text"
          placeholder="검색어를 입력하세요."
          className="font-pre-regular w-full h-10 px-4 py-auto border-none rounded-full focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <IconButton
            type="button"
            icon={<FilterIcon strokeColor="#7D7983" width={20} height={20} />}
            className="p-2.5 transition-all duration-300 hover:bg-light1"
            onClick={() => setIsExpanded(!isExpanded)}
          />
          <IconButton
            type="submit"
            icon={<SearchIcon strokeColor="white" width={20} height={20} />}
            className="p-2.5 transition-all duration-300 bg-theme hover:bg-warning"
          />
        </div>
      </form>
      {isExpanded && <InboxFilter setSearchQuery={setSearchQuery} />}
    </div>
  );
};

export default InboxSearchForm;

import InboxFilterForm from "@components/inbox/components/InboxFilterForm";

const InboxFilter = ({
  setSearchQuery,
}: {
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <div className="absolute top-14 left-0 w-full p-1.5 bg-white shadow-[0_2px_5px_-1px_rgba(0,0,0.1,0.1)] z-10">
      <div className="flex flex-col w-full h-full px-4 py-1.5 gap-1 rounded-lg bg-white font-pre-bold">
        <InboxFilterForm
          name="from"
          type="text"
          label="보낸 사람"
          placeholder="보낸 사람을 입력해주세요."
          setSearchQuery={setSearchQuery}
        />
        <InboxFilterForm
          name="to"
          type="text"
          label="받는 사람"
          placeholder="받는 사람을 입력해주세요."
          setSearchQuery={setSearchQuery}
        />
        <InboxFilterForm
          name="subject"
          type="text"
          label="제목"
          placeholder="제목을 입력해주세요."
          setSearchQuery={setSearchQuery}
        />
        <InboxFilterForm
          name="includeKeywords"
          type="text"
          label="포함하는 단어"
          placeholder="포함시킬 단어를 입력해주세요."
          setSearchQuery={setSearchQuery}
        />
        <InboxFilterForm
          name="excludeKeywords"
          type="text"
          label="제외하는 단어"
          placeholder="제외할 단어를 입력해주세요."
          setSearchQuery={setSearchQuery}
        />
        <InboxFilterForm
          name="attachmentSize"
          type="number"
          label="첨부파일 크기"
          placeholder="최소 크기를 입력해주세요. (MB)"
          setSearchQuery={setSearchQuery}
        />
      </div>
      {/* <div className="flex flex-col w-full h-full rounded-lg bg-white p-2 font-pre-bold mt-2">
        <form className="flex flex-col gap-2">
          <input
            name="startDate"
            type="date"
            placeholder="날짜 필터: 이 날짜 이후(포함)"
            className="w-full h-9 text-sm border-b-2 border-light1"
          />
        </form>
        <form className="flex flex-col gap-2">
          <input
            name="endDate"
            type="date"
            placeholder="날짜 필터: 이 날짜 이전(포함)"
            className="w-full h-9 text-sm border-b-2 border-light1"
          />
        </form>
      </div> */}
    </div>
  );
};

export default InboxFilter;

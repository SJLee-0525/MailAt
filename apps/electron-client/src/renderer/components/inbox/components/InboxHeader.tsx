import { useState } from "react";

import IconButton from "@components/common/button/IconButton";
import InboxSearchForm from "@components/inbox/components/InboxSearchForm";

import SearchIcon from "@assets/icons/SearchIcon";

const InboxHeader = () => {
  const [isSearch, setIsSearch] = useState(false);

  return (
    <>
      {isSearch ? (
        <div className="flex items-center justify-between w-full h-16 bg-light1 rounded-t-xl">
          <InboxSearchForm />
        </div>
      ) : (
        <div className="flex items-center justify-between w-full h-16 px-4 bg-light1 rounded-t-xl">
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
          </div>

          <nav className="flex items-center gap-2">
            <IconButton
              type="submit"
              icon={<SearchIcon />}
              className="p-2 bg-theme hover:bg-warning"
              onClick={() => setIsSearch(true)}
            />
          </nav>
        </div>
      )}
    </>
  );
};

export default InboxHeader;

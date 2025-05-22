// import { useState } from "react";

// import IconButton from "@components/common/button/IconButton";
import InboxSearchForm from "@components/inbox/components/InboxSearchForm";

// import SearchIcon from "@assets/icons/SearchIcon";

const InboxHeader = () => {
  // const [isSearch, setIsSearch] = useState(false);

  return (
    <div className="flex items-center justify-center w-full h-15 min-h-16 bg-white">
      <InboxSearchForm />
    </div>
    // <>
    //   {isSearch ? (
    //     <div className="flex items-center justify-center w-full h-16 min-h-16 bg-light1 rounded-t-xl">
    //       <InboxSearchForm />
    //     </div>
    //   ) : (
    //     <div className="flex items-center justify-between w-full h-16 min-h-16 px-4 bg-light1 rounded-t-xl">
    //       <div>
    //         <h1 className="text-2xl font-pre-medium">Inbox 안녕</h1>
    //       </div>

    //       <nav className="flex items-center gap-2">
    //         <IconButton
    //           type="submit"
    //           icon={<SearchIcon strokeColor="white" width={20} height={20} />}
    //           className="p-2.5 bg-theme hover:bg-warning"
    //           onClick={() => setIsSearch(true)}
    //         />
    //       </nav>
    //     </div>
    //   )}
    // </>
  );
};

export default InboxHeader;

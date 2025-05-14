import useUserProgressStore from "@stores/userProgressStore";

import BottomNavButton from "@components/common/bottomNav/BottomNavButton";

import SearchIcon from "@assets/icons/SearchIcon";
import EditIcon from "@assets/icons/EditIcon";
import InboxIcon from "@assets/icons/InboxIcon";

const BottomNav = () => {
  const {
    inboxIsOpen,
    setBottomNavProgress,
    setMailFormIsOpen,
    setInboxIsOpen,
    setCalendarIsOpen,
  } = useUserProgressStore();

  return (
    <div className="flex justify-between items-center mb-10 w-fit gap-8">
      <BottomNavButton
        icon={<SearchIcon />}
        onClick={() => {
          console.log("Search");
          setBottomNavProgress("search");
        }}
      />
      <BottomNavButton
        icon={<EditIcon />}
        onClick={() => {
          console.log("Edit");
          setMailFormIsOpen(true);
        }}
      />
      <BottomNavButton
        icon={<InboxIcon />}
        onClick={() => {
          console.log("Inbox");
          setCalendarIsOpen(false);
          setInboxIsOpen(!inboxIsOpen);
        }}
      />
    </div>
  );
};

export default BottomNav;

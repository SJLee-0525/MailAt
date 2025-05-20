import useModalStore from "@stores/modalStore";
import useUserProgressStore from "@stores/userProgressStore";

import MenuIcon from "@assets/icons/MenuIcon";
import CalendarIcon from "@assets/icons/CalendarIcon";
import SettingIcon from "@assets/icons/SettingIcon";

import Settings from "@pages/settings/Settings";

import IconButton from "@components/common/button/IconButton";

const SideNav = () => {
  const { openModal, closeModal } = useModalStore();
  const {
    setCalendarIsOpen,
    setInboxIsOpen,
    setSelectedMail,
    setChattingIsOpen,
  } = useUserProgressStore();

  function handleCloseAllModal() {
    setCalendarIsOpen(false);
    setInboxIsOpen(false);
    setSelectedMail(null);
    setChattingIsOpen(false);

    closeModal();
  }

  function handleOpenCalendar() {
    setInboxIsOpen(false);
    setSelectedMail(null);
    setChattingIsOpen(false);

    setCalendarIsOpen(true);
  }

  return (
    <div className="flex flex-col justify-between items=center w-14 py-9 h-full bg-bg">
      <nav className="flex flex-col justify-between items-center h-fit gap-1.5">
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-accept"
          icon={<MenuIcon strokeColor="#e9e9e9" />}
          onClick={handleCloseAllModal}
        />
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-accept"
          icon={<CalendarIcon strokeColor="#e9e9e9" />}
          onClick={handleOpenCalendar}
        />
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-accept"
          icon={<SettingIcon strokeColor="#e9e9e9" />}
          onClick={() => openModal(<Settings />)}
        />
      </nav>
    </div>
  );
};

export default SideNav;

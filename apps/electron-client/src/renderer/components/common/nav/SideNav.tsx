import useModalStore from "@stores/modalStore";
import useUserProgressStore from "@stores/userProgressStore";

import MenuIcon from "@assets/icons/MenuIcon";
import CalendarIcon from "@assets/icons/CalendarIcon";
import SettingIcon from "@assets/icons/SettingIcon";

import defaultProfile from "@assets/images/defaultProfile.png";

import Settings from "@pages/settings/Settings";

import IconButton from "@components/common/button/IconButton";

const SideNav = () => {
  const { openModal, closeModal } = useModalStore();
  const { setInboxIsOpen } = useUserProgressStore();

  function handleCloseAllModal() {
    setInboxIsOpen(false);
    closeModal();
  }

  return (
    <div className="flex flex-col justify-between items=center w-14 py-9 h-screen bg-light1">
      <nav className="flex flex-col justify-between items-center h-fit gap-1.5">
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-light2"
          icon={<MenuIcon />}
          onClick={handleCloseAllModal}
        />
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-light2"
          icon={<CalendarIcon />}
        />
        <IconButton
          type="button"
          className="p-2 transition-all duration-200 hover:bg-light2"
          icon={<SettingIcon />}
          onClick={() => openModal(<Settings />)}
        />
      </nav>
      <nav className="flex flex-col items-center">
        <div className="flex justify-center items-center w-8 h-8 rounded-full">
          <img
            src={defaultProfile}
            alt="profile"
            className="rounded-full object-cover"
          />
        </div>
      </nav>
    </div>
  );
};

export default SideNav;

import MenuIcon from "@assets/icons/MenuIcon";
import CalendarIcon from "@assets/icons/CalendarIcon";
import SettingIcon from "@assets/icons/SettingIcon";

import defaultProfile from "@assets/images/defaultProfile.png";

const SideNav = () => {
  return (
    <div className="flex flex-col justify-between items=center w-14 py-9 h-screen bg-light1">
      <nav className="flex flex-col justify-between items-center h-fit gap-5">
        <MenuIcon />
        <CalendarIcon />
        <SettingIcon />
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

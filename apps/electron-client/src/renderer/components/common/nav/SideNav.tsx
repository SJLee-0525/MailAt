import useModalStore from "@stores/modalStore";
import useUserProgressStore from "@stores/userProgressStore";
import useAuthenticateStore from "@stores/authenticateStore";

import MenuIcon from "@assets/icons/MenuIcon";
import CalendarIcon from "@assets/icons/CalendarIcon";
import SettingIcon from "@assets/icons/SettingIcon";
import { Paperclip } from "lucide-react";

import Settings from "@pages/settings/Settings";

import IconButton from "@components/common/button/IconButton";

const SideNav = () => {
  const { openModal, closeModal } = useModalStore();
  const {
    setCalendarIsOpen,
    setInboxIsOpen,
    setSelectedMail,
    setChattingIsOpen,
    attachmentViewerIsOpen,
    setAttachmentViewerIsOpen,
  } = useUserProgressStore();
  const { user, authUsers } = useAuthenticateStore();

  function handleCloseAllModal() {
    setCalendarIsOpen(false);
    setInboxIsOpen(false);
    setSelectedMail(null);
    setChattingIsOpen(false);
    setAttachmentViewerIsOpen(false);

    closeModal();
  }

  function handleOpenCalendar() {
    setInboxIsOpen(false);
    setSelectedMail(null);
    setChattingIsOpen(false);
    setAttachmentViewerIsOpen(false);

    setCalendarIsOpen(true);
  }

  // 첨부파일 뷰어 열기 핸들러 수정
  function handleOpenAttachmentViewer() {
    setInboxIsOpen(false);
    setSelectedMail(null);
    setChattingIsOpen(false);
    setCalendarIsOpen(false);

    setAttachmentViewerIsOpen(!attachmentViewerIsOpen); // 토글 기능으로 수정
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
        {user && authUsers.length > 0 && (
          <>
            <IconButton
              type="button"
              className={`p-2.5 transition-all duration-200 hover:bg-accept ${
                attachmentViewerIsOpen ? "bg-accept" : ""
              }`}
              icon={<Paperclip color="#e9e9e9" size={22} />}
              onClick={handleOpenAttachmentViewer}
            />
            <IconButton
              type="button"
              className="p-2 transition-all duration-200 hover:bg-accept"
              icon={<CalendarIcon strokeColor="#e9e9e9" />}
              onClick={handleOpenCalendar}
            />
          </>
        )}
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

import Button from "@components/common/button/Button";

const MailFormHeader = ({
  closeForm,
  handleSubmit,
}: {
  closeForm: (isOpen: boolean) => void;
  handleSubmit: () => void;
}) => {
  return (
    <div className="flex items-center justify-between w-full h-16 min-h-16  px-4">
      <nav>
        <Button
          type="button"
          content="닫기"
          className="bg-default text-white"
          onAction={() => closeForm(false)}
        />
      </nav>

      <nav className="flex items-center gap-2">
        <Button
          type="button"
          content="임시"
          className="bg-default text-white"
        />
        <Button type="button" content="예약" className="bg-accept text-white" />
        <Button
          type="button"
          content="보내기"
          className="bg-theme text-white"
          onAction={handleSubmit}
        />
      </nav>
    </div>
  );
};

export default MailFormHeader;

import Button from "@components/common/button/Button";

const DetailEmailHeader = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex items-center justify-start w-full h-16 min-h-16 px-4">
      <div>
        <Button
          type="button"
          content="닫기"
          className="bg-default text-white"
          onAction={onClose}
        />
      </div>
    </div>
  );
};

export default DetailEmailHeader;

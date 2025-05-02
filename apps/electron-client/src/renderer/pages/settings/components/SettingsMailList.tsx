import { AuthUser } from "@/types/authType";

import IconButton from "@components/common/button/IconButton";

import GoogleIcon from "@assets/icons/GoogleIcon";
import DeleteIcon from "@assets/icons/DeleteIcon";

const InnerList = ({ user }: { user: AuthUser }) => {
  return (
    <div className="flex items-center justify-between p-2 w-full">
      <div className="flex justify-center items-center px-1 gap-3 w-fit h-fit">
        <span className="bg-blue-700 rounded-full p-2">
          <GoogleIcon />
        </span>

        <div className="flex flex-col items-start justify-between w-fit h-full">
          <h3 className="font-pre-bold">{user.name}</h3>
          <p className="font-pre-medium text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <IconButton
        icon={<DeleteIcon />}
        className="p-2 hover:bg-red-200 rounded-full transition-all duration-300"
        onClick={() => {
          console.log(" Delete Icon Clicked");
        }}
      />
    </div>
  );
};

const SettingsMailList = ({ users }: { users: AuthUser[] }) => {
  return (
    <div className="flex flex-col justify-center items-center p-1 gap-1 rounded-2xl bg-white">
      {users.map((user, index) => (
        <span key={user.id} className="w-full h-fit">
          <InnerList user={user} />
          {users.length - 1 !== index && (
            <hr className="border-t border-light1 w-[95%]" />
          )}
        </span>
      ))}
    </div>
  );
};

export default SettingsMailList;

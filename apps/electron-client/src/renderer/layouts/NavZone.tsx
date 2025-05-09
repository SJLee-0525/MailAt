import NavBarIcon from "@assets/icons/NavBarIcon";
import BottomNav from "@components/common/bottomNav/BottomNav";

const NavZone = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <>
      <div
        className={`absolute inset-0 flex justify-center items-center transition-allduration-300 ease-in-out ${isHovered ? "opacity-0" : "opacity-100"}`}
      >
        <NavBarIcon />
      </div>

      <div
        className={`absolute inset-0 flex justify-center items-center transition-all duration-300 ease-in-out ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <BottomNav />
      </div>
    </>
  );
};

export default NavZone;

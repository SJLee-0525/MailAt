import { useState } from "react";

import useUserProgressStore from "@stores/userProgressStore";

import NavZone from "@layouts/NavZone";
import SearchBar from "@components/common/bottomNav/SearchBar";

const HoverZone = () => {
  const { bottomNavProgress } = useUserProgressStore();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute bottom-0 left-[10%] w-[80%] h-10 flex justify-center items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {bottomNavProgress === null && <NavZone isHovered={isHovered} />}
      {bottomNavProgress === "search" && <SearchBar />}
    </div>
  );
};

export default HoverZone;

import { useState } from "react";

import TutorialSettingName from "@pages/tutorial/TutorialSettingName";
import TutorialPageOne from "@pages/tutorial/TutorialPageOne";

const TutorialLayout = () => {
  const [pageNumber, setPageNumber] = useState(0);
  const [settingName, setSettingName] = useState("");

  return (
    <div className="flex w-screen h-screen font-pre-regular">
      {pageNumber === 0 && (
        <TutorialSettingName
          setSettingName={setSettingName}
          setNextPage={() => setPageNumber(1)}
        />
      )}
      {pageNumber === 1 && (
        <TutorialPageOne
          settingName={settingName}
          setNextPage={() => setPageNumber(2)}
        />
      )}
      {pageNumber === 2 && (
        <div className="flex items-center justify-center w-full h-full">
          <h1 className="text-2xl font-bold">Welcome to the App!</h1>
        </div>
      )}
    </div>
  );
};

export default TutorialLayout;

import { useState } from "react";

import TutorialSettingName from "@pages/tutorial/TutorialSettingName";
import TutorialPageOne from "@pages/tutorial/TutorialPageOne";
import TutorialPageTwo from "@pages/tutorial/TutorialPageTwo";

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
      {pageNumber === 2 && <TutorialPageTwo settingName={settingName} />}
    </div>
  );
};

export default TutorialLayout;

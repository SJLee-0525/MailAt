import { useState, useEffect } from "react";

import useConversationsStore from "@stores/conversationsStore";

import EmailGraph from "@pages/emailGraph/EmailGraph";

import { GraphData } from "@/types/graphType";

const NetworkPage = () => {
  const { graphData } = useConversationsStore();

  const [local, setLocal] = useState<GraphData | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (graphData) {
      setLocal(graphData);
    } else {
      setLocal(null);
    }
  }, [graphData]);

  const handleMerge = (srcId: number, tgtId: number) => {
    console.log("Merge", srcId, tgtId);
  };

  console.log(selected, "selected");

  return (
    <div className="flex w-full h-full justify-center items-center overflow-hidden">
      <EmailGraph
        rawNodes={local?.nodes || []} // Ensure local is not null before accessing nodes
        rawEmails={local?.emails || []} // Ensure local is not null before accessing emails
        onSelect={setSelected}
        onMerge={handleMerge}
      />
    </div>
  );
};

export default NetworkPage;

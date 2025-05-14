import { useState, useEffect } from "react";

import useConversationsStore from "@stores/conversationsStore";

import EmailGraph from "@pages/emailGraph/EmailGraph";

import { GraphData } from "@/types/graphType";

const NetworkPage = () => {
  const { graphData } = useConversationsStore();

  const [local, setLocal] = useState<GraphData | null>(null);

  useEffect(() => {
    if (graphData) {
      setLocal(graphData);
    } else {
      setLocal(null);
    }
  }, [graphData]);

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex w-full h-full">
      <EmailGraph
        rawNodes={local?.nodes || []} // Ensure local is not null before accessing nodes
        rawEmails={local?.emails || []} // Ensure local is not null before accessing emails
        onSelect={setSelected}
      />
    </div>
  );
};

export default NetworkPage;

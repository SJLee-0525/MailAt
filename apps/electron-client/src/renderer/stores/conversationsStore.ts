import { create } from "zustand";

import { AllEmails, EmailSearchFilters } from "@/types/emailTypes";
import { GraphData } from "@/types/graphType";

import { GRAPH_EMAIL_DATA } from "@data/GRAPH_EMAIL_DATA";

interface ConversationsStore {
  folders: Record<string, string[]>;
  setFolders: (folders: Record<string, string[]>) => void;
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  conversations: AllEmails[];
  setConversations: (conversations: AllEmails[]) => void;
  filters: EmailSearchFilters;
  setFilters: (filters: EmailSearchFilters) => void;
  graphData: GraphData | null;
  setGraphData: (data: GraphData | null) => void;
}

const useConversationsStore = create<ConversationsStore>((set) => ({
  folders: {},
  setFolders: (folders) => set({ folders }),
  selectedFolder: null,
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  filters: {},
  setFilters: (filters) => set({ filters }),
  graphData: GRAPH_EMAIL_DATA.result,
  setGraphData: (data) =>
    set({
      graphData: data
        ? {
            nodes: data.nodes,
            emails: data.emails,
          }
        : null,
    }),
}));

export default useConversationsStore;

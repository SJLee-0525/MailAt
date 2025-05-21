import { create } from "zustand";

import { AllEmails, EmailSearchFilters } from "@/types/emailTypes";
import { RawNode, GraphEmail, SelectedGraph } from "@/types/graphType";

// import { GRAPH_EMAIL_DATA } from "@data/GRAPH_EMAIL_DATA";

interface ConversationsStore {
  folders: Record<string, string[]>;
  setFolders: (folders: Record<string, string[]>) => void;
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  conversations: AllEmails[];
  setConversations: (conversations: AllEmails[]) => void;
  selectedGraph: SelectedGraph | null;
  setSelectedGraph: (graph: SelectedGraph | null) => void;
  graphConversations: GraphEmail[];
  setGraphConversations: (conversations: GraphEmail[]) => void;
  filters: EmailSearchFilters;
  setFilters: (filters: EmailSearchFilters) => void;
  graphData: RawNode[] | null;
  setGraphData: (data: RawNode[] | null) => void;
}

const useConversationsStore = create<ConversationsStore>((set) => ({
  folders: {},
  setFolders: (folders) => set({ folders }),
  selectedFolder: null,
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  selectedGraph: null,
  setSelectedGraph: (graph) => set({ selectedGraph: graph }),
  graphConversations: [],
  setGraphConversations: (conversations) =>
    set({ graphConversations: conversations }),
  filters: {},
  setFilters: (filters) => set({ filters }),
  graphData: null,
  setGraphData: (data) => set({ graphData: data ? data : null }),
}));

export default useConversationsStore;

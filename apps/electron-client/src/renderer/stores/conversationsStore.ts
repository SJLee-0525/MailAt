import { create } from "zustand";

import { AllEmails, EmailSearchFilters } from "@/types/emailTypes";

interface ConversationsStore {
  folders: Record<string, string[]>;
  setFolders: (folders: Record<string, string[]>) => void;
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  conversations: AllEmails[];
  setConversations: (conversations: AllEmails[]) => void;
  filters: EmailSearchFilters;
  setFilters: (filters: EmailSearchFilters) => void;
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
}));

export default useConversationsStore;

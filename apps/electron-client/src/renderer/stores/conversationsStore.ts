import { create } from "zustand";

import { AllEmails, EmailSearchFilters } from "@/types/emailTypes";

interface ConversationsStore {
  conversations: AllEmails[];
  setConversations: (conversations: AllEmails[]) => void;
  filters: EmailSearchFilters;
  setFilters: (filters: EmailSearchFilters) => void;
}

const useConversationsStore = create<ConversationsStore>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  filters: {},
  setFilters: (filters) => set({ filters }),
}));

export default useConversationsStore;

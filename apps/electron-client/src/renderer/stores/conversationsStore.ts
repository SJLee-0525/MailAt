import { create } from "zustand";

import { AllEmails } from "@/types/emailTypes";

interface ConversationsStore {
  conversations: AllEmails[];
  setConversations: (conversations: AllEmails[]) => void;
}

const useConversationsStore = create<ConversationsStore>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
}));

export default useConversationsStore;

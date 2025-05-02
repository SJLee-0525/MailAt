import { create } from "zustand";

import { EmailConversation } from "@/types/emailTypes";

interface ConversationsStore {
  conversations: EmailConversation[];
  setConversations: (conversations: EmailConversation[]) => void;
}

const useConversationsStore = create<ConversationsStore>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
}));

export default useConversationsStore;

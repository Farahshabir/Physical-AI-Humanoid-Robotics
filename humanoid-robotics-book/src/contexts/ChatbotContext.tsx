import React, {createContext, useContext, useState, type ReactNode} from 'react';

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatbotContext = createContext<ChatbotContextType | undefined>(
  undefined,
);

export function ChatbotProvider({children}: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatbotContext.Provider value={{isOpen, setIsOpen}}>
      {children}
    </ChatbotContext.Provider>
  );
}

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
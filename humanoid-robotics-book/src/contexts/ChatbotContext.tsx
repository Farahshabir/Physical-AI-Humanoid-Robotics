import React, {createContext, useContext, useState, type ReactNode} from 'react';

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentLanguage: string;
  setCurrentLanguage: React.Dispatch<React.SetStateAction<string>>;
}

export const ChatbotContext = createContext<ChatbotContextType | undefined>(
  undefined,
);

export function ChatbotProvider({children}: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English'); // Default language

  return (
    <ChatbotContext.Provider value={{isOpen, setIsOpen, currentLanguage, setCurrentLanguage}}>
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
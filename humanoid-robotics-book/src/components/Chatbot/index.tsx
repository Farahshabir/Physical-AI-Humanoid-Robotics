import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@site/src/contexts/ChatbotContext';
import styles from './styles.module.css';

const API_URL = "http://localhost:8000/chat"; // URL of your FastAPI backend

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

export default function Chatbot(): JSX.Element {
  const { isOpen, setIsOpen } = useChatbot();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message container when new messages are added
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selectedText = window.getSelection()?.toString().trim();
      if (selectedText && selectedText.length > 10) {
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text: selectedText,
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 5,
        });
      } else {
        setSelection(null);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleSendMessage = async (query: string, selectedText: string | null = null) => {
    if (!query.trim()) return;

    const userMessage: Message = { text: query, sender: 'user' };
    setMessages(prev => [...prev, userMessage, {text: "...", sender: 'bot'}]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, selected_text: selectedText }),
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';

      setMessages(prev => prev.slice(0, -1)); // Remove the "..." placeholder

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        botMessage += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.sender === 'bot') {
            // Update the last bot message
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...lastMessage, text: botMessage };
            return newMessages;
          } else {
            // Add a new bot message
            return [...prev, { text: botMessage, sender: 'bot' }];
          }
        });
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage: Message = { text: "Sorry, I'm having trouble connecting. Please check the backend server.", sender: 'bot' };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
      setSelection(null);
    }
  };
  
  const handleSelectionChat = () => {
    if (selection) {
      setIsOpen(true);
      const query = prompt("What would you like to ask about this text?", "Summarize this for me");
      if (query) {
        handleSendMessage(query, selection.text);
      }
    }
  };

  return (
    <>
      <div className={styles.chatContainer}>
        {isOpen ? (
          <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>AI Assistant</div>
            <div className={styles.messageContainer} ref={messageContainerRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className={styles.chatInputContainer}>
              <input
                type="text"
                className={styles.chatInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(input)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <button className={styles.sendButton} onClick={() => handleSendMessage(input)} disabled={isLoading}>
                Send
              </button>
            </div>
          </div>
        ) : null}
      </div>
      
      {selection && (
        <div 
          className={styles.textSelectionPopup} 
          style={{ top: selection.y, left: selection.x }}
          onClick={handleSelectionChat}
        >
          Chat about this
        </div>
      )}
    </>
  );
}

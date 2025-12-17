import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@site/src/contexts/ChatbotContext';
import styles from './styles.module.css';
import Markdown from 'react-markdown';

// The backend endpoint - relative path for Vercel
const API_URL = "/chat";

// Updated message type to match backend data structure
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: any[];
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

  // Preserve the text selection handler
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
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, text: query, sender: 'user' };
    const assistantId = `bot-${Date.now()}`;
    const assistantMessage: Message = { id: assistantId, text: '', sender: 'bot', sources: [] };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: selectedText ? `${selectedText} - ${query}` : query }),
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process buffer line by line for Server-Sent Events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(5));
            setMessages(prev => prev.map(msg => {
              if (msg.id === assistantId) {
                const newMsg = {...msg};
                if (data.content) {
                  newMsg.text += data.content;
                }
                if (data.sources) {
                  newMsg.sources = data.sources;
                }
                return newMsg;
              }
              return msg;
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId ? { ...msg, text: "Sorry, I'm having trouble connecting. Please ensure the backend server is running and refresh the page." } : msg
      ));
    } finally {
      setIsLoading(false);
      setSelection(null);
    }
  };
  
  const handleSelectionChat = () => {
    if (selection) {
      setIsOpen(true);
      const query = prompt("What would you like to ask about this text?", "Explain this in simpler terms");
      if (query) {
        handleSendMessage(query, selection.text);
      }
    }
  };

  return (
    <>
      <div className={styles.chatContainer}>
        {isOpen && (
          <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>AI Assistant <button className={styles.closeButton} onClick={() => setIsOpen(false)}>✕</button></div>
            <div className={styles.messageContainer} ref={messageContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                  <Markdown>{msg.text}</Markdown>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={styles.sourcesContainer}>
                      <strong>Sources:</strong>
                      <ul>
                        {msg.sources.map((source: any, i: number) => (
                           <li key={i}>{source.url || `Reference ${i+1}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && <div className={`${styles.message} ${styles.bot} ${styles.typingIndicator}`}>...</div>}
            </div>
            <div className={styles.chatInputContainer}>
              <input
                type="text"
                className={styles.chatInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <button className={styles.sendButton} onClick={() => handleSendMessage(input)} disabled={isLoading}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      
      {selection && !isOpen && (
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
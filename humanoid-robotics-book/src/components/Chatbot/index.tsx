import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@site/src/contexts/ChatbotContext';
import styles from './styles.module.css';
import Markdown from 'react-markdown';
import { Send, User, Bot, RefreshCcw, Paperclip } from 'lucide-react';

const API_URL = "/chat"; // Relative path for Vercel

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

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isOpen) { // Only show popup if chat is closed
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
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isOpen]);

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
        body: JSON.stringify({ query: selectedText ? `Based on the text "${selectedText}", ${query}` : query }),
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(5));
            setMessages(prev => prev.map(msg => {
              if (msg.id === assistantId) {
                const newMsg = {...msg};
                if (data.content) newMsg.text += data.content;
                if (data.sources) newMsg.sources = data.sources;
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

  const handleRegenerate = (messageIdToRegenerate: string) => {
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMessage) {
      // Remove the old assistant response
      setMessages(prev => prev.filter(m => m.id !== messageIdToRegenerate));
      // Resend the last user query
      handleSendMessage(lastUserMessage.text);
    }
  };

  return (
    <>
      <div className={styles.chatContainer}>
        {isOpen && (
          <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>
              <span>AI Assistant</span>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)} title="Close Chat">✕</button>
            </div>
            <div className={styles.messageContainer} ref={messageContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                  <div className={styles.avatar}>
                    {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={styles.messageContent}>
                    <Markdown>{msg.text}</Markdown>
                    {msg.sender === 'bot' && !isLoading && msg.text && (
                      <div className={styles.messageActions}>
                        <button onClick={() => handleRegenerate(msg.id)} title="Regenerate response">
                          <RefreshCcw size={14}/>
                        </button>
                      </div>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className={styles.sourcesContainer}>
                        <strong>Sources:</strong>
                        <ul>
                          {msg.sources.map((source: any, i: number) => (
                            <li key={i}>
                              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.metadata?.title || source.url || `Reference ${i+1}`}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.sender === 'bot' && (
                 <div className={`${styles.message} ${styles.bot}`}>
                    <div className={styles.avatar}><Bot size={20} /></div>
                    <div className={styles.typingIndicator}><span></span><span></span><span></span></div>
                 </div>
              )}
              <div ref={messageContainerRef} />
            </div>
            <div className={styles.chatInputContainer}>
               <button className={styles.attachButton} title="Attach file (not implemented)">
                  <Paperclip size={18}/>
              </button>
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
                <Send size={18}/>
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
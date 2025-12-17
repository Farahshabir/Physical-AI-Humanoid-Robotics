import React from 'react';
import { useChatbot } from '@site/src/contexts/ChatbotContext';
import { useAuth } from '@site/src/contexts/AuthContext'; // Import useAuth
import styles from './styles.module.css';

export default function LanguageSelector(): JSX.Element | null {
  const { currentLanguage, setCurrentLanguage } = useChatbot();
  const { isAuthenticated } = useAuth(); // Get authentication status

  // Only render if the user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.languageSelectorContainer}>
      <button 
        className={styles.languageButton}
        onClick={() => setCurrentLanguage('Urdu')} 
        disabled={currentLanguage === 'Urdu'}
      >
        Urdu
      </button>
      <button
        className={styles.languageButton}
        onClick={() => setCurrentLanguage('English')}
        disabled={currentLanguage === 'English'}
      >
        English
      </button>
    </div>
  );
}
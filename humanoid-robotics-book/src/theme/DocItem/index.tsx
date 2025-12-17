import React, { useState, useCallback, useEffect } from 'react';
import DocItem from '@theme-original/DocItem';
import type DocItemType from '@theme/DocItem';
import type {WrapperProps} from '@docusaurus/types';
import { useAuth } from '@site/src/contexts/AuthContext';
import { translateText } from '@site/src/utils/translationService'; // Mock service

type Props = WrapperProps<typeof DocItemType>;

export default function DocItemWrapper(props: Props): JSX.Element {
  const { isAuthenticated } = useAuth();
  const [isTranslated, setIsTranslated] = useState<boolean>(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const contentRef = React.useRef<HTMLDivElement>(null); // Ref to hold the content div

  const getPageContent = useCallback(() => {
    if (contentRef.current) {
      // Exclude elements that shouldn't be translated (e.g., code blocks, navigation)
      const clone = contentRef.current.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('pre, code, .no-translate').forEach(el => el.remove());
      return clone.textContent || '';
    }
    return '';
  }, []);

  const handleTranslateToggle = useCallback(async () => {
    if (!isTranslated) {
      setIsLoading(true);
      const originalText = getPageContent();
      if (originalText) {
        // Check local storage cache first
        const cacheKey = `translation-ur-${props.content.metadata.id}`; // Assuming content.metadata.id is unique for each doc
        const cachedTranslation = localStorage.getItem(cacheKey);

        if (cachedTranslation) {
          setTranslatedContent(cachedTranslation);
          console.log('Translation loaded from cache.');
        } else {
          const translated = await translateText(originalText);
          setTranslatedContent(translated);
          localStorage.setItem(cacheKey, translated); // Cache the translation
          console.log('Translation fetched and cached.');
        }
      }
      setIsLoading(false);
    }
    setIsTranslated(prev => !prev);
  }, [isTranslated, getPageContent, props.content.metadata.id]);


  // Effect to reset translation when page changes
  useEffect(() => {
    setIsTranslated(false);
    setTranslatedContent(null);
    setIsLoading(false);
  }, [props.content.metadata.id]); // Dependency on doc item ID

  return (
    <>
      {isAuthenticated && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button
            onClick={handleTranslateToggle}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isTranslated ? '#e0e0e0' : '#007bff',
              color: isTranslated ? '#333' : 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Translating...' : (isTranslated ? 'Show Original (English)' : 'Translate to Urdu')}
          </button>
        </div>
      )}
      <div ref={contentRef}> {/* Attach ref to the content div */}
        {isTranslated && translatedContent ? (
          <div style={{ /* Add styles for translated content */ }}>
            <p className="translation-disclaimer" style={{ fontStyle: 'italic', color: '#555' }}>
              (Translated from English to Urdu - Mock Translation)
            </p>
            {translatedContent.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <DocItem {...props} />
        )}
      </div>
    </>
  );
}

// humanoid-robotics-book/src/utils/translationService.ts
const TRANSLATE_API_URL = "http://localhost:8000/translate"; // URL of your FastAPI translation backend

export async function translateText(text: string, targetLang: string = 'urdu'): Promise<string> {
    if (!text || targetLang === 'English') {
        return text; // No translation needed if text is empty or target is English
    }

    try {
        const response = await fetch(TRANSLATE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, target_language: targetLang }),
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.translated_text;
    } catch (error) {
        console.error("Error calling translation API:", error);
        return `[Translation Error for ${targetLang}]: ${text}`; // Return original text with error
    }
}
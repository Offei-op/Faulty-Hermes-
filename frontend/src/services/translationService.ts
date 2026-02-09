/**
 * Translation Service using MyMemory API (Free)
 * Provides real-time translation for chat messages
 */

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

export interface TranslationResult {
    translatedText: string;
    error?: string;
}

/**
 * Language code mapping for common languages
 */
export const LANGUAGE_CODES: { [key: string]: string } = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Russian': 'ru',
    'Hindi': 'hi',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Turkish': 'tr',
    'Vietnamese': 'vi',
    'Thai': 'th',
    'Greek': 'el',
    'Hebrew': 'he',
    'Swedish': 'sv',
};

/**
 * Get language code from language name
 */
export function getLanguageCode(languageName: string): string {
    return LANGUAGE_CODES[languageName] || 'en';
}

/**
 * Translate text using MyMemory API (FREE)
 * @param text - Text to translate
 * @param sourceLang - Source language code (e.g., 'en')
 * @param targetLang - Target language code (e.g., 'fr')
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<TranslationResult> {
    // Don't translate empty text
    if (!text.trim()) {
        return { translatedText: '' };
    }

    // Don't translate if same language
    if (sourceLang === targetLang) {
        return { translatedText: text };
    }

    try {
        // Encode the text for URL
        const encodedText = encodeURIComponent(text);
        const langPair = `${sourceLang}|${targetLang}`;

        const url = `${MYMEMORY_API_URL}?q=${encodedText}&langpair=${langPair}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('MyMemory API error:', response.status);
            return { translatedText: '', error: 'Translation failed' };
        }

        const data = await response.json();

        // Check for API errors
        if (data.responseStatus !== 200) {
            console.error('MyMemory API error:', data.responseDetails);
            return { translatedText: '', error: data.responseDetails || 'Translation failed' };
        }

        // Extract translated text
        const translatedText = data.responseData?.translatedText || '';

        return { translatedText };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: '', error: 'Translation error' };
    }
}

/**
 * Translate text with language names (convenience function)
 * @param text - Text to translate
 * @param sourceLanguageName - Source language name (e.g., 'English')
 * @param targetLanguageName - Target language name (e.g., 'French')
 */
export async function translateWithLanguageNames(
    text: string,
    sourceLanguageName: string,
    targetLanguageName: string
): Promise<TranslationResult> {
    const sourceLang = getLanguageCode(sourceLanguageName);
    const targetLang = getLanguageCode(targetLanguageName);

    return translateText(text, sourceLang, targetLang);
}

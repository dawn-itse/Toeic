/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pronounces a given text in English using the browser's native text-to-speech engine.
 * @param text The English word or phrase to speak.
 */
export const speakEnglish = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing pronunciation queues to play immediately on click
    window.speechSynthesis.cancel();

    // Clean up text if there are meta indicators (e.g. discard IPA transcription segments)
    const cleanText = text.split('/')[0].trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower than 1.0 for better learning and comprehension
    utterance.pitch = 1.05; // Pleasant, natural pitch tuning

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis is not supported on this device/browser.');
  }
};

/**
 * Pronounces first the phoneme representation (e.g. vowel or consonant approximate sound),
 * then waits a brief moment and speaks the clean English sample word.
 * @param phonemeApprox Slower phonetic representation
 * @param word Sample English word
 */
export const speakPhonemeThenWord = (phonemeApprox: string, word: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    // 1. Speak the phoneme approximation
    const phonemeUtterance = new SpeechSynthesisUtterance(phonemeApprox);
    phonemeUtterance.lang = 'en-US';
    phonemeUtterance.rate = 0.6; // Speaks the phoneme nice and slow for learning
    phonemeUtterance.pitch = 1.1;

    phonemeUtterance.onend = () => {
      // 2. Queue the word after a short pause for beautiful learning flow
      setTimeout(() => {
        const wordUtterance = new SpeechSynthesisUtterance(word);
        wordUtterance.lang = 'en-US';
        wordUtterance.rate = 0.8;
        wordUtterance.pitch = 1.05;
        window.speechSynthesis.speak(wordUtterance);
      }, 550);
    };

    window.speechSynthesis.speak(phonemeUtterance);
  } else {
    console.warn('Speech synthesis is not supported on this device/browser.');
  }
};

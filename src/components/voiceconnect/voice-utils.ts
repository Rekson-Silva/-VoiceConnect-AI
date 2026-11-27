import type { LanguageCode } from "./data";

const SEND_CONFIRMATIONS: Record<LanguageCode, string> = {
  "en-IN": "yes send",
  "ta-IN": "ஆம் அனுப்பு",
  "hi-IN": "हाँ भेजें",
  "te-IN": "అవును పంపండి",
  "kn-IN": "ಹೌದು ಕಳುಹಿಸಿ",
  "ml-IN": "അതെ അയയ്ക്കൂ",
};

export function normalizeSpeech(text: string): string {
  return text.toLocaleLowerCase().replace(/[\p{P}\p{S}]/gu, " ").replace(/\s+/gu, " ").trim();
}

export function isExplicitSendConfirmation(text: string, language: LanguageCode): boolean {
  return normalizeSpeech(text) === normalizeSpeech(SEND_CONFIRMATIONS[language]);
}

export function matchesPhrase(text: string, phrases: string[]): boolean {
  const normalizedText = normalizeSpeech(text);
  return phrases.some((phrase) => normalizedText.includes(normalizeSpeech(phrase)));
}
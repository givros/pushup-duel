export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en'];

export function detectDeviceLanguage() {
  const browserLanguages = Array.isArray(navigator.languages) ? navigator.languages : [];
  const candidate = [navigator.language, ...browserLanguages].find(Boolean) || DEFAULT_LANGUAGE;

  return candidate.toLowerCase().split('-')[0] || DEFAULT_LANGUAGE;
}

export function getAppLanguage() {
  const detectedLanguage = detectDeviceLanguage();

  return SUPPORTED_LANGUAGES.includes(detectedLanguage) ? detectedLanguage : DEFAULT_LANGUAGE;
}

export function applyDocumentLanguage(language = getAppLanguage()) {
  document.documentElement.lang = language;

  return language;
}

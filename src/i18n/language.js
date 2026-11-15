export const DEFAULT_LANGUAGE = 'en';

export function languageFromSettings(data) {
  return data?.language === 'es' ? 'es' : DEFAULT_LANGUAGE;
}

export function readStoredLanguage() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
    return languageFromSettings(JSON.parse(localStorage.getItem('lunaria.settings')));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

let language = readStoredLanguage();

export function getLanguage() {
  return language;
}

export function setLanguage(value) {
  language = languageFromSettings({ language: value });
  return language;
}

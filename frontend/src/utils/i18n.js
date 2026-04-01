import en from '../locales/en.json';
import ko from '../locales/ko.json';
import vi from '../locales/vi.json';

const LOCALES = { en, ko, vi };

let currentLang = 'en';

export function setLanguage(lang) {
  if (LOCALES[lang]) currentLang = lang;
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return LOCALES[currentLang]?.[key] ?? LOCALES['en']?.[key] ?? key;
}

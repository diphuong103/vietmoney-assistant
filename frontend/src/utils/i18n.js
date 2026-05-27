import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ko from '../locales/ko.json';
import vi from '../locales/vi.json';

const resources = {
  en: { translation: en },
  ko: { translation: ko },
  vi: { translation: vi }
};

const savedLang = localStorage.getItem('appLang') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already protects from xss
    }
  });

export function setLanguage(lang) {
  if (resources[lang]) {
    i18n.changeLanguage(lang);
    localStorage.setItem('appLang', lang);
  }
}

export function getLanguage() {
  return i18n.language || 'vi';
}

export function t(key, options) {
  return i18n.t(key, options);
}

export default i18n;

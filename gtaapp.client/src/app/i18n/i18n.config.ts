import { LanguageCode, LanguageInfo } from './i18n.types';

export const DEFAULT_LANGUAGE: LanguageCode = 'es';
export const STORAGE_KEY = 'gta_lang';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'es',
    label: 'Español',
    shortLabel: 'ES'
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN'
  }
];

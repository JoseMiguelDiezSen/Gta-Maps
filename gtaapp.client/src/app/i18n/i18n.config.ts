import { LanguageCode, LanguageInfo } from './i18n.types';

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const STORAGE_KEY = 'gta_lang';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN'
  },
  {
    code: 'es',
    label: 'Español',
    shortLabel: 'ES'
  },
  {
    code: 'pt',
    label: 'Português',
    shortLabel: 'PT'
  },
  {
    code: 'zh',
    label: '简体中文',
    shortLabel: 'ZH'
  },
  {
    code: 'fr',
    label: 'Français',
    shortLabel: 'FR'
  }
];

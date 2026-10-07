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
  },
  {
    code: 'de',
    label: 'Deutsch',
    shortLabel: 'DE'
  },
  {
    code: 'it',
    label: 'Italiano',
    shortLabel: 'IT'
  },
  {
    code: 'ru',
    label: 'Русский',
    shortLabel: 'RU'
  },
  {
    code: 'ar',
    label: 'العربية',
    shortLabel: 'AR',
    dir: 'rtl'
  },
  {
    code: 'ja',
    label: '日本語',
    shortLabel: 'JA'
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    shortLabel: 'HI'
  },
  {
    code: 'tr',
    label: 'Türkçe',
    shortLabel: 'TR'
  },
  {
    code: 'ko',
    label: '한국어',
    shortLabel: 'KO'
  }
];

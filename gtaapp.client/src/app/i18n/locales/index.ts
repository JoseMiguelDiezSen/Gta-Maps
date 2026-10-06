import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { zh } from './zh';
import { LanguageCode, TranslationSchema } from '../i18n.types';

export const DICTIONARIES: Record<LanguageCode, TranslationSchema> = {
  es,
  en,
  pt,
  zh
};

export { es, en, pt, zh };

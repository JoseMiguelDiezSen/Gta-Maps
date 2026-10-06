import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { LanguageCode, TranslationSchema } from '../i18n.types';

export const DICTIONARIES: Record<LanguageCode, TranslationSchema> = {
  es,
  en,
  pt
};

export { es, en, pt };

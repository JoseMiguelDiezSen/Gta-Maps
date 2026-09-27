import { es } from './es';
import { en } from './en';
import { LanguageCode, TranslationSchema } from '../i18n.types';

export const DICTIONARIES: Record<LanguageCode, TranslationSchema> = {
  es,
  en
};

export { es, en };

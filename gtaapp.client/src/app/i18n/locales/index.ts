import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { zh } from './zh';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { ru } from './ru';
import { ar } from './ar';
import { ja } from './ja';
import { hi } from './hi';
import { tr } from './tr';
import { ko } from './ko';
import { LanguageCode, TranslationSchema } from '../i18n.types';

export const DICTIONARIES: Record<LanguageCode, TranslationSchema> = {
  es,
  en,
  pt,
  zh,
  fr,
  de,
  it,
  ru,
  ar,
  ja,
  hi,
  tr,
  ko
};

export { es, en, pt, zh, fr, de, it, ru, ar, ja, hi, tr, ko };

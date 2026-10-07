import { Injectable, signal, computed } from '@angular/core';
import { LanguageCode, LanguageInfo, TranslationParams } from './i18n.types';
import { DEFAULT_LANGUAGE, STORAGE_KEY, SUPPORTED_LANGUAGES } from './i18n.config';
import { DICTIONARIES } from './locales';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  readonly supportedLanguages: readonly LanguageInfo[] = SUPPORTED_LANGUAGES;

  // Reactivo con Angular Signals
  readonly currentLanguage = signal<LanguageCode>(this.detectInitialLanguage());

  get currentLang(): LanguageCode {
    return this.currentLanguage();
  }

  readonly currentLanguageInfo = computed<LanguageInfo>(() => {
    const code = this.currentLanguage();
    return this.supportedLanguages.find(l => l.code === code) || this.supportedLanguages[0];
  });

  readonly currentDictionary = computed(() => {
    const code = this.currentLanguage();
    return DICTIONARIES[code] || DICTIONARIES[DEFAULT_LANGUAGE];
  });

  constructor() {
    this.applyDocumentLang(this.currentLanguage());
  }

  /**
   * Cambia el idioma actual en toda la aplicación de forma instantánea y reactiva.
   */
  setLanguage(code: LanguageCode): void {
    if (this.currentLanguage() === code) return;

    this.currentLanguage.set(code);
    this.applyDocumentLang(code);

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      console.warn('[i18n] Error guardando preferencia de idioma en localStorage:', e);
    }
  }

  /**
   * Traduce una clave con resolución jerárquica y soporte de interpolación.
   * Ej: translate('gta5.hud.propertiesCount', { count: 12, collectibles: 50 })
   */
  translate(path: string, params?: TranslationParams): string {
    if (!path) return '';

    // 1. Intentar resolver en el idioma actual
    let val = this.resolvePath(this.currentDictionary(), path);

    // 2. Si no existe, fallback a Español (por defecto)
    if (val === undefined || val === null) {
      val = this.resolvePath(DICTIONARIES[DEFAULT_LANGUAGE], path);
    }

    // 3. Si aún no existe, devolver la clave tal cual
    if (val === undefined || val === null) {
      return path;
    }

    let text = String(val);

    // 4. Interpolación de variables {{ param }} o {param}
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        const regexDouble = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        const regexSingle = new RegExp(`{\\s*${key}\\s*}`, 'g');
        text = text.replace(regexDouble, String(value)).replace(regexSingle, String(value));
      }
    }

    return text;
  }

  /**
   * Alias ultra corto y ergonómico para uso en TypeScript.
   */
  t(path: string, params?: TranslationParams): string {
    return this.translate(path, params);
  }

  /**
   * Detecta idioma inicial desde parámetro de URL, localStorage o preferencias del navegador (navigator.languages / navigator.language).
   */
  private detectInitialLanguage(): LanguageCode {
    // 1. Parámetro explícito de URL (?lang=es o ?lang=en) para depuración y enlaces directos
    if (typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang')?.toLowerCase().trim() as LanguageCode | undefined;
        if (urlLang && SUPPORTED_LANGUAGES.some(l => l.code === urlLang)) {
          try {
            localStorage.setItem(STORAGE_KEY, urlLang);
          } catch {}
          return urlLang;
        }
      } catch {
        // Ignorar fallo de URLSearchParams
      }
    }

    // 2. Preferencia previamente guardada en localStorage (clave v2)
    try {
      if (localStorage.getItem('gta_lang')) {
        localStorage.removeItem('gta_lang'); // Limpieza automática de clave antigua v1
      }
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // Ignorar fallo de localStorage (modo incógnito estricto / sandbox)
    }

    // 3. Detección automática según idiomas configurados en el navegador del usuario
    if (typeof navigator !== 'undefined') {
      const candidates: string[] = [];
      if (Array.isArray(navigator.languages)) {
        candidates.push(...navigator.languages);
      }
      if (navigator.language) {
        candidates.push(navigator.language);
      }
      const navAny = navigator as any;
      if (navAny.userLanguage) {
        candidates.push(navAny.userLanguage);
      }
      if (navAny.browserLanguage) {
        candidates.push(navAny.browserLanguage);
      }

      for (const raw of candidates) {
        if (!raw || typeof raw !== 'string') continue;
        const normalized = raw.toLowerCase().trim();

        // Coincidencia exacta (ej. 'es', 'pt', 'en', 'zh')
        const exactMatch = SUPPORTED_LANGUAGES.find(l => l.code === normalized);
        if (exactMatch) {
          return exactMatch.code;
        }

        // Coincidencia por prefijo base (ej. 'es-ES' -> 'es', 'pt-BR' -> 'pt', 'zh-CN' -> 'zh')
        const basePrefix = normalized.split(/[-_]/)[0];
        const prefixMatch = SUPPORTED_LANGUAGES.find(l => l.code === basePrefix);
        if (prefixMatch) {
          return prefixMatch.code;
        }
      }
    }

    return DEFAULT_LANGUAGE;
  }

  private applyDocumentLang(code: string): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = code;
      const isRtl = code === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    }
  }

  private resolvePath(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') return undefined;

    const parts = path.split('.');
    let curr = obj;

    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }

    return curr;
  }
}

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
   * Detecta idioma inicial desde localStorage o desde navigator.language del navegador.
   */
  private detectInitialLanguage(): LanguageCode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'zh') {
        return saved;
      }
    } catch {
      // Ignorar fallo de localStorage (modo incógnito estricto / sandbox)
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        return 'en';
      }
      if (browserLang.startsWith('pt')) {
        return 'pt';
      }
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
    }

    return DEFAULT_LANGUAGE;
  }

  private applyDocumentLang(code: string): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = code;
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

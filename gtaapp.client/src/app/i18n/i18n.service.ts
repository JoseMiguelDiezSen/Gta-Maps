import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageCode, LanguageInfo, TranslationParams } from './i18n.types';
import { DEFAULT_LANGUAGE, STORAGE_KEY, SUPPORTED_LANGUAGES } from './i18n.config';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  readonly supportedLanguages: readonly LanguageInfo[] = SUPPORTED_LANGUAGES;

  // Cache en memoria de los diccionarios cargados desde JSON
  private readonly loadedDictionaries = signal<Record<string, Record<string, unknown>>>({});

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
    const dicts = this.loadedDictionaries();
    return dicts[code] || dicts[DEFAULT_LANGUAGE] || {};
  });

  constructor() {
    const initialLang = this.currentLanguage();
    this.applyDocumentLang(initialLang);
    this.loadLanguage(initialLang);
    if (initialLang !== DEFAULT_LANGUAGE) {
      if (typeof window !== 'undefined') {
        const win = window as Window & { requestIdleCallback?: (cb: () => void) => number };
        if (typeof win.requestIdleCallback === 'function') {
          win.requestIdleCallback(() => setTimeout(() => this.loadLanguage(DEFAULT_LANGUAGE), 4000));
        } else {
          setTimeout(() => this.loadLanguage(DEFAULT_LANGUAGE), 5000);
        }
      } else {
        this.loadLanguage(DEFAULT_LANGUAGE);
      }
    }
  }

  /**
   * Carga asíncronamente el archivo JSON del idioma solicitado desde assets/i18n/
   */
  private loadLanguage(code: LanguageCode): void {
    const current = this.loadedDictionaries();
    if (current[code]) return; // Ya está cargado en caché de memoria

    this.http.get<Record<string, unknown>>(`assets/i18n/${code}.json`).subscribe({
      next: (dict) => {
        this.loadedDictionaries.update(prev => ({
          ...prev,
          [code]: dict
        }));
      },
      error: (err) => {
        console.warn(`[i18n] Error cargando assets/i18n/${code}.json, usando fallback:`, err);
      }
    });
  }

  /**
   * Cambia el idioma actual en toda la aplicación de forma instantánea y reactiva.
   */
  setLanguage(code: LanguageCode): void {
    if (this.currentLanguage() === code) return;

    this.loadLanguage(code);
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
      const dicts = this.loadedDictionaries();
      val = this.resolvePath(dicts[DEFAULT_LANGUAGE], path);
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
          } catch {
            // Ignorar fallo de almacenamiento
          }
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
      const navLegacy = navigator as unknown as { userLanguage?: string; browserLanguage?: string };
      if (navLegacy.userLanguage) {
        candidates.push(navLegacy.userLanguage);
      }
      if (navLegacy.browserLanguage) {
        candidates.push(navLegacy.browserLanguage);
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
    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        document.documentElement.lang = code;
        document.documentElement.dir = 'ltr';
        document.documentElement.setAttribute('dir', 'ltr');
      }
      if (document.body) {
        document.body.dir = 'ltr';
        document.body.setAttribute('dir', 'ltr');
      }
    }
  }

  private resolvePath(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;

    const parts = path.split('.');
    let curr: unknown = obj;

    for (const part of parts) {
      if (curr === undefined || curr === null || typeof curr !== 'object') return undefined;
      curr = (curr as Record<string, unknown>)[part];
    }

    return curr;
  }
}

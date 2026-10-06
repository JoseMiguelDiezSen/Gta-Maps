import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { GotyMessage, GotyGameMode } from '../models/goty';
import { TranslationService } from '../i18n';

export interface GotyIntent {
  id: string;
  keywords: string[];
  responses: string[];
}

export interface GotyBrain {
  common: GotyIntent[];
  'gta5-historia': GotyIntent[];
  'gta5-online': GotyIntent[];
  'gta6-historia': GotyIntent[];
  'gta6-online': GotyIntent[];
}

/**
 * Servicio del Asistente Virtual Criminal GOTY.
 * En modo capado para producción devuelve indefinidamente el mensaje de ajuste en el idioma activo.
 */
@Injectable({
  providedIn: 'root'
})
export class GotyService {
  private isBotEnabled = true;

  // Caché de cerebros locales por idioma ('es', 'en', etc.)
  private loadedBrains: Record<string, GotyBrain> = {};

  // Mensajes fijos por contexto de juego e idioma (Modo capado para producción)
  private readonly fixedMessages: Record<string, Record<GotyGameMode, string>> = {
    es: {
      'gta5-historia': 'Hola, soy GOTY 5, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta5-online': 'Hola, soy GOTY 5, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta6-historia': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta6-online': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.'
    },
    en: {
      'gta5-historia': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta5-online': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-historia': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-online': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience."
    },
    pt: {
      'gta5-historia': 'Olá, sou o GOTY 5, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta5-online': 'Olá, sou o GOTY 5, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.',
      'gta6-historia': 'Olá, sou o GOTY 6, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta6-online': 'Olá, sou o GOTY 6, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.'
    },
    zh: {
      'gta5-historia': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta5-online': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-historia': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-online': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。'
    }
  };

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    const saved = localStorage.getItem('goty_bot_enabled');
    if (saved !== null) {
      this.isBotEnabled = saved === 'true';
    }

    // Precargar cerebros de reserva en los idiomas disponibles
    this.preloadBrain('es');
    this.preloadBrain('en');
    this.preloadBrain('pt');
    this.preloadBrain('zh');
  }

  get isEnabled(): boolean {
    return this.isBotEnabled;
  }

  get currentLang(): string {
    return this.translationService.currentLanguage() || 'es';
  }

  setBotEnabled(enabled: boolean): void {
    this.isBotEnabled = enabled;
    localStorage.setItem('goty_bot_enabled', enabled ? 'true' : 'false');
  }

  /**
   * Carga y cachea el archivo JSON del cerebro local para el idioma solicitado.
   * Escalable para futuros idiomas: solo se requiere añadir 'goty-brain-{lang}.json' en assets/data/
   */
  private preloadBrain(lang: string): void {
    if (this.loadedBrains[lang]) return;

    this.http.get<GotyBrain>(`assets/data/goty-brain-${lang}.json`).subscribe({
      next: (data) => {
        this.loadedBrains[lang] = data;
      },
      error: (err) => console.warn(`[GOTY] Error cargando cerebro local para idioma '${lang}':`, err)
    });
  }

  /**
   * Devuelve el saludo inicial personalizado según el modo de juego y el idioma seleccionado en la app.
   */
  getInitialGreeting(context: GotyGameMode): GotyMessage {
    const currentLang = this.translationService.currentLanguage() || 'es';
    const langMessages = this.fixedMessages[currentLang] || this.fixedMessages['es'];
    const text = langMessages[context] || langMessages['gta5-online'];

    return {
      id: 'msg-' + Date.now(),
      sender: 'goty',
      text,
      timestamp: new Date()
    };
  }

  /**
   * Procesa la consulta del usuario.
   * En modo capado devuelve indefinidamente el mensaje de ajuste en el idioma activo.
   */
  processUserQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const currentLang = this.translationService.currentLanguage() || 'es';
    const langMessages = this.fixedMessages[currentLang] || this.fixedMessages['es'];
    const text = langMessages[context] || langMessages['gta5-online'];

    return of({
      id: 'msg-' + Date.now(),
      sender: 'goty' as const,
      text,
      timestamp: new Date(),
      isAngry: false
    });
  }

  private getDaysUntilRelease(): number {
    const target = new Date(2026, 10, 19); // 19 de Noviembre de 2026
    const diff = target.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private normalizeString(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  /**
   * Motor de búsqueda y respuestas local en caso de desconexión o fallo del servicio de IA.
   */
  private processLocalQuery(query: string, context: GotyGameMode, lang: string): Observable<GotyMessage> {
    const cleanQuery = this.normalizeString(query);
    const activeBrain = this.loadedBrains[lang] || this.loadedBrains['es'] || {
      common: [], 'gta5-historia': [], 'gta5-online': [], 'gta6-historia': [], 'gta6-online': []
    };

    // Fusionar el bloque específico del modo de juego primero (para prioridad) y luego el común
    const activeIntents = [
      ...(activeBrain[context] || []),
      ...(activeBrain.common || [])
    ];

    // 1. Buscar la intención que encaje con alguna palabra clave
    let matchedIntent = activeIntents.find(intent =>
      intent.id !== 'default' && intent.keywords.some(kw => {
        const cleanKw = this.normalizeString(kw);
        return cleanQuery.includes(cleanKw);
      })
    );

    // 2. Si no entiende nada, selecciona la intención por defecto (en common)
    if (!matchedIntent) {
      matchedIntent = activeIntents.find(intent => intent.id === 'default');
    }

    // 3. Escoger una respuesta al azar dentro de la intención y reemplazar marcadores
    let defaultFallback = lang === 'en'
      ? 'My backup brain is ready. What do you need on the map?'
      : 'Mi cerebro de reserva está listo. Dime qué necesitas.';

    let responseText = defaultFallback;
    if (matchedIntent && matchedIntent.responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchedIntent.responses.length);
      responseText = matchedIntent.responses[randomIndex]
        .replace(/\[Modo Local\]\s*/g, '')
        .replace(/\[Modo Local activo\]\.\s*/g, '')
        .replace(/Servidor local activo\.\s*/g, '')
        .trim();

      // Reemplazar marcador dinámico {days}
      const daysLeft = this.getDaysUntilRelease();
      responseText = responseText.replace(/{days}/g, daysLeft.toString());
    }

    const isAngry = matchedIntent?.id === 'insulto';

    return of({
      id: 'msg-' + Date.now(),
      sender: 'goty' as const,
      text: responseText,
      timestamp: new Date(),
      isAngry
    });
  }
}

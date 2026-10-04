import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
 * Soporta dos modos operativos:
 *  1. Modo Online: Conecta con el backend (/api/goty/chat) comunicando con la IA (Gemini).
 *  2. Modo Local (Fallback): Si la IA o la red fallan, usa el motor JSON local correspondiente al idioma activo.
 */
@Injectable({
  providedIn: 'root'
})
export class GotyService {
  private isBotEnabled = true;

  // Caché de cerebros locales por idioma ('es', 'en', etc.)
  private loadedBrains: Record<string, GotyBrain> = {};

  // Diccionario de saludos iniciales multilingües por contexto de juego
  private readonly greetings: Record<string, Record<GotyGameMode, string>> = {
    es: {
      'gta5-historia': '¡Ey, crack! Soy GOTY 5, tu enlace en Los Santos. ¿En qué te echo un cable hoy?',
      'gta5-online': '¿Qué pasa, jefe? GOTY 5 al aparato. ¿En qué te echo un cable hoy?',
      'gta6-historia': '¡Bienvenidos a Vice City! Soy GOTY 6. ¿En qué te echo un cable hoy?',
      'gta6-online': '¡Bienvenidos a Vice City! Soy GOTY 6. ¿En qué te echo un cable hoy?'
    },
    en: {
      'gta5-historia': "Hey, boss! I'm GOTY 5, your Los Santos insider. What can I help you track down today?",
      'gta5-online': "What's up, chief? GOTY 5 on the line. What do you need on the map today?",
      'gta6-historia': "Welcome to Vice City! I'm GOTY 6. What can I help you find today?",
      'gta6-online': "Welcome to Vice City! I'm GOTY 6. What can I help you find today?"
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
    const langGreetings = this.greetings[currentLang] || this.greetings['es'];
    const text = langGreetings[context] || langGreetings['gta5-online'];

    return {
      id: 'msg-' + Date.now(),
      sender: 'goty',
      text,
      timestamp: new Date()
    };
  }

  /**
   * Procesa la consulta del usuario enviando el idioma actual al backend para que Gemini conteste en el idioma correcto.
   * Si la API falla, activa automáticamente el motor de coincidencia local en el idioma seleccionado.
   */
  processUserQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const currentLang = this.translationService.currentLanguage() || 'es';
    const payload = {
      Message: query,
      Context: context,
      Lang: currentLang
    };

    return this.http.post<{ text: string, isAngry: boolean }>('/api/goty/chat', payload).pipe(
      map(response => ({
        id: 'msg-' + Date.now(),
        sender: 'goty' as const,
        text: response.text.trim() + ' [Online]',
        timestamp: new Date(),
        isAngry: response.isAngry
      } as GotyMessage)),
      catchError(() => {
        // Fallback a motor local en el idioma activo
        return this.processLocalQuery(query, context, currentLang);
      })
    );
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
      sender: 'goty',
      text: responseText + ' [Local]',
      timestamp: new Date(),
      isAngry
    });
  }
}

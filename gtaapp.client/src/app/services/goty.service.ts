import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, catchError, map } from 'rxjs';
import { GotyMessage, GotyGameMode } from '../models/gta5/goty';
import { TranslationService } from '../i18n';

export interface GotyIntent {
  id: string;
  keywords: string[];
  responses: string[];
  isAngry?: boolean;
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

  // Caché de memoria modular en Markdown indexada por bot ('home', 'gta5', 'gta6')
  private memoryCache: Partial<Record<'home' | 'gta5' | 'gta6', GotyIntent[]>> = {};

  private readonly BRAIN_FILES: Record<'home' | 'gta5' | 'gta6', string[]> = {
    home: ['bienvenida.md'],
    gta5: [
      'general.md',
      'personalidad.md',
      'armas-vehiculos.md',
      'lugares-zonas.md',
      'misiones-golpes.md',
      'negocios.md',
      'misterios.md'
    ],
    gta6: [
      'general.md',
      'personalidad.md',
      'respuestas.md'
    ]
  };

  // Mensajes fijos por contexto de juego e idioma (Modo capado para producción)
  private readonly fixedMessages: Record<string, Partial<Record<GotyGameMode, string>>> = {
    es: {
      'home': '¡Bienvenido a GTA WORLD!',
      'gta5-historia': 'Hola, soy GOTY 5, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta5-online': 'Hola, soy GOTY 5, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta6-historia': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta6-online': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.'
    },
    en: {
      'home': 'Welcome to GTA WORLD!',
      'gta5-historia': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta5-online': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-historia': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-online': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience."
    },
    pt: {
      'home': 'Bem-vindo ao GTA WORLD!',
      'gta5-historia': 'Olá, sou o GOTY 5, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta5-online': 'Olá, sou o GOTY 5, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.',
      'gta6-historia': 'Olá, sou o GOTY 6, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta6-online': 'Olá, sou o GOTY 6, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.'
    },
    zh: {
      'home': '欢迎来到 GTA WORLD！',
      'gta5-historia': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta5-online': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-historia': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-online': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。'
    },
    fr: {
      'home': 'Bienvenue sur GTA WORLD !',
      'gta5-historia': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta5-online': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-historia': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-online': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée."
    },
    de: {
      'home': 'Willkommen bei GTA WORLD!',
      'gta5-historia': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta5-online': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-historia': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-online': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.'
    },
    it: {
      'home': 'Benvenuto su GTA WORLD!',
      'gta5-historia': 'Ciao, sono GOTY 5, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta5-online': 'Ciao, sono GOTY 5, stiamo ancora perfezionando algunos dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-historia': 'Ciao, sono GOTY 6, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-online': 'Ciao, sono GOTY 6, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.'
    },
    ru: {
      'home': 'Добро пожаловать в GTA WORLD!',
      'gta5-historia': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta5-online': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-historia': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-online': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.'
    },
    ar: {
      'home': 'مرحباً بك في GTA WORLD!',
      'gta5-historia': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta5-online': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-historia': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-online': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.'
    },
    ja: {
      'home': 'GTA WORLD へようこそ！',
      'gta5-historia': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta5-online': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-historia': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-online': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。'
    },
    hi: {
      'home': 'GTA WORLD में आपका स्वागत है!',
      'gta5-historia': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta5-online': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-historia': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-online': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।'
    },
    tr: {
      'home': "GTA WORLD'e hoş geldiniz!",
      'gta5-historia': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta5-online': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-historia': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-online': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.'
    },
    ko: {
      'home': 'GTA WORLD에 오신 것을 환영합니다!',
      'gta5-historia': '안녕하세요, 저는 GOTY 5입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta5-online': '안녕하세요, 저는 GOTY 5입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta6-historia': '안녕하세요, 저는 GOTY 6입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta6-online': '안녕하세요, 저는 GOTY 6입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.'
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
   * Parsea el contenido de un archivo Markdown a una lista de intenciones de GOTY.
   */
  private parseMarkdownToBrain(mdContent: string): GotyIntent[] {
    const intents: GotyIntent[] = [];
    const sections = mdContent.split(/^##\s+/m);
    for (const sec of sections) {
      const trimmed = sec.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const lines = trimmed.split('\n');
      const headerLine = lines[0].trim();
      const isAngry = headerLine.includes('[ANGRY]');
      const id = headerLine.replace(/\[ANGRY\]/g, '').trim().toLowerCase();

      let keywords: string[] = [];
      const responses: string[] = [];
      let readingResponses = false;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.toLowerCase().startsWith('**claves:**') || line.toLowerCase().startsWith('*claves:*')) {
          const rawKw = line.replace(/^\*{1,2}claves:\*{1,2}/i, '').trim();
          keywords = rawKw.split(',').map(k => k.trim()).filter(k => k.length > 0);
          readingResponses = false;
        } else if (line.toLowerCase().startsWith('**respuestas:**') || line.toLowerCase().startsWith('*respuestas:*')) {
          readingResponses = true;
        } else if (readingResponses && (line.startsWith('* ') || line.startsWith('- '))) {
          responses.push(line.substring(2).trim());
        }
      }

      if (id) {
        intents.push({ id, keywords, responses, isAngry });
      }
    }
    return intents;
  }

  /**
   * Carga y unifica todos los archivos .md de memoria de un bot concreto ('home', 'gta5', 'gta6').
   */
  loadGameBrain(game: 'home' | 'gta5' | 'gta6'): Observable<GotyIntent[]> {
    if (this.memoryCache[game]) {
      return of(this.memoryCache[game]!);
    }
    const files = this.BRAIN_FILES[game] || [];
    const requests = files.map(file =>
      this.http.get(`assets/data/goty/${game}/${file}`, { responseType: 'text' }).pipe(
        catchError(err => {
          console.warn(`[GotyService] Error cargando assets/data/goty/${game}/${file}:`, err);
          return of('');
        })
      )
    );

    return forkJoin(requests).pipe(
      map(contents => {
        const allIntents: GotyIntent[] = [];
        for (const text of contents) {
          if (text) {
            allIntents.push(...this.parseMarkdownToBrain(text));
          }
        }
        this.memoryCache[game] = allIntents;
        return allIntents;
      })
    );
  }

  /**
   * Pre-carga la memoria modular de GOTY según el contexto.
   */
  preloadBrain(context: GotyGameMode): void {
    const game: 'home' | 'gta5' | 'gta6' = context === 'home'
      ? 'home'
      : (context.startsWith('gta6') ? 'gta6' : 'gta5');
    this.loadGameBrain(game).subscribe();
  }

  /**
   * Devuelve el saludo inicial personalizado según el modo de juego y el idioma seleccionado en la app.
   */
  getInitialGreeting(context: GotyGameMode): GotyMessage {
    const currentLang = this.translationService.currentLanguage() || 'es';
    const langMessages = this.fixedMessages[currentLang] || this.fixedMessages['es'];
    let text: string = (langMessages[context] || langMessages['gta5-online']) || '';
    if (context === 'home') {
      text = text.replace(/GOTY\s*5/gi, 'GOTY');
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'goty',
      text,
      timestamp: new Date()
    };
  }

  get isDevelopment(): boolean {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return true;
      }
    }
    return isDevMode();
  }

  /**
   * Procesa la consulta del usuario.
   * En producción: devuelve el mensaje capado de ajuste (rebote) sin exponer el bot.
   * En desarrollo (localhost): permite probar la memoria modular completa (.md).
   */
  processUserQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const currentLang = this.translationService.currentLanguage() || 'es';

    // MODO PRODUCCIÓN: Bloqueo con respuesta fija de ajuste (rebote)
    if (!this.isDevelopment) {
      const langMessages = this.fixedMessages[currentLang] || this.fixedMessages['es'];
      let text: string = (langMessages[context] || langMessages['gta5-online']) || '';
      if (context === 'home') {
        text = text.replace(/GOTY\s*5/gi, 'GOTY');
      }
      return of({
        id: 'msg-' + Date.now(),
        sender: 'goty' as const,
        text,
        timestamp: new Date(),
        isAngry: false
      });
    }

    // MODO DESARROLLO (localhost): prueba real de la memoria local .md
    return this.processLocalQuery(query, context, currentLang);
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
   * Motor de búsqueda y respuestas local basado en la memoria modular de archivos Markdown (.md).
   */
  processLocalQuery(query: string, context: GotyGameMode, lang: string): Observable<GotyMessage> {
    const cleanQuery = this.normalizeString(query);
    const game: 'home' | 'gta5' | 'gta6' = context === 'home'
      ? 'home'
      : (context.startsWith('gta6') ? 'gta6' : 'gta5');

    return this.loadGameBrain(game).pipe(
      map(intents => {
        let bestIntent: GotyIntent | null = null;
        let bestScore = 0;

        for (const intent of intents) {
          if (intent.id === 'default') continue;
          let score = 0;
          for (const kw of intent.keywords) {
            const cleanKw = this.normalizeString(kw);
            if (!cleanKw) continue;
            if (cleanQuery.includes(cleanKw)) {
              const wordCount = cleanKw.split(/\s+/).length;
              score += wordCount * 2;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            bestIntent = intent;
          }
        }

        if (!bestIntent || bestScore === 0) {
          bestIntent = intents.find(i => i.id === 'default') || null;
        }

        let defaultFallback = lang === 'en'
          ? 'My backup brain is ready. What do you need on the map?'
          : 'Mi cerebro de reserva está listo. Dime qué necesitas.';

        let responseText = defaultFallback;
        let isAngry = false;

        if (bestIntent && bestIntent.responses.length > 0) {
          const randomIndex = Math.floor(Math.random() * bestIntent.responses.length);
          let rawText = bestIntent.responses[randomIndex];
          if (rawText.includes('[ANGRY]') || bestIntent.isAngry) {
            isAngry = true;
            rawText = rawText.replace(/\[ANGRY\]/g, '').trim();
          }
          const daysLeft = this.getDaysUntilRelease();
          responseText = rawText.replace(/{days}/g, daysLeft.toString());
        }

        return {
          id: 'msg-' + Date.now(),
          sender: 'goty' as const,
          text: responseText,
          timestamp: new Date(),
          isAngry
        };
      })
    );
  }
}

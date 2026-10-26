import { Injectable, isDevMode, inject } from '@angular/core';
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

  // Caché de memoria modular en Markdown indexada por modo exacto
  private memoryCache: Partial<Record<GotyGameMode, GotyIntent[]>> = {};

  private readonly BRAIN_PATHS: Record<GotyGameMode, string> = {
    'home': 'home',
    'gta5-historia': 'gta5/historia',
    'gta5-online': 'gta5/online',
    'gta6-historia': 'gta6/historia',
    'gta6-online': 'gta6/online'
  };

  private readonly BRAIN_FILES: Record<GotyGameMode, string[]> = {
    'home': ['bienvenida.md'],
    'gta5-historia': ['personalidad.md'],
    'gta5-online': ['personalidad.md'],
    'gta6-historia': [],
    'gta6-online': []
  };

  // Mensajes fijos por contexto de juego e idioma (Modo capado para producción)
  private readonly fixedMessages: Record<string, Partial<Record<GotyGameMode, string>>> = {
    es: {
      'home': '¡Bienvenido a **GTA EXPLORER**!\n• **Mapas en alta definición:** con todas las ubicaciones.\n• **Asistente con IA:** apoyo táctico de GOTY 5 y GOTY 6 en tiempo real.\n• **Multi-idioma:** disponible en 13 idiomas.',
      'gta5-historia': '¡Qué pasa, colega! Soy GOTY. ¿En qué te echo una mano hoy por las calles?',
      'gta5-online': '¡Qué pasa, colega! Soy GOTY. ¿En qué te echo una mano hoy por las calles?',
      'gta6-historia': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.',
      'gta6-online': 'Hola, soy GOTY 6, aún me están ajustando algunos detalles. Disculpa las molestias.'
    },
    en: {
      'home': 'Welcome to **GTA EXPLORER**!\n• **High-definition maps:** with all locations.\n• **AI Assistant:** real-time tactical support from GOTY 5 & GOTY 6.\n• **Multi-language:** available in 13 languages.',
      'gta5-historia': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta5-online': "Hello, I'm GOTY 5, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-historia': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience.",
      'gta6-online': "Hello, I'm GOTY 6, I'm still being adjusted. Sorry for the inconvenience."
    },
    pt: {
      'home': 'Bem-vindo ao **GTA EXPLORER**!\n• **Mapas em alta definição:** com todas as localizações.\n• **Assistente com IA:** apoio tático do GOTY 5 e GOTY 6 em tempo real.\n• **Multi-idioma:** disponível em 13 idiomas.',
      'gta5-historia': 'Olá, sou o GOTY 5, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta5-online': 'Olá, sou o GOTY 5, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.',
      'gta6-historia': 'Olá, sou o GOTY 6, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.',
      'gta6-online': 'Olá, sou o GOTY 6, ainda estão ajustando algunos detalhes em mim. Desculpe o transtorno.'
    },
    zh: {
      'home': '欢迎来到 **GTA EXPLORER**！\n• **高清地图：** 包含所有位置点与标记。\n• **AI 助手：** GOTY 5 与 GOTY 6 实时战术协助。\n• **多语言：** 支持 13 种语言。',
      'gta5-historia': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta5-online': '你好，我是 GOTY 5，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-historia': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。',
      'gta6-online': '你好，我是 GOTY 6，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。'
    },
    fr: {
      'home': 'Bienvenue sur **GTA EXPLORER** !\n• **Cartes haute définition :** avec tous les emplacements.\n• **Assistant IA :** soutien tactique en temps réel de GOTY 5 et GOTY 6.\n• **Multilingue :** disponible en 13 langues.',
      'gta5-historia': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta5-online': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-historia': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-online': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée."
    },
    de: {
      'home': 'Willkommen bei **GTA EXPLORER**!\n• **HD-Karten:** mit allen Standorten und Markierungen.\n• **KI-Assistent:** taktische Echtzeit-Unterstützung von GOTY 5 und GOTY 6.\n• **Mehrsprachig:** verfügbar in 13 Sprachen.',
      'gta5-historia': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta5-online': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-historia': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-online': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.'
    },
    it: {
      'home': 'Benvenuto su **GTA EXPLORER**!\n• **Mappe in alta definizione:** con tutte le posizioni.\n• **Assistente con IA:** supporto tattico di GOTY 5 e GOTY 6 in tempo reale.\n• **Multilingua:** disponibile in 13 lingue.',
      'gta5-historia': 'Ciao, sono GOTY 5, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta5-online': 'Ciao, sono GOTY 5, stiamo ancora perfezionando algunos dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-historia': 'Ciao, sono GOTY 6, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-online': 'Ciao, sono GOTY 6, stiamo ancora perfezionando algunos dettagli. Ci scusiamo per l\'inconveniente.'
    },
    ru: {
      'home': 'Добро пожаловать в **GTA EXPLORER**!\n• **Карты высокой четкости:** со всеми локациями и точками.\n• **ИИ-ассистент:** тактическая поддержка от GOTY 5 и GOTY 6 в реальном времени.\n• **Многоязычность:** доступно на 13 языках.',
      'gta5-historia': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta5-online': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-historia': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-online': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.'
    },
    ar: {
      'home': 'مرحباً بك في **GTA EXPLORER**!\n• **خرائط عالية الدقة:** تشمل جميع المواقع.\n• **مساعد ذكاء اصطناعي:** دعم تكتيكي في الوقت الفعلي من GOTY 5 و GOTY 6.\n• **متعدد اللغات:** متاح بـ 13 لغة.',
      'gta5-historia': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta5-online': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-historia': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-online': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.'
    },
    ja: {
      'home': '**GTA EXPLORER** へようこそ！\n• **高解像度マップ：** 全てのロケーションとポイントを網羅。\n• **AI アシスタント：** GOTY 5 と GOTY 6 によるリアルタイム戦術サポート。\n• **多言語対応：** 13言語に対応。',
      'gta5-historia': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta5-online': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-historia': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-online': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。'
    },
    hi: {
      'home': '**GTA EXPLORER** में आपका स्वागत है!\n• **हाई-डेफिनिशन मैप्स:** सभी स्थानों और चिह्नों के साथ।\n• **AI सहायक:** GOTY 5 और GOTY 6 से रीयल-टाइम सामरिक सहायता।\n• **बहुभाषी:** 13 भाषाओं में उपलब्ध।',
      'gta5-historia': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta5-online': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-historia': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-online': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।'
    },
    tr: {
      'home': "**GTA EXPLORER**'e hoş geldiniz!\n• **Yüksek çözünürlüklü haritalar:** tüm konumlar ile birlikte.\n• **Yapay Zekâ Asistanı:** GOTY 5 ve GOTY 6'dan gerçek zamanlı taktik destek.\n• **Çoklu dil:** 13 dilde kullanılabilir.",
      'gta5-historia': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta5-online': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-historia': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-online': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.'
    },
    ko: {
      'home': '**GTA EXPLORER**에 오신 것을 환영합니다!\n• **고해상도 지도:** 모든 위치 및 마커 포함.\n• **AI 어시스턴트:** GOTY 5 및 GOTY 6의 실시간 전술 지원.\n• **다국어 지원:** 13개 언어 지원.',
      'gta5-historia': '안녕하세요, 저는 GOTY 5입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta5-online': '안녕하세요, 저는 GOTY 5입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta6-historia': '안녕하세요, 저는 GOTY 6입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.',
      'gta6-online': '안녕하세요, 저는 GOTY 6입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.'
    }
  };

  private readonly http = inject(HttpClient);
  private readonly translationService = inject(TranslationService);

  constructor() {
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
        } else if (readingResponses && responses.length > 0 && !line.startsWith('#')) {
          responses[responses.length - 1] += '\n' + line;
        }
      }

      if (id) {
        intents.push({ id, keywords, responses, isAngry });
      }
    }
    return intents;
  }

  /**
   * Carga y unifica todos los archivos .md de memoria de un contexto de juego concreto.
   */
  loadGameBrain(mode: GotyGameMode): Observable<GotyIntent[]> {
    if (this.memoryCache[mode]) {
      return of(this.memoryCache[mode]!);
    }
    const folderPath = this.BRAIN_PATHS[mode];
    const files = this.BRAIN_FILES[mode] || [];
    if (files.length === 0) {
      this.memoryCache[mode] = [];
      return of([]);
    }
    const requests = files.map(file =>
      this.http.get(`assets/data/goty/${folderPath}/${file}`, { responseType: 'text' }).pipe(
        catchError(err => {
          console.warn(`[GotyService] Error cargando assets/data/goty/${folderPath}/${file}:`, err);
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
        this.memoryCache[mode] = allIntents;
        return allIntents;
      })
    );
  }

  /**
   * Pre-carga la memoria modular de GOTY según el contexto.
   */
  preloadBrain(context: GotyGameMode): void {
    this.loadGameBrain(context).subscribe();
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
    // Modo de pruebas activo: responder directamente con la memoria local (.md)
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

    return this.loadGameBrain(context).pipe(
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

        const defaultFallback = lang === 'en'
          ? 'My backup brain is ready. What do you need on the map?'
          : 'Mi cerebro de reserva está listo. Dime qué necesitas.';

        let responseText = defaultFallback;
        let isAngry = false;

        if (bestIntent && bestIntent.responses.length > 0) {
          const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % bestIntent.responses.length;
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

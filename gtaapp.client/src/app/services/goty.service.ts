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
    },
    fr: {
      'gta5-historia': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta5-online': "Bonjour, je suis GOTY 5, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-historia': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
      'gta6-online': "Bonjour, je suis GOTY 6, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée."
    },
    de: {
      'gta5-historia': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta5-online': 'Hallo, ich bin GOTY 5, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-historia': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.',
      'gta6-online': 'Hallo, ich bin GOTY 6, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.'
    },
    it: {
      'gta5-historia': 'Ciao, sono GOTY 5, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta5-online': 'Ciao, sono GOTY 5, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-historia': 'Ciao, sono GOTY 6, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.',
      'gta6-online': 'Ciao, sono GOTY 6, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l\'inconveniente.'
    },
    ru: {
      'gta5-historia': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta5-online': 'Привет, я GOTY 5, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-historia': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.',
      'gta6-online': 'Привет, я GOTY 6, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.'
    },
    ar: {
      'gta5-historia': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta5-online': 'مرحبًا، أنا GOTY 5، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-historia': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.',
      'gta6-online': 'مرحبًا، أنا GOTY 6، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.'
    },
    ja: {
      'gta5-historia': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta5-online': 'こんにちは、GOTY 5です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-historia': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。',
      'gta6-online': 'こんにちは、GOTY 6です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。'
    },
    hi: {
      'gta5-historia': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta5-online': 'नमस्ते, मैं GOTY 5 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-historia': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।',
      'gta6-online': 'नमस्ते, मैं GOTY 6 हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।'
    },
    tr: {
      'gta5-historia': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta5-online': 'Merhaba, ben GOTY 5, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-historia': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.',
      'gta6-online': 'Merhaba, ben GOTY 6, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.'
    },
    ko: {
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

    // Precargar cerebros de reserva en los idiomas disponibles
    this.preloadBrain('es');
    this.preloadBrain('en');
    this.preloadBrain('pt');
    this.preloadBrain('zh');
    this.preloadBrain('fr');
    this.preloadBrain('de');
    this.preloadBrain('it');
    this.preloadBrain('ru');
    this.preloadBrain('ar');
    this.preloadBrain('ja');
    this.preloadBrain('hi');
    this.preloadBrain('tr');
    this.preloadBrain('ko');
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

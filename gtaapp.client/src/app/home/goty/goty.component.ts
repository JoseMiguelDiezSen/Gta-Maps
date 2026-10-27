import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, effect, inject } from '@angular/core';
import { GotyService } from '../../services/goty.service';
import { TranslationService } from '../../i18n';
import { GotyMessage } from '../../models/gta5/goty';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-goty',
  templateUrl: './goty.component.html',
  styleUrls: ['./goty.component.css'],
  standalone: false
})
export class GotyComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: GotyMessage[] = [];

  // Drag state (Desktop default)
  wrapperTop = 135;
  wrapperLeft = 18;
  isDragging = false;
  hasDragged = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialTop = 0;
  private initialLeft = 0;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private replySub?: Subscription;

  private static readonly SUBTITLES: Record<string, string> = {
    es: 'Asistente de GTA Explorer',
    en: 'GTA Explorer Assistant',
    pt: 'Assistente do GTA Explorer',
    zh: 'GTA Explorer 官方向导',
    fr: 'Assistant GTA Explorer',
    de: 'GTA Explorer Assistent',
    it: 'Assistente GTA Explorer',
    ru: 'Ассистент GTA Explorer',
    ar: 'مساعد GTA Explorer',
    ja: 'GTA Explorer アシスタント',
    hi: 'GTA Explorer सहायक',
    tr: 'GTA Explorer Asistanı',
    ko: 'GTA Explorer 어시스턴트'
  };

  private static readonly UI_STRINGS: Record<string, { placeholder: (b: string) => string; talk: (b: string) => string; send: string; close: string }> = {
    es: { placeholder: (b) => `Pregunta a ${b}...`, talk: (b) => `Hablar con ${b}`, send: 'Enviar mensaje', close: 'Cerrar chat' },
    en: { placeholder: (b) => `Ask ${b}...`, talk: (b) => `Talk to ${b}`, send: 'Send message', close: 'Close chat' },
    pt: { placeholder: (b) => `Pergunte ao ${b}...`, talk: (b) => `Conversar com ${b}`, send: 'Enviar mensagem', close: 'Fechar chat' },
    zh: { placeholder: (b) => `向 ${b} 提问...`, talk: (b) => `与 ${b} 交谈`, send: '发送消息', close: '关闭聊天' },
    fr: { placeholder: (b) => `Demander à ${b}...`, talk: (b) => `Parler avec ${b}`, send: 'Envoyer le message', close: 'Fermer le chat' },
    de: { placeholder: (b) => `Frage an ${b}...`, talk: (b) => `Mit ${b} sprechen`, send: 'Nachricht senden', close: 'Chat schließen' },
    it: { placeholder: (b) => `Chiedi a ${b}...`, talk: (b) => `Parla con ${b}`, send: 'Invia messaggio', close: 'Chiudi chat' },
    ru: { placeholder: (b) => `Спросить у ${b}...`, talk: (b) => `Поговорить с ${b}`, send: 'Отправить сообщение', close: 'Закрыть чат' },
    ar: { placeholder: (b) => `اسأل ${b}...`, talk: (b) => `التحدث مع ${b}`, send: 'إرسال الرسالة', close: 'إغلاق الدردشة' },
    ja: { placeholder: (b) => `${b} に質問...`, talk: (b) => `${b} と話す`, send: 'メッセージを送信', close: 'チャットを閉じる' },
    hi: { placeholder: (b) => `${b} से पूछें...`, talk: (b) => `${b} से बात करें`, send: 'संदेश भेजें', close: 'चैट बंद करें' },
    tr: { placeholder: (b) => `${b}'e sor...`, talk: (b) => `${b} ile konuş`, send: 'Mesaj gönder', close: 'Sohbeti kapat' },
    ko: { placeholder: (b) => `${b}에게 질문...`, talk: (b) => `${b}와 대화하기`, send: '메시지 전송', close: '채팅 닫기' }
  };

  public readonly gotyService = inject(GotyService);
  private readonly translationService = inject(TranslationService);

  constructor() {
    effect(() => {
      this.translationService.currentLanguage();
      this.loadWelcomeMessage();
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    if (this.replySub) {
      this.replySub.unsubscribe();
    }
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    if ('button' in event && (event as MouseEvent).button !== 0) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;

    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.initialTop = this.wrapperTop;
    this.initialLeft = this.wrapperLeft;
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;

    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      this.hasDragged = true;
    }

    const maxLeft = Math.max(10, window.innerWidth - 80);
    const maxTop = Math.max(10, window.innerHeight - 80);

    this.wrapperLeft = Math.max(10, Math.min(maxLeft, this.initialLeft + deltaX));
    this.wrapperTop = Math.max(10, Math.min(maxTop, this.initialTop + deltaY));
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onDragEnd(): void {
    this.isDragging = false;
  }

  onAvatarClick(event: MouseEvent): void {
    if (this.hasDragged) {
      event.preventDefault();
      event.stopPropagation();
      this.hasDragged = false;
      return;
    }
    this.toggleChat();
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 850) {
      this.wrapperTop = 105;
      this.wrapperLeft = 10;
    }
    this.loadWelcomeMessage();
  }

  loadWelcomeMessage(): void {
    const currentLang = this.gotyService.currentLang;
    if (currentLang === 'es') {
      this.gotyService.loadGameBrain('home').subscribe(intents => {
        const welcome = intents.find(i => i.id === 'bienvenida') || intents[0];
        const text = (welcome && welcome.responses.length > 0)
          ? welcome.responses[0]
          : this.gotyService.getInitialGreeting('home').text;

        this.messages = [{
          id: 'msg-' + Date.now(),
          sender: 'goty',
          text,
          timestamp: new Date()
        }];
      });
    } else {
      this.messages = [this.gotyService.getInitialGreeting('home')];
    }
  }

  get avatarSrc(): string {
    return '/assets/images/goty/goty.webp';
  }

  get botName(): string {
    return 'GOTY';
  }

  get botSubtitle(): string {
    const lang = this.gotyService.currentLang;
    return GotyComponent.SUBTITLES[lang] || GotyComponent.SUBTITLES['en'] || GotyComponent.SUBTITLES['es'];
  }

  get inputPlaceholder(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyComponent.UI_STRINGS[lang] || GotyComponent.UI_STRINGS['en'] || GotyComponent.UI_STRINGS['es'];
    return ui.placeholder(this.botName);
  }

  get talkTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyComponent.UI_STRINGS[lang] || GotyComponent.UI_STRINGS['en'] || GotyComponent.UI_STRINGS['es'];
    return ui.talk(this.botName);
  }

  get sendTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyComponent.UI_STRINGS[lang] || GotyComponent.UI_STRINGS['en'] || GotyComponent.UI_STRINGS['es'];
    return ui.send;
  }

  get closeTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyComponent.UI_STRINGS[lang] || GotyComponent.UI_STRINGS['en'] || GotyComponent.UI_STRINGS['es'];
    return ui.close;
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.loadWelcomeMessage();
    }
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(text?: string): void {
    const q = (text || this.userInput).trim();
    if (!q) return;

    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date()
    });

    this.userInput = '';
    this.isTyping = true;

    const tScroll = setTimeout(() => this.scrollToBottom(), 50);
    this.timers.push(tScroll);

    const tReply = setTimeout(() => {
      this.replySub = this.gotyService.processUserQuery(q, 'home').subscribe((reply: GotyMessage) => {
        this.isTyping = false;
        this.messages.push(reply);
        const tScroll2 = setTimeout(() => this.scrollToBottom(), 50);
        this.timers.push(tScroll2);
      });
    }, 400);
    this.timers.push(tReply);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch {
        // Ignorar error de scroll
      }
    }
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    const root = document.createElement('div');
    const lines = text.split('\n');
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        root.appendChild(document.createElement('br'));
      }
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          root.appendChild(document.createTextNode(line.slice(lastIndex, match.index)));
        }
        const strong = document.createElement('strong');
        strong.textContent = match[1];
        root.appendChild(strong);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        root.appendChild(document.createTextNode(line.slice(lastIndex)));
      }
    });
    return Array.from(root.childNodes).map(node => new XMLSerializer().serializeToString(node)).join('');
  }
}

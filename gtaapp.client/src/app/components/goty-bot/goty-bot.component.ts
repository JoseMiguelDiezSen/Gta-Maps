import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener, effect } from '@angular/core';
import { GotyService } from '../../services/goty.service';
import { TranslationService } from '../../i18n';
import { GotyMessage, GotyGameMode } from '../../models/gta5/goty';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-goty-bot',
  templateUrl: './goty-bot.component.html',
  styleUrls: ['./goty-bot.component.css'],
  standalone: false
})
export class GotyBotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() gameContext: GotyGameMode = 'gta5-online';

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  isAngryAvatar = false;
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

  private timers: any[] = [];
  private replySub?: Subscription;

  private static readonly SUBTITLES: Record<string, { gta5: string; gta6: string }> = {
    es: { gta5: 'Asistente de Los Santos', gta6: 'Asistente de Vice City' },
    en: { gta5: 'Los Santos Assistant', gta6: 'Vice City Assistant' },
    pt: { gta5: 'Assistente de Los Santos', gta6: 'Assistente de Vice City' },
    zh: { gta5: '洛圣都智能向导', gta6: '罪恶都市智能向导' },
    fr: { gta5: 'Assistant de Los Santos', gta6: 'Assistant de Vice City' },
    de: { gta5: 'Los Santos Assistent', gta6: 'Vice City Assistent' },
    it: { gta5: 'Assistente di Los Santos', gta6: 'Assistente di Vice City' },
    ru: { gta5: 'Ассистент Лос-Сантоса', gta6: 'Ассистент Вайс-Сити' },
    ar: { gta5: 'مساعد لوس سانتوس', gta6: 'مساعد فايس سيتي' },
    ja: { gta5: 'ロスサントス・アシスタント', gta6: 'バイスシティ・アシスタント' },
    hi: { gta5: 'लॉस सैंटोस सहायक', gta6: 'वाइस सिटी सहायक' },
    tr: { gta5: 'Los Santos Asistanı', gta6: 'Vice City Asistanı' },
    ko: { gta5: '로스 산토스 어시스턴트', gta6: '바이스 시티 어시스턴트' }
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

  constructor(
    public gotyService: GotyService,
    private translationService: TranslationService
  ) {
    effect(() => {
      // Reacciona en tiempo real si el usuario cambia el idioma en la aplicación
      this.translationService.currentLanguage();
      if (this.messages.length <= 1 && (this.messages.length === 0 || this.messages[0].sender === 'goty')) {
        this.messages = [this.gotyService.getInitialGreeting(this.gameContext)];
      }
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
    this.messages = [this.gotyService.getInitialGreeting(this.gameContext)];
  }

  ngAfterViewChecked(): void {
    // Scroll removed from here to prevent forcing scroll down constantly.
  }

  get avatarSrc(): string {
    if (this.gameContext.startsWith('gta6')) {
      return '/assets/images/goty_gta6.png';
    } else {
      return this.isAngryAvatar ? '/assets/images/goty_gta5_angry.png' : '/assets/images/goty_gta5.png';
    }
  }

  get botName(): string {
    return this.gameContext.startsWith('gta6') ? 'GOTY 6' : 'GOTY 5';
  }

  get isGta6(): boolean {
    return this.gameContext.startsWith('gta6');
  }

  get botSubtitle(): string {
    const lang = this.gotyService.currentLang;
    const sub = GotyBotComponent.SUBTITLES[lang] || GotyBotComponent.SUBTITLES['en'] || GotyBotComponent.SUBTITLES['es'];
    return this.isGta6 ? sub.gta6 : sub.gta5;
  }

  get inputPlaceholder(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyBotComponent.UI_STRINGS[lang] || GotyBotComponent.UI_STRINGS['en'] || GotyBotComponent.UI_STRINGS['es'];
    return ui.placeholder(this.botName);
  }

  get talkTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyBotComponent.UI_STRINGS[lang] || GotyBotComponent.UI_STRINGS['en'] || GotyBotComponent.UI_STRINGS['es'];
    return ui.talk(this.botName);
  }

  get sendTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyBotComponent.UI_STRINGS[lang] || GotyBotComponent.UI_STRINGS['en'] || GotyBotComponent.UI_STRINGS['es'];
    return ui.send;
  }

  get closeTooltip(): string {
    const lang = this.gotyService.currentLang;
    const ui = GotyBotComponent.UI_STRINGS[lang] || GotyBotComponent.UI_STRINGS['en'] || GotyBotComponent.UI_STRINGS['es'];
    return ui.close;
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages = [this.gotyService.getInitialGreeting(this.gameContext)];
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

    // Add user message
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date()
    });
    this.userInput = '';
    this.isTyping = true;
    const tScroll1 = setTimeout(() => this.scrollToBottom(), 50);
    this.timers.push(tScroll1);

    // Process reply
    const tReply = setTimeout(() => {
      this.replySub = this.gotyService.processUserQuery(q, this.gameContext).subscribe(reply => {
        this.isTyping = false;
        if (reply.isAngry) {
          this.isAngryAvatar = true;
          const tAngry = setTimeout(() => {
            this.isAngryAvatar = false;
          }, 3000);
          this.timers.push(tAngry);
        } else {
          this.isAngryAvatar = false;
        }
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
      } catch (err) {}
    }
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    // Escapar caracteres HTML básicos primero para evitar inyección XSS
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Reemplazar markdown en negrita **texto** por <strong>texto</strong>
    const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Reemplazar saltos de línea por <br>
    return withBold.replace(/\n/g, '<br>');
  }
}

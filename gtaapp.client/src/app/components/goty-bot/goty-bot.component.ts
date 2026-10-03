import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { GotyService } from '../../services/goty.service';
import { GotyMessage, GotyGameMode } from '../../models/goty';

@Component({
  selector: 'app-goty-bot',
  templateUrl: './goty-bot.component.html',
  styleUrls: ['./goty-bot.component.css'],
  standalone: false
})
export class GotyBotComponent implements OnInit, AfterViewChecked {
  @Input() gameContext: GotyGameMode = 'gta5-online';

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  isAngryAvatar = false;
  messages: GotyMessage[] = [];

  // Drag state
  wrapperTop = 120;
  wrapperLeft = 20;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialTop = 0;
  private initialLeft = 0;

  constructor(public gotyService: GotyService) {}

  onDragStart(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialTop = this.wrapperTop;
    this.initialLeft = this.wrapperLeft;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.wrapperLeft = this.initialLeft + (event.clientX - this.dragStartX);
    this.wrapperTop = this.initialTop + (event.clientY - this.dragStartY);
  }

  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.isDragging = false;
  }

  ngOnInit(): void {
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
    setTimeout(() => this.scrollToBottom(), 50);

    // Process reply
    setTimeout(() => {
      this.gotyService.processUserQuery(q, this.gameContext).subscribe(reply => {
        this.isTyping = false;
        if (reply.isAngry) {
          this.isAngryAvatar = true;
          setTimeout(() => {
            this.isAngryAvatar = false;
          }, 3000);
        } else {
          this.isAngryAvatar = false;
        }
        this.messages.push(reply);
        setTimeout(() => this.scrollToBottom(), 50);
      });
    }, 400);
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
}

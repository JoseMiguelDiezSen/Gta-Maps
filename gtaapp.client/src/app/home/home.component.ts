import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { APP_VERSION } from '../../environments/version';
import { TranslationService } from '../i18n';
import { UsuariosActivosService } from '../services/usuarios-activos.service';
import { CookieService } from '../services/cookie.service';

import { isDevAccessAllowed } from '../services/dev-access.guard';
import { LanguageCode } from '../i18n';

export interface Language {
    code: LanguageCode;
    label: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
    isOpen = false;
    selectedCode: LanguageCode = 'en';

    // Interruptor de acceso a funciones en desarrollo (GTA 6 y guías)
    readonly isDevAllowed = isDevAccessAllowed();

    // Feedback Modal State
    isFeedbackModalOpen = false;
    feedbackName = '';
    feedbackMessage = '';
    isSendingFeedback = false;
    feedbackSuccess = false;
    feedbackError = false;

    readonly ultimaActualizacion = APP_VERSION.timestamp;
    readonly buildCommit = APP_VERSION.commit;

    // Cuenta atrás lanzamiento GTA VI: 19 de noviembre (mes 10 = noviembre)
    readonly countdownTarget = new Date(2026, 10, 19, 0, 0, 0);
    countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' };
    private countdownInterval: ReturnType<typeof setInterval> | undefined;

    readonly languages: Language[] = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'pt', label: 'Português' },
        { code: 'zh', label: '简体中文' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'it', label: 'Italiano' },
        { code: 'ru', label: 'Русский' },
        { code: 'ar', label: 'العربية' },
        { code: 'ja', label: '日本語' },
        { code: 'hi', label: 'हिन्दी' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'ko', label: '한국어' }
    ];

    constructor(
        private readonly elementRef: ElementRef,
        private readonly translationService: TranslationService,
        public readonly usuariosActivosService: UsuariosActivosService,
        public readonly cookieService: CookieService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly http: HttpClient
    ) {
        this.selectedCode = this.translationService.currentLang;
    }

    ngOnInit(): void {
        this.selectedCode = this.translationService.currentLang;
        this.startCountdown();

        this.lockMobileZoom();
    }

    ngOnDestroy(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.unlockMobileZoom();
    }

    private originalViewportContent: string | null = null;
    private preventTouchHandler?: (e: TouchEvent) => void;
    private preventGestureHandler?: (e: Event) => void;
    private handleDoubleTapHandler?: (e: TouchEvent) => void;
    private lastTouchEnd = 0;

    private lockMobileZoom(): void {
        if (typeof document === 'undefined') return;

        // 1. Bloqueo en etiqueta meta viewport
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            this.originalViewportContent = viewportMeta.getAttribute('content');
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }

        // 2. Prevenir pellizco nativo en Safari iOS (gesturestart)
        this.preventGestureHandler = (e: Event): void => {
            e.preventDefault();
        };
        document.addEventListener('gesturestart', this.preventGestureHandler, { passive: false });

        // 3. Prevenir multitouch (pellizco)
        this.preventTouchHandler = (e: TouchEvent): void => {
            if (e.touches && e.touches.length > 1) {
                e.preventDefault();
            }
        };
        document.addEventListener('touchstart', this.preventTouchHandler, { passive: false });

        // 4. Prevenir zoom por doble pulsación rápida
        this.handleDoubleTapHandler = (e: TouchEvent): void => {
            const now = Date.now();
            if (now - this.lastTouchEnd <= 300) {
                e.preventDefault();
            }
            this.lastTouchEnd = now;
        };
        document.addEventListener('touchend', this.handleDoubleTapHandler, { passive: false });
    }

    private unlockMobileZoom(): void {
        if (typeof document === 'undefined') return;

        if (this.originalViewportContent) {
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                viewportMeta.setAttribute('content', this.originalViewportContent);
            }
        }

        if (this.preventGestureHandler) {
            document.removeEventListener('gesturestart', this.preventGestureHandler);
        }
        if (this.preventTouchHandler) {
            document.removeEventListener('touchstart', this.preventTouchHandler);
        }
        if (this.handleDoubleTapHandler) {
            document.removeEventListener('touchend', this.handleDoubleTapHandler);
        }
    }

    private startCountdown(): void {
        const pad = (n: number): string => String(n).padStart(2, '0');

        const tick = (): void => {
            const restante = Math.max(0, Math.floor((this.countdownTarget.getTime() - Date.now()) / 1000));
            this.countdown = {
                days: pad(Math.floor(restante / 86400)),
                hours: pad(Math.floor((restante % 86400) / 3600)),
                minutes: pad(Math.floor((restante % 3600) / 60)),
                seconds: pad(restante % 60)
            };
        };

        tick();
        this.countdownInterval = setInterval(tick, 1000);
    }

    get currentLanguage(): Language {
        const code = this.translationService.currentLang;
        return this.languages.find(l => l.code === code) || this.languages[0];
    }

    toggleDropdown(event: Event): void {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    selectLanguage(code: LanguageCode, event: Event): void {
        event.stopPropagation();
        this.selectedCode = code;
        this.isOpen = false;
        this.translationService.setLanguage(code);
    }

    goToGta6(event?: Event): void {
        if (event) {
            event.preventDefault();
        }
        if (!this.isDevAllowed) {
            return;
        }
        this.router.navigate(['/gta6-online']);
    }

    goToGta5Guia(event?: Event): void {
        if (event) {
            event.preventDefault();
        }
        if (!this.isDevAllowed) {
            return;
        }
        this.router.navigate(['/gta5-guia']);
    }

    goToGta6Guia(event?: Event): void {
        if (event) {
            event.preventDefault();
        }
        if (!this.isDevAllowed) {
            return;
        }
        this.router.navigate(['/gta6-guia']);
    }

    toggleFeedbackPanel(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.isFeedbackModalOpen = !this.isFeedbackModalOpen;
        this.feedbackError = false;
    }

    closeFeedbackModal(): void {
        this.isFeedbackModalOpen = false;
    }

    sendFeedback(): void {
        if (!this.feedbackMessage.trim() || this.isSendingFeedback) {
            return;
        }

        this.isSendingFeedback = true;
        this.feedbackError = false;
        this.feedbackSuccess = false;

        const payload = {
            name: this.feedbackName.trim(),
            message: this.feedbackMessage.trim()
        };

        this.http.post('/api/feedback', payload).subscribe({
            next: () => {
                this.isSendingFeedback = false;
                this.feedbackSuccess = true;
                this.feedbackName = '';
                this.feedbackMessage = '';
                setTimeout(() => {
                    if (this.feedbackSuccess) {
                        this.isFeedbackModalOpen = false;
                        this.feedbackSuccess = false;
                    }
                }, 2500);
            },
            error: () => {
                this.isSendingFeedback = false;
                this.feedbackError = true;
            }
        });
    }

    resetFeedbackForm(): void {
        this.feedbackError = false;
        this.feedbackName = '';
        this.feedbackMessage = '';
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.isOpen = false;
        if (this.isFeedbackModalOpen) {
            this.closeFeedbackModal();
        }
    }
}
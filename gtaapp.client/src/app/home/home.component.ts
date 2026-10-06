import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { APP_VERSION } from '../../environments/version';
import { TranslationService } from '../i18n';
import { UsuariosActivosService } from '../services/usuarios-activos.service';
import { CookieService } from '../services/cookie.service';

export interface Language {
    code: 'en' | 'es' | 'pt';
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
    selectedCode: 'en' | 'es' | 'pt' = 'en';

    readonly ultimaActualizacion = APP_VERSION.timestamp;
    readonly buildCommit = APP_VERSION.commit;

    // Cuenta atrás lanzamiento GTA VI: 19 de noviembre (mes 10 = noviembre)
    readonly countdownTarget = new Date(2026, 10, 19, 0, 0, 0);
    countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' };
    private countdownInterval: ReturnType<typeof setInterval> | undefined;

    readonly languages: Language[] = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'pt', label: 'Português' }
    ];

    constructor(
        private readonly elementRef: ElementRef,
        private readonly translationService: TranslationService,
        public readonly usuariosActivosService: UsuariosActivosService,
        public readonly cookieService: CookieService
    ) {}

    ngOnInit(): void {
        const current = this.translationService.currentLanguage();
        if (current === 'es' || current === 'en' || current === 'pt') {
            this.selectedCode = current;
        }
        this.startCountdown();
    }

    ngOnDestroy(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
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
        return this.languages.find(l => l.code === this.selectedCode) || this.languages[0];
    }

    toggleDropdown(event: Event): void {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    selectLanguage(code: 'en' | 'es' | 'pt', event: Event): void {
        event.stopPropagation();
        this.selectedCode = code;
        this.isOpen = false;
        this.translationService.setLanguage(code);
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
    }
}
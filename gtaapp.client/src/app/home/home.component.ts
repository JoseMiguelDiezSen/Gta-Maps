import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { APP_VERSION } from '../../environments/version';
import { TranslationService } from '../i18n';
import { UsuariosActivosService } from '../services/usuarios-activos.service';

export interface Language {
    code: 'es' | 'en';
    label: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit {
    isOpen = false;
    selectedCode: 'es' | 'en' = 'es';

    readonly ultimaActualizacion = APP_VERSION.timestamp;
    readonly buildCommit = APP_VERSION.commit;

    readonly languages: Language[] = [
        { code: 'es', label: 'Español' },
        { code: 'en', label: 'English' }
    ];

    constructor(
        private readonly elementRef: ElementRef,
        private readonly translationService: TranslationService,
        public readonly usuariosActivosService: UsuariosActivosService
    ) {}

    ngOnInit(): void {
        const current = this.translationService.currentLanguage();
        if (current === 'es' || current === 'en') {
            this.selectedCode = current;
        }
    }

    get currentLanguage(): Language {
        return this.languages.find(l => l.code === this.selectedCode) || this.languages[0];
    }

    toggleDropdown(event: Event): void {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    selectLanguage(code: 'es' | 'en', event: Event): void {
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
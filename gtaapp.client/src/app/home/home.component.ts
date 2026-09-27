import { Component, ElementRef, HostListener } from '@angular/core';
import { buildInfo } from '../../environments/build-info';
import { TranslationService, LanguageCode } from '../i18n';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent {
    isOpen = false;

    readonly ultimaActualizacion = buildInfo.timestamp;
    readonly buildCommit = buildInfo.commitHash;

    constructor(
        private readonly elementRef: ElementRef,
        readonly translationService: TranslationService
    ) {}

    get languages() {
        return this.translationService.supportedLanguages;
    }

    get selectedCode(): LanguageCode {
        return this.translationService.currentLanguage();
    }

    get currentLanguage() {
        return this.translationService.currentLanguageInfo();
    }

    toggleDropdown(event: Event): void {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    selectLanguage(code: LanguageCode, event: Event): void {
        event.stopPropagation();
        this.translationService.setLanguage(code);
        this.isOpen = false;
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
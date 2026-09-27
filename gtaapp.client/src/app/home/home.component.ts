import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { buildInfo } from '../../environments/build-info';

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

    readonly ultimaActualizacion = buildInfo.timestamp;
    readonly buildCommit = buildInfo.commitHash;

    readonly languages: Language[] = [
        { code: 'es', label: 'Español' },
        { code: 'en', label: 'English' }
    ];

    constructor(private readonly elementRef: ElementRef) {}

    ngOnInit(): void {
        const savedLang = localStorage.getItem('gta_lang');
        if (savedLang === 'es' || savedLang === 'en') {
            this.selectedCode = savedLang;
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
        localStorage.setItem('gta_lang', code);
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
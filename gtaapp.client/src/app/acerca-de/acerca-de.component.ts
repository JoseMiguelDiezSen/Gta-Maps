import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CookieService } from '../services/cookie.service';

@Component({
  selector: 'app-acerca-de',
  templateUrl: './acerca-de.component.html',
  styleUrls: ['../gta5/guia/offline/gta5-guia-offline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AcercaDeComponent {
  public readonly cookieService = inject(CookieService);

  themeMode: 'night' | 'day' = 'night';
  showScrollTop: boolean = false;

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onShellScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      this.showScrollTop = target.scrollTop > 300;
    }
  }

  scrollToTop(element: HTMLElement): void {
    element.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

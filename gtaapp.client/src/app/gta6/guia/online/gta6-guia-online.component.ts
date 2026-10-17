import { Component } from '@angular/core';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';

@Component({
  selector: 'app-gta6-guia-online',
  templateUrl: './gta6-guia-online.component.html',
  styleUrls: ['../offline/gta6-guia-offline.component.css', './gta6-guia-online.component.css'],
  standalone: false
})
export class Gta6GuiaOnlineComponent {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  themeMode: 'night' | 'day' = 'night';
  mobileNavOpen: boolean = false;

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onGta5MapClick(event: Event): void {
    event.preventDefault();
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
    }
  }
}

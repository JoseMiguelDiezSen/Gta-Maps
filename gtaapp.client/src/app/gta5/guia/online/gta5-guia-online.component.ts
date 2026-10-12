import { Component } from '@angular/core';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';

@Component({
  selector: 'app-gta5-guia-online',
  templateUrl: './gta5-guia-online.component.html',
  styleUrls: ['../offline/gta5-guia-offline.component.css', './gta5-guia-online.component.css'],
  standalone: false
})
export class Gta5GuiaOnlineComponent {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  themeMode: 'night' | 'day' = 'night';

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
    }
  }
}

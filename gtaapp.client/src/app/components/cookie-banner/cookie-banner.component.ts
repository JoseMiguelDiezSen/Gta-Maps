import { Component, signal } from '@angular/core';
import { CookieService } from '../../services/cookie.service';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.css'],
  standalone: false
})
export class CookieBannerComponent {
  isConfiguring = signal<boolean>(false);
  showPolicyModal = signal<boolean>(false);

  tempAnalytics = signal<boolean>(true);
  tempPreferences = signal<boolean>(true);

  constructor(public readonly cookieService: CookieService) {
    const current = this.cookieService.preferences();
    this.tempAnalytics.set(current.analytics);
    this.tempPreferences.set(current.preferences);
  }

  onAcceptAll(): void {
    this.cookieService.acceptAll();
    this.isConfiguring.set(false);
  }

  onRejectOptional(): void {
    this.cookieService.rejectOptional();
    this.isConfiguring.set(false);
  }

  toggleConfigure(): void {
    const current = this.cookieService.preferences();
    this.tempAnalytics.set(current.analytics);
    this.tempPreferences.set(current.preferences);
    this.isConfiguring.update(val => !val);
  }

  saveConfig(): void {
    this.cookieService.savePreferences({
      analytics: this.tempAnalytics(),
      preferences: this.tempPreferences()
    });
    this.isConfiguring.set(false);
  }

  openPolicy(): void {
    this.showPolicyModal.set(true);
  }

  closePolicy(): void {
    this.showPolicyModal.set(false);
  }
}

import { Injectable, signal } from '@angular/core';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
}

export interface CookieConsentState {
  hasConsented: boolean;
  preferences: CookiePreferences;
  timestamp: string;
}

const STORAGE_KEY = 'gtaapp_cookie_consent_v1';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  readonly hasConsented = signal<boolean>(false);
  readonly isBannerVisible = signal<boolean>(false);
  readonly preferences = signal<CookiePreferences>({
    necessary: true,
    analytics: true,
    preferences: true
  });

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: CookieConsentState = JSON.parse(saved);
        this.hasConsented.set(parsed.hasConsented);
        const prefs: CookiePreferences = {
          necessary: true,
          analytics: !!parsed.preferences?.analytics,
          preferences: !!parsed.preferences?.preferences
        };
        this.preferences.set(prefs);
        this.isBannerVisible.set(!parsed.hasConsented);
        this.updateGtagConsent(prefs);
      } else {
        this.hasConsented.set(false);
        this.isBannerVisible.set(true);
      }
    } catch {
      this.hasConsented.set(false);
      this.isBannerVisible.set(true);
    }
  }

  acceptAll(): void {
    const prefs: CookiePreferences = { necessary: true, analytics: true, preferences: true };
    this.saveConsentState(prefs);
  }

  rejectOptional(): void {
    const prefs: CookiePreferences = { necessary: true, analytics: false, preferences: false };
    this.saveConsentState(prefs);
  }

  savePreferences(customPrefs: Partial<CookiePreferences>): void {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: !!customPrefs.analytics,
      preferences: !!customPrefs.preferences
    };
    this.saveConsentState(prefs);
  }

  private saveConsentState(prefs: CookiePreferences): void {
    const state: CookieConsentState = {
      hasConsented: true,
      preferences: prefs,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      document.cookie = `gtaapp_consent=1; max-age=31536000; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('CookieService: Could not save consent to localStorage', e);
    }

    this.preferences.set(prefs);
    this.hasConsented.set(true);
    this.isBannerVisible.set(false);
    this.updateGtagConsent(prefs);
  }

  private updateGtagConsent(prefs: CookiePreferences): void {
    if (typeof (window as any).gtag === 'function') {
      const status = prefs.analytics ? 'granted' : 'denied';
      (window as any).gtag('consent', 'update', {
        'analytics_storage': status
      });
    }
  }

  openBanner(): void {
    this.isBannerVisible.set(true);
  }

  closeBanner(): void {
    if (this.hasConsented()) {
      this.isBannerVisible.set(false);
    }
  }
}

import { Injectable, Inject, PLATFORM_ID, effect } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../i18n';

export interface SeoRouteData {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultTitleKey = 'seo.defaultTitle';
  private readonly defaultDescriptionKey = 'seo.defaultDesc';
  private readonly baseUrl = 'https://gtamaps.dev';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initRouteListener();

    // Reacciona en tiempo real a cualquier cambio de idioma en la app
    effect(() => {
      // Registrar dependencia reactiva de idioma
      this.translationService.currentLanguage();
      this.refreshCurrentSeo();
    });
  }

  /**
   * Inicializa la escucha automática de cambios de ruta para actualizar títulos y canónicas.
   */
  private initRouteListener(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshCurrentSeo();
      });
  }

  /**
   * Refresca los metadatos y el título de la pestaña actual traduciéndolo al idioma activo.
   */
  public refreshCurrentSeo(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data: SeoRouteData = route.snapshot.data || {};

    const titleKey = data.titleKey || this.defaultTitleKey;
    const descKey = data.descriptionKey || this.defaultDescriptionKey;

    const translatedTitle = this.translationService.t(titleKey);
    const title = translatedTitle && translatedTitle !== titleKey ? translatedTitle : (data.title || 'GTA MAPS');

    const translatedDesc = this.translationService.t(descKey);
    const description = translatedDesc && translatedDesc !== descKey ? translatedDesc : (data.description || '');

    const canonical = data.canonical || `${this.baseUrl}${this.router.url.split('?')[0]}`;

    this.updateSeo(title, description, canonical);
  }

  /**
   * Actualiza el título de la pestaña, la meta descripción y la etiqueta canonical para Google.
   */
  public updateSeo(title: string, description: string, canonicalUrl: string): void {
    // 1. Título de la pestaña
    this.titleService.setTitle(title);

    // 2. Meta descripción para los resultados de Google
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // 3. Etiqueta canonical
    this.updateCanonicalUrl(canonicalUrl);

    // 4. Notificar a Google Analytics (GA4) la nueva vista de página en SPA
    if (isPlatformBrowser(this.platformId) && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.href,
        page_path: this.router.url
      });
    }
  }

  /**
   * Asegura la presencia y actualización de la etiqueta <link rel="canonical"> en el <head>.
   */
  private updateCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } catch (e) {
      // Ignorar en entornos sin DOM completo
    }
  }
}

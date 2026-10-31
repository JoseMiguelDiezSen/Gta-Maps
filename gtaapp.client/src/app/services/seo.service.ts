import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslationService, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';

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
  private readonly baseUrl = 'https://gtaexplorer.com';

  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly translationService = inject(TranslationService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId: object = inject(PLATFORM_ID);
  private hasCompletedInitialNavigation = false;

  constructor() {
    this.initRouteListener();

    // Reacciona en tiempo real a cualquier cambio de idioma o carga de diccionario tras la navegación inicial
    effect(() => {
      this.translationService.currentLanguage();
      this.translationService.currentDictionary();
      if (this.hasCompletedInitialNavigation) {
        this.refreshCurrentSeo();
      }
    });
  }

  /**
   * Inicializa la escucha automática de cambios de ruta para actualizar títulos y canónicas.
   */
  private initRouteListener(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.hasCompletedInitialNavigation = true;
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

    const translatedTitle = data.titleKey ? this.translationService.t(data.titleKey) : '';
    const fallbackDefaultTitle = this.translationService.t(this.defaultTitleKey);
    const title = (data.titleKey && translatedTitle && translatedTitle !== data.titleKey)
      ? translatedTitle
      : (data.title || (fallbackDefaultTitle !== this.defaultTitleKey ? fallbackDefaultTitle : 'GTA Explorer'));

    const translatedDesc = data.descriptionKey ? this.translationService.t(data.descriptionKey) : '';
    const fallbackDefaultDesc = this.translationService.t(this.defaultDescriptionKey);
    const description = (data.descriptionKey && translatedDesc && translatedDesc !== data.descriptionKey)
      ? translatedDesc
      : (data.description || (fallbackDefaultDesc !== this.defaultDescriptionKey ? fallbackDefaultDesc : ''));

    const rawPath = this.router.url.split('?')[0].split('#')[0] || '/home';
    const cleanPath = rawPath === '/' ? '/home' : rawPath.replace(/\/+$/, '').toLowerCase();
    const baseCanonical = data.canonical || `${this.baseUrl}${cleanPath}`;
    const activeLang = this.translationService.currentLanguage();
    const localizedCanonical = activeLang && activeLang !== DEFAULT_LANGUAGE
      ? `${baseCanonical}?lang=${activeLang}`
      : baseCanonical;

    this.updateSeo(title, description, localizedCanonical, baseCanonical);
  }

  /**
   * Actualiza el título de la pestaña, la meta descripción y la etiqueta canonical para Google.
   */
  public updateSeo(title: string, description: string, canonicalUrl: string, baseRouteCanonical?: string): void {
    // 1. Título de la pestaña
    this.titleService.setTitle(title);

    // 2. Meta descripción para los resultados de Google
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // 3. Etiqueta canonical y enlaces alternativos hreflang (13 idiomas + x-default)
    this.updateCanonicalUrl(canonicalUrl);
    this.updateHreflangLinks(baseRouteCanonical || canonicalUrl.split('?')[0]);

    // 4. Open Graph y Twitter Cards sincronizados por ruta e idioma
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
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
    } catch {
      // Ignorar en entornos sin DOM completo
    }
  }

  /**
   * Sincroniza las etiquetas <link rel="alternate" hreflang="..."> para los 13 idiomas y x-default.
   */
  private updateHreflangLinks(baseRouteUrl: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      for (const lang of SUPPORTED_LANGUAGES) {
        const href = lang.code === DEFAULT_LANGUAGE
          ? baseRouteUrl
          : `${baseRouteUrl}?lang=${lang.code}`;
        this.upsertHreflangTag(lang.code, href);
      }
      this.upsertHreflangTag('x-default', `${baseRouteUrl}?lang=en`);
    } catch {
      // Ignorar en entornos sin DOM completo
    }
  }

  private upsertHreflangTag(hreflang: string, href: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}

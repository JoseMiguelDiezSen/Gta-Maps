import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoRouteData {
  title?: string;
  description?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultTitle = 'GTA MAPS - Mapas Interactivos de GTA V y GTA VI';
  private readonly defaultDescription = 'Mapas interactivos de GTA V y GTA VI con ubicaciones de misiones, vehículos, coleccionables y secretos en Los Santos y Vice City.';
  private readonly baseUrl = 'https://gtamaps.dev';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initRouteListener();
  }

  /**
   * Inicializa la escucha automática de cambios de ruta para actualizar títulos y canónicas.
   */
  private initRouteListener(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const data: SeoRouteData = route.snapshot.data || {};
        const title = data.title || this.defaultTitle;
        const description = data.description || this.defaultDescription;
        const canonical = data.canonical || `${this.baseUrl}${this.router.url.split('?')[0]}`;

        this.updateSeo(title, description, canonical);
      });
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

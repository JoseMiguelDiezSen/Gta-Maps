import { Injectable, inject } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';
import { DEFAULT_LANGUAGE } from './i18n.config';
import { TranslationService } from './i18n.service';

/**
 * Mantiene ?lang= en todas las URLs internas, tanto en los href de routerLink como en la barra
 * de direcciones. Sin esto, un rastreador en ?lang=de saltaba a las páginas en español.
 * El español es la URL limpia, sin parámetro.
 */
@Injectable()
export class LangUrlSerializer extends DefaultUrlSerializer {
  private readonly translationService = inject(TranslationService);

  override serialize(tree: UrlTree): string {
    const original = tree.queryParams;
    const queryParams = { ...original };
    const lang = this.translationService.currentLang;

    if (lang === DEFAULT_LANGUAGE) {
      delete queryParams['lang'];
    } else {
      queryParams['lang'] = lang;
    }

    tree.queryParams = queryParams;
    try {
      return super.serialize(tree);
    } finally {
      tree.queryParams = original;
    }
  }
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './i18n.service';
import { TranslationParams } from './i18n.types';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: false
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(key: string, params?: TranslationParams): string {
    return this.translationService.translate(key, params);
  }
}

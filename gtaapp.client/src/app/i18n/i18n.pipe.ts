import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from './i18n.service';
import { TranslationParams } from './i18n.types';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private readonly translationService: TranslationService) {}

  transform(key: string, params?: TranslationParams): string {
    return this.translationService.translate(key, params);
  }
}

import { Component, inject } from '@angular/core';
import { SeoService } from './services/seo.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
    private readonly seoService = inject(SeoService);
}

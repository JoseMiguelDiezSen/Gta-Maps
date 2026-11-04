import { Component, EventEmitter, Input, Output } from '@angular/core';
import { isDevAccessAllowed } from '../../services/dev-access.guard';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css'],
  standalone: false
})
export class TopNavComponent {
  @Input() game: 'gta5' | 'gta6' = 'gta5';
  @Input() brandKey: string | null = null;
  @Input() mode: 'story' | 'online' | null = null;
  @Input() activePage: 'guide' | 'about' | 'videos' = 'guide';
  @Input() themeMode: 'night' | 'day' = 'night';

  @Output() themeToggle = new EventEmitter<void>();
  @Output() gta6MapBlocked = new EventEmitter<void>();

  readonly isDevAllowed: boolean = isDevAccessAllowed();
  mobileNavOpen: boolean = false;

  get isGta5Guide(): boolean {
    return this.activePage === 'guide' && this.game === 'gta5';
  }

  get isGta6Guide(): boolean {
    return this.activePage === 'guide' && this.game === 'gta6';
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
      event.stopPropagation();
      this.gta6MapBlocked.emit();
    }
  }
}

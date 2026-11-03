import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GtaTimeService implements OnDestroy {
  readonly hours = signal<number>(12);
  readonly minutes = signal<number>(0);
  readonly timeString = signal<string>('12:00');
  readonly isNight = signal<boolean>(false);
  readonly hourChanged = signal<{ previous: number; current: number } | null>(null);

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startClock();
  }

  private startClock(): void {
    const now = new Date();
    const totalRealSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const inGameTotalSeconds = (totalRealSecondsToday * 30) % 86400;
    const h = (Math.floor(inGameTotalSeconds / 3600) - 6 + 24) % 24;
    const m = Math.floor((inGameTotalSeconds % 3600) / 60);

    this.hours.set(h);
    this.minutes.set(m);
    this.updateFormattedTime(h, m);

    this.clockInterval = setInterval(() => {
      let curM = this.minutes() + 1;
      let curH = this.hours();
      if (curM >= 60) {
        curM = 0;
        const prevH = curH;
        curH = (curH + 1) % 24;
        this.hours.set(curH);
        this.hourChanged.set({ previous: prevH, current: curH });
      }
      this.minutes.set(curM);
      this.updateFormattedTime(curH, curM);
    }, 2000);
  }

  private updateFormattedTime(h: number, m: number): void {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    this.timeString.set(`${hh}:${mm}`);
    this.isNight.set(h >= 20 || h < 6);
  }

  /** Comprueba si la hora actual está dentro del intervalo [start, end) */
  isHourActive(start: number, end: number): boolean {
    const h = this.hours();
    if (start <= end) {
      return h >= start && h < end;
    }
    // Rango que cruza la medianoche (ej: 21:00 a 05:00)
    return h >= start || h < end;
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }
}

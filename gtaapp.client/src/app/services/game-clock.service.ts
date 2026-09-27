import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GameClockService implements OnDestroy {
    private inGameHours = 12;
    private inGameMinutes = 0;
    private readonly timeSubject = new BehaviorSubject<string>('12:00');
    private clockInterval: ReturnType<typeof setInterval> | null = null;

    readonly time$: Observable<string> = this.timeSubject.asObservable();

    constructor() {
        this.startClock();
    }

    get currentTime(): string {
        return this.timeSubject.value;
    }

    get hours(): number {
        return this.inGameHours;
    }

    get minutes(): number {
        return this.inGameMinutes;
    }

    private startClock(): void {
        const now = new Date();
        const totalRealSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const inGameTotalSeconds = (totalRealSecondsToday * 30) % 86400;
        this.inGameHours = Math.floor(inGameTotalSeconds / 3600);
        this.inGameMinutes = Math.floor((inGameTotalSeconds % 3600) / 60);
        this.updateTimeString();

        this.clockInterval = setInterval(() => {
            this.inGameMinutes++;
            if (this.inGameMinutes >= 60) {
                this.inGameMinutes = 0;
                this.inGameHours = (this.inGameHours + 1) % 24;
            }
            this.updateTimeString();
        }, 2000);
    }

    private updateTimeString(): void {
        const hh = this.inGameHours.toString().padStart(2, '0');
        const mm = this.inGameMinutes.toString().padStart(2, '0');
        this.timeSubject.next(`${hh}:${mm}`);
    }

    ngOnDestroy(): void {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}

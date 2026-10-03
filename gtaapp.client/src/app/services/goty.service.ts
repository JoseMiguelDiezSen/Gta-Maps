import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GotyMessage, GotyGameMode } from '../models/goty';

export interface GotyIntent {
  id: string;
  keywords: string[];
  responses: string[];
}

export interface GotyBrain {
  common: GotyIntent[];
  'gta5-historia': GotyIntent[];
  'gta5-online': GotyIntent[];
  'gta6-historia': GotyIntent[];
  'gta6-online': GotyIntent[];
}

@Injectable({
  providedIn: 'root'
})
export class GotyService {
  private isBotEnabled = true;
  private localBrain: GotyBrain = {
    common: [], 'gta5-historia': [], 'gta5-online': [], 'gta6-historia': [], 'gta6-online': []
  };

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('goty_bot_enabled');
    if (saved !== null) {
      this.isBotEnabled = saved === 'true';
    }

    // Cargar el cerebro local (por defecto ES)
    this.http.get<GotyBrain>('assets/data/goty-brain-es.json').subscribe({
      next: (data) => this.localBrain = data,
      error: (err) => console.error('Error cargando el cerebro local:', err)
    });
  }

  get isEnabled(): boolean {
    return this.isBotEnabled;
  }

  setBotEnabled(enabled: boolean): void {
    this.isBotEnabled = enabled;
    localStorage.setItem('goty_bot_enabled', enabled ? 'true' : 'false');
  }

  getInitialGreeting(context: GotyGameMode): GotyMessage {
    let text = '';
    switch (context) {
      case 'gta5-historia':
        text = '¡Ey, crack! Soy GOTY 5, tu enlace en Los Santos. ¿En qué te echo un cable hoy?';
        break;
      case 'gta5-online':
        text = '¿Qué pasa, jefe? GOTY 5 al aparato. ¿En qué te echo un cable hoy?';
        break;
      case 'gta6-historia':
      case 'gta6-online':
        text = '¡Bienvenidos a Vice City! Soy GOTY 6. ¿En qué te echo un cable hoy?';
        break;
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'goty',
      text,
      timestamp: new Date()
    };
  }

  processUserQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const payload = { Message: query, Context: context };

    return this.http.post<{ text: string, isAngry: boolean }>('/api/goty/chat', payload).pipe(
      map(response => ({
        id: 'msg-' + Date.now(),
        sender: 'goty' as 'goty',
        text: response.text.trim() + ' [Online]',
        timestamp: new Date(),
        isAngry: response.isAngry
      } as GotyMessage)),
      catchError(err => {
        return this.processLocalQuery(query, context);
      })
    );
  }

  private getDaysUntilRelease(): number {
    const target = new Date(2026, 10, 19); // 19 de Noviembre de 2026
    const diff = target.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private normalizeString(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  private processLocalQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const cleanQuery = this.normalizeString(query);
    
    // Fusionar el bloque específico del modo de juego primero (para que sobrescriba al común) y luego el común
    const activeIntents = [
      ...(this.localBrain[context] || []),
      ...(this.localBrain.common || [])
    ];
    
    // 1. Buscar la intención que encaje con alguna raíz o palabra clave
    let matchedIntent = activeIntents.find(intent => 
      intent.id !== 'default' && intent.keywords.some(kw => {
        const cleanKw = this.normalizeString(kw);
        return cleanQuery.includes(cleanKw);
      })
    );

    // 2. Si no entiende nada, coge la intención por defecto (que está en common)
    if (!matchedIntent) {
      matchedIntent = activeIntents.find(intent => intent.id === 'default');
    }

    // 3. Escoger una respuesta al azar dentro de la intención y limpiar etiquetas
    let responseText = 'Mi cerebro de reserva está listo. Dime qué necesitas.';
    if (matchedIntent && matchedIntent.responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchedIntent.responses.length);
      responseText = matchedIntent.responses[randomIndex]
        .replace(/\[Modo Local\]\s*/g, '')
        .replace(/\[Modo Local activo\]\.\s*/g, '')
        .replace(/Servidor local activo\.\s*/g, '')
        .trim();

      // Reemplazar marcador dinámico {days}
      const daysLeft = this.getDaysUntilRelease();
      responseText = responseText.replace(/{days}/g, daysLeft.toString());
    }

    const isAngry = matchedIntent?.id === 'insulto';

    return of({
      id: 'msg-' + Date.now(),
      sender: 'goty',
      text: responseText + ' [Local]',
      timestamp: new Date(),
      isAngry
    });
  }
}

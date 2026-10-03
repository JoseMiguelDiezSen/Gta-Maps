import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GotyMessage, GotyGameMode } from '../models/goty';

@Injectable({
  providedIn: 'root'
})
export class GotyService {
  private isBotEnabled = true;

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('goty_bot_enabled');
    if (saved !== null) {
      this.isBotEnabled = saved === 'true';
    }
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
    let quickReplies: string[] = [];

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
      timestamp: new Date(),
      quickReplies
    };
  }

  processUserQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const payload = {
      Message: query,
      Context: context
    };

    return this.http.post<{ text: string, isAngry: boolean }>('/api/goty/chat', payload).pipe(
      map(response => ({
        id: 'msg-' + Date.now(),
        sender: 'goty' as 'goty',
        text: response.text + ' [Modo Online]',
        timestamp: new Date(),
        quickReplies: [],
        isAngry: response.isAngry
      } as GotyMessage)),
      catchError(err => {
        // Fallback Silencioso: Si la IA falla (cuota o caída), pasamos al motor local.
        console.warn('Goty AI no disponible. Entrando en modo Local Fallback...');
        return this.processLocalQuery(query, context);
      })
    );
  }

  private processLocalQuery(query: string, context: GotyGameMode): Observable<GotyMessage> {
    const q = query.trim().toLowerCase();

    // 1. Armas / Arsenal
    if (q.includes('arma') || q.includes('pistola') || q.includes('rifle') || q.includes('arsenal') || q.includes('escopeta') || q.includes('daño') || q.includes('cadencia')) {
      if (q.includes('cuant') || q.includes('total') || q.includes('numero')) {
        return of({ id: 'msg-' + Date.now(), sender: 'goty', text: 'Tenemos 28 armas registradas en el catálogo de la Armería divididas en 8 categorías.', timestamp: new Date() });
      }
      if (q.includes('potente') || q.includes('mejor') || q.includes('fuerte')) {
        return of({ id: 'msg-' + Date.now(), text: 'Para combate a media distancia, la **Carabina Especial** y el **Fusil de Combate** son los reyes. Para demolición pura, el **Cañón de Riel (Railgun)**.', sender: 'goty', timestamp: new Date() });
      }
      return of({ id: 'msg-' + Date.now(), text: 'Puedes consultar todas las armas en la pestaña **Armas** del panel lateral: tienes buscador y filtros.', sender: 'goty', timestamp: new Date() });
    }

    // 2. Vehículos / Coches / Concesionario
    if (q.includes('coche') || q.includes('vehiculo') || q.includes('concesionario') || q.includes('rapido') || q.includes('blindado') || q.includes('moto')) {
      if (q.includes('blindado') || q.includes('seguro')) {
        return of({ id: 'msg-' + Date.now(), text: 'Para misiones y golpes, el **Karin Kuruma Blindado** es un salvavidas infalible contra balas.', sender: 'goty', timestamp: new Date() });
      }
      return of({ id: 'msg-' + Date.now(), text: 'En el panel de **Vehículos** puedes explorar todos los concesionarios de Los Santos con especificaciones completas.', sender: 'goty', timestamp: new Date() });
    }

    // 3. Golpes (Heists)
    if (q.includes('golpe') || q.includes('heist') || q.includes('cayo') || q.includes('casino') || q.includes('fleeca') || q.includes('pacific') || q.includes('juicio') || q.includes('kortz')) {
      if (q.includes('cayo') || q.includes('perico')) {
        return of({ id: 'msg-' + Date.now(), text: 'El **Golpe a Cayo Perico** es el más rentable y flexible: puedes hacerlo 100% en solitario.', sender: 'goty', timestamp: new Date() });
      }
      if (q.includes('kortz')) {
        return of({ id: 'msg-' + Date.now(), text: 'El **Golpe al Kortz Center** es exclusivo de esta app. Es un asalto al museo con un botín brutal. Revísalo en el Panel de Golpes.', sender: 'goty', timestamp: new Date() });
      }
      return of({ id: 'msg-' + Date.now(), text: 'Tienes golpes completos detallados en la pestaña **Golpes** del panel lateral.', sender: 'goty', timestamp: new Date() });
    }

    // 4. Misterios y Leyendas
    if (q.includes('misterio') || q.includes('chiliad') || q.includes('ovni') || q.includes('fantasma')) {
      return of({ id: 'msg-' + Date.now(), text: 'La pestaña con el icono **👁️ (Misterios)** recoge las leyendas más célebres de San Andreas con horarios exactos y coordenadas.', sender: 'goty', timestamp: new Date() });
    }

    // 5. Coordenadas / Dónde estoy
    if (q.includes('donde') || q.includes('coordenada') || q.includes('ubicacion') || q.includes('mapa') || q.includes('sitio')) {
      return of({ id: 'msg-' + Date.now(), text: 'Dame las coordenadas de tu radar (X, Y) o el barrio donde estás y te digo exactamente qué tienes al lado.', sender: 'goty', timestamp: new Date() });
    }

    // 7. Quién eres / Saludo / Humor
    if (q.includes('hola') || q.includes('buenas') || q.includes('quien eres') || q.includes('que tal') || q.includes('ey')) {
      return of({ id: 'msg-' + Date.now(), text: context.startsWith('gta5') ? '¡Qué pasa! Soy **GOTY 5** [Modo Local]. Pregúntame por armas, golpes, vehículos, misterios o coordenadas.' : '¡Saludos! Soy **GOTY 6** [Modo Local].', sender: 'goty', timestamp: new Date() });
    }

    // Respuesta por defecto
    return of({
      id: 'msg-' + Date.now(),
      text: '[Modo Local activo]. Pregúntame sobre armas, vehículos, golpes, coleccionables o misterios del mapa y te lo canto rápido.',
      sender: 'goty',
      timestamp: new Date()
    });
  }
}

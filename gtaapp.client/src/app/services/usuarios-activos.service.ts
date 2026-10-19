import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class UsuariosActivosService {
  private hubConnection?: signalR.HubConnection;

  /** Número de usuarios activos conectados en tiempo real */
  readonly usuariosActivos = signal<number>(1);

  /** Estado de la conexión al Hub */
  readonly conectado = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setTimeout(() => this.iniciarConexion(), 3500));
      } else {
        setTimeout(() => this.iniciarConexion(), 4000);
      }
    } else {
      this.iniciarConexion();
    }
  }

  private iniciarConexion(): void {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/usuarios-activos')
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    this.hubConnection.on('ActualizarUsuariosActivos', (total: number) => {
      this.usuariosActivos.set(Math.max(1, total));
    });

    this.hubConnection.onreconnecting(() => {
      this.conectado.set(false);
    });

    this.hubConnection.onreconnected(() => {
      this.conectado.set(true);
    });

    this.hubConnection.onclose(() => {
      this.conectado.set(false);
    });

    this.hubConnection
      .start()
      .then(() => {
        this.conectado.set(true);
      })
      .catch((err) => {
        console.warn('UsuariosActivosHub: No se pudo conectar a SignalR (modo sin servidor o desconectado):', err);
      });
  }
}

import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

/**
 * Servicio global singleton para la gestión unificada de conexiones SignalR.
 * Diseñado para abastecer a toda la aplicación (Home, GTA 5 y GTA 6) evitando
 * duplicar instancias del cliente SignalR en componentes o servicios individuales.
 */
@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  /** Registro de conexiones activas indexadas por ruta del Hub (ej: '/hubs/usuarios-activos', '/hubs/eventos-gta') */
  private readonly connections = new Map<string, signalR.HubConnection>();

  /** Registro de señales reactivas de estado de conexión por ruta del Hub */
  private readonly connectionStates = new Map<string, ReturnType<typeof signal<boolean>>>();

  /** Estado de conexión general (true si al menos un hub está conectado) */
  readonly isAnyConnected = signal<boolean>(false);

  /**
   * Obtiene o inicializa la conexión con el Hub especificado.
   * Configura reconexión automática y manejo seguro ante desconexiones.
   */
  getOrCreateConnection(hubPath: string): signalR.HubConnection {
    const existing = this.connections.get(hubPath);
    if (existing) {
      return existing;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubPath)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    const stateSignal = signal<boolean>(false);
    this.connectionStates.set(hubPath, stateSignal);

    connection.onreconnecting(() => {
      stateSignal.set(false);
      this.updateGlobalState();
    });

    connection.onreconnected(() => {
      stateSignal.set(true);
      this.updateGlobalState();
    });

    connection.onclose(() => {
      stateSignal.set(false);
      this.updateGlobalState();
    });

    this.connections.set(hubPath, connection);
    return connection;
  }

  /**
   * Inicia la conexión con un Hub si no está ya conectado o conectando.
   */
  async startConnection(hubPath: string): Promise<boolean> {
    const connection = this.getOrCreateConnection(hubPath);

    if (connection.state === signalR.HubConnectionState.Connected) {
      return true;
    }

    if (connection.state === signalR.HubConnectionState.Connecting) {
      return false;
    }

    try {
      await connection.start();
      const stateSignal = this.connectionStates.get(hubPath);
      stateSignal?.set(true);
      this.updateGlobalState();
      return true;
    } catch (err) {
      console.warn(`[SignalRService] No se pudo conectar al hub '${hubPath}' (modo sin conexión / local):`, err);
      const stateSignal = this.connectionStates.get(hubPath);
      stateSignal?.set(false);
      this.updateGlobalState();
      return false;
    }
  }

  /**
   * Registra un listener para un evento emitido por el Hub.
   * Devuelve una función para desuscribirse limpiamente y evitar memory leaks.
   */
  on<T = unknown>(hubPath: string, eventName: string, newMethod: (...args: T[]) => void): () => void {
    const connection = this.getOrCreateConnection(hubPath);
    connection.on(eventName, newMethod as (...args: unknown[]) => void);

    return () => {
      connection.off(eventName, newMethod as (...args: unknown[]) => void);
    };
  }

  /**
   * Invoca un método en el servidor a través del Hub.
   */
  async invoke<T = unknown>(hubPath: string, methodName: string, ...args: unknown[]): Promise<T | null> {
    const connection = this.getOrCreateConnection(hubPath);
    if (connection.state !== signalR.HubConnectionState.Connected) {
      console.warn(`[SignalRService] Intento de invocar '${methodName}' con hub '${hubPath}' desconectado.`);
      return null;
    }

    try {
      return await connection.invoke<T>(methodName, ...args);
    } catch (err) {
      console.error(`[SignalRService] Error al invocar '${methodName}' en hub '${hubPath}':`, err);
      return null;
    }
  }

  /**
   * Devuelve la señal reactiva de estado de conexión para un Hub concreto.
   */
  getConnectionState(hubPath: string): ReturnType<typeof signal<boolean>> {
    if (!this.connectionStates.has(hubPath)) {
      this.getOrCreateConnection(hubPath);
    }
    return this.connectionStates.get(hubPath)!;
  }

  /**
   * Cierra de forma ordenada la conexión con un Hub específico.
   */
  async stopConnection(hubPath: string): Promise<void> {
    const connection = this.connections.get(hubPath);
    if (connection) {
      try {
        await connection.stop();
      } finally {
        const stateSignal = this.connectionStates.get(hubPath);
        stateSignal?.set(false);
        this.updateGlobalState();
      }
    }
  }

  /**
   * Cierra todas las conexiones activas al desmontar o cerrar sesión.
   */
  async stopAllConnections(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [path, conn] of this.connections.entries()) {
      promises.push(
        conn.stop().finally(() => {
          this.connectionStates.get(path)?.set(false);
        })
      );
    }
    await Promise.all(promises);
    this.updateGlobalState();
  }

  private updateGlobalState(): void {
    let anyConnected = false;
    for (const state of this.connectionStates.values()) {
      if (state()) {
        anyConnected = true;
        break;
      }
    }
    this.isAnyConnected.set(anyConnected);
  }
}

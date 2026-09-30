namespace GTAAPP.Server.Hubs;

using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Hub de SignalR encargado de gestionar la comunicación en tiempo real para el contador de usuarios activos.
/// Permite que el servidor notifique a todos los clientes (navegadores) conectados cada vez que alguien entra o sale de la aplicación.
/// </summary>
public class UsuariosActivosHub : Hub
{
    /// <summary>
    /// Contador global de usuarios conectados.
    /// Es 'static' para que su valor se comparta entre todas las instancias del Hub que crea SignalR por cada conexión.
    /// </summary>
    private static int _usuariosActivos = 0;

    /// <summary>
    /// Se ejecuta automáticamente cuando un nuevo usuario/pestaña se conecta al servidor mediante SignalR.
    /// </summary>
    /// <returns>Tarea asíncrona que completa el proceso de conexión y notificación.</returns>
    public override async Task OnConnectedAsync()
    {
        // Incrementamos el contador de forma atómica y segura entre subprocesos (evita condiciones de carrera si entran varios a la vez).
        var total = Interlocked.Increment(ref _usuariosActivos);

        // Notificamos a TODOS los clientes conectados el nuevo número de usuarios para que actualicen su interfaz en vivo.
        await Clients.All.SendAsync("ActualizarUsuariosActivos", total);

        // Llamamos a la lógica base de SignalR para finalizar el ciclo de vida de la conexión.
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Se ejecuta automáticamente cuando un usuario cierra la pestaña, refresca la página o pierde la conexión de red.
    /// </summary>
    /// <param name="exception">Excepción que causó la desconexión (si la hubo), o null si fue una desconexión limpia.</param>
    /// <returns>Tarea asíncrona que completa el proceso de desconexión y notificación.</returns>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Reducimos el contador de forma atómica y segura.
        var total = Interlocked.Decrement(ref _usuariosActivos);

        // Control de seguridad: Si por alguna anomalía de red o reconexiones extrañas el contador bajara de cero, lo corregimos a 0.
        if (total < 0)
        {
            Interlocked.Exchange(ref _usuariosActivos, 0);
            total = 0;
        }

        // Enviamos el nuevo total actualizado a todos los usuarios que siguen conectados.
        await Clients.All.SendAsync("ActualizarUsuariosActivos", total);

        // Llamamos a la lógica base de SignalR para limpiar los recursos de esta conexión.
        await base.OnDisconnectedAsync(exception);
    }
}

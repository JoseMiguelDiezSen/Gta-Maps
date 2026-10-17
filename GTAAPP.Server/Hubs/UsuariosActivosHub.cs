namespace GTAAPP.Server.Hubs;

using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Hub de SignalR encargado de gestionar la comunicación en tiempo real para el contador de usuarios activos.
/// Permite que el servidor notifique a todos los clientes (navegadores) conectados cada vez que alguien entra o sale de la aplicación.
/// </summary>
public class UsuariosActivosHub : Hub
{
    private const int MaxConnectionsPerIp = 3;
    private static readonly object ConnectionsLock = new();
    private static readonly Dictionary<string, HashSet<string>> ConnectionsByIp = new(StringComparer.OrdinalIgnoreCase);
    private static readonly Dictionary<string, string> IpByConnectionId = new(StringComparer.Ordinal);

    /// <summary>
    /// Se ejecuta automáticamente cuando un nuevo usuario/pestaña se conecta al servidor mediante SignalR.
    /// Limita las conexiones por IP para evitar ataques de agotamiento de RAM o inflado artificial del contador.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var ip = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var connectionId = Context.ConnectionId;
        int totalUsuariosUnicos;
        bool shouldAbort = false;

        lock (ConnectionsLock)
        {
            if (!ConnectionsByIp.TryGetValue(ip, out var connSet))
            {
                connSet = new HashSet<string>(StringComparer.Ordinal);
                ConnectionsByIp[ip] = connSet;
            }

            if (connSet.Count >= MaxConnectionsPerIp)
            {
                shouldAbort = true;
                totalUsuariosUnicos = ConnectionsByIp.Count;
            }
            else
            {
                connSet.Add(connectionId);
                IpByConnectionId[connectionId] = ip;
                totalUsuariosUnicos = ConnectionsByIp.Count;
            }
        }

        if (shouldAbort)
        {
            Context.Abort();
            return;
        }

        await Clients.All.SendAsync("ActualizarUsuariosActivos", totalUsuariosUnicos);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Se ejecuta automáticamente cuando un usuario cierra la pestaña, refresca la página o pierde la conexión de red.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        int totalUsuariosUnicos;

        lock (ConnectionsLock)
        {
            if (IpByConnectionId.TryGetValue(connectionId, out var ip))
            {
                IpByConnectionId.Remove(connectionId);
                if (ConnectionsByIp.TryGetValue(ip, out var connSet))
                {
                    connSet.Remove(connectionId);
                    if (connSet.Count == 0)
                    {
                        ConnectionsByIp.Remove(ip);
                    }
                }
            }

            totalUsuariosUnicos = ConnectionsByIp.Count;
        }

        await Clients.All.SendAsync("ActualizarUsuariosActivos", totalUsuariosUnicos);
        await base.OnDisconnectedAsync(exception);
    }
}

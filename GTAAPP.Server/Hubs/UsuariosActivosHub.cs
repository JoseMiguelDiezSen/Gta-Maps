namespace GTAAPP.Server.Hubs;

using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Hub de SignalR para contabilizar usuarios activos conectados en tiempo real.
/// </summary>
public class UsuariosActivosHub : Hub
{
    private static int _usuariosActivos = 0;

    public override async Task OnConnectedAsync()
    {
        var total = Interlocked.Increment(ref _usuariosActivos);
        await Clients.All.SendAsync("ActualizarUsuariosActivos", total);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var total = Interlocked.Decrement(ref _usuariosActivos);
        if (total < 0)
        {
            Interlocked.Exchange(ref _usuariosActivos, 0);
            total = 0;
        }

        await Clients.All.SendAsync("ActualizarUsuariosActivos", total);
        await base.OnDisconnectedAsync(exception);
    }
}

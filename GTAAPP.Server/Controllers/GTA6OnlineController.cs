using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador preliminar para GTA VI Online (La próxima iteración multijugador masiva en el estado de Leonida).
/// Rutas admitidas: /api/gta6/online y /api/gta6online.
/// Estructura preparada para integrar propiedades, negocios criminales y modos de juego multijugador conforme se publiquen.
/// </summary>
[ApiController]
[Route("api/gta6/online")]
[Route("api/gta6online")]
[EnableRateLimiting("data-policy")]
public class GTA6OnlineController : ControllerBase
{
    /// <summary>
    /// Servicio de consulta de datos y datasets en memoria.
    /// </summary>
    private readonly LocationsService _locationsService;

    /// <summary>
    /// Constructor del controlador de GTA VI Online.
    /// </summary>
    /// <param name="locationsService">Servicio de datos inyectado mediante contenedor de dependencias.</param>
    public GTA6OnlineController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta6/online → Manifiesto oficial y estado del servicio de GTA VI Online.
    /// </summary>
    /// <returns>Objeto GameManifest con el estado ("proximamente") de la plataforma online.</returns>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta6online",
            Name = "GTA VI Online",
            Status = "proximamente",
            Map = null
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta6/online/locations → Ubicaciones futuras y puntos de interés de GTA VI Online
    /// (sedes de bandas, negocios clandestinos, pisos francos y garajes en Vice City).
    /// </summary>
    /// <param name="category">Categoría específica para filtrar.</param>
    /// <param name="lang">Código de idioma para los textos.</param>
    /// <returns>Lista de ubicaciones disponibles en el modo multijugador.</returns>
    [HttpGet("locations")]
    public ActionResult<List<LocationItem>> GetLocations([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(new List<LocationItem>());
    }
}

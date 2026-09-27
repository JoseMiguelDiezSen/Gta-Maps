using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador de GTA VI Modo Historia (Campaña: Jason y Lucía en Leonida / Vice City).
/// Rutas: /api/gta6/historia, /api/gta6historia y /api/gta6 (retrocompatibilidad).
/// </summary>
[ApiController]
[Route("api/gta6/historia")]
[Route("api/gta6historia")]
[Route("api/gta6")]
[EnableRateLimiting("data-policy")]
public class GTA6HistoriaController : ControllerBase
{
    private readonly LocationsService _locationsService;

    public GTA6HistoriaController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta6/historia o /api/gta6
    /// Devuelve el manifiesto oficial de GTA VI Modo Historia.
    /// </summary>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta6historia",
            Name = "GTA VI Modo Historia",
            Status = "proximamente",
            Map = null // El mapa oficial aún no ha sido publicado por Rockstar Games
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta6/historia/locations
    /// Puntos de interés y ubicaciones confirmadas de GTA VI Historia (lee de data/gta6/historia/{lang}/...).
    /// </summary>
    [HttpGet("locations")]
    public ActionResult<List<LocationItem>> GetLocations([FromQuery] string? category, [FromQuery] string? lang)
    {
        // Preparado para servir datos cuando se incorporen filtraciones/confirmaciones oficiales
        return Ok(new List<LocationItem>());
    }

    /// <summary>
    /// GET /api/gta6/historia/characters
    /// Personajes confirmados de GTA VI (Jason, Lucía, etc.).
    /// </summary>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetCharacters([FromQuery] string? lang)
    {
        return Ok(new List<LocationItem>());
    }
}

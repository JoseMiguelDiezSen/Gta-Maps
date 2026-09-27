using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial de GTA Online.
/// Rutas: /api/gta5/online, /api/gta5online y /api/gta5 (retrocompatibilidad).
/// </summary>
[ApiController]
[Route("api/gta5/online")]
[Route("api/gta5online")]
[Route("api/gta5")]
[EnableRateLimiting("data-policy")]
public class GTA5OnlineController : ControllerBase
{
    private readonly LocationsService _locationsService;

    public GTA5OnlineController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta5/online
    /// Devuelve el manifiesto oficial de GTA Online (mapas base Satellite, Roadmap, Atlas, Juego).
    /// </summary>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta5online",
            Name = "GTA Online",
            Status = "activo",
            Map = new GameMapInfo
            {
                TilePath = "assets",
                ImageSize = 8192,
                MaxZoom = 7,
                MapTypes = new List<MapTypeInfo>
                {
                    new() { Id = "Satellite", Label = "Satelite" },
                    new() { Id = "Roadmap", Label = "Carreteras" },
                    new() { Id = "Atlas", Label = "Atlas" },
                    new() { Id = "Juego", Label = "Juego" }
                }
            }
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/online/properties
    /// Propiedades de GTA Online (mansiones, búnkeres, hangares, oficinas CEO, etc.).
    /// </summary>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetProperties([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetPropertiesOnly(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/businesses
    /// Negocios de producción de GTA Online (coca, meta, hierba, dinero, club...).
    /// </summary>
    [HttpGet("businesses")]
    public ActionResult<List<LocationItem>> GetBusinesses([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetBusinesses(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/collectibles
    /// Coleccionables de GTA Online (naipes, figuras de acción, inhibidores, etc.).
    /// </summary>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetCollectibles(category, lang).ToList());
    }
}

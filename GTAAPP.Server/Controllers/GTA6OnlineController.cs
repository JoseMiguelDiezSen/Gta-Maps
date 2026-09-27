using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador de GTA VI Online (Multijugador en Leonida).
/// Rutas: /api/gta6/online y /api/gta6online.
/// </summary>
[ApiController]
[Route("api/gta6/online")]
[Route("api/gta6online")]
[EnableRateLimiting("data-policy")]
public class GTA6OnlineController : ControllerBase
{
    private readonly LocationsService _locationsService;

    public GTA6OnlineController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta6/online
    /// Devuelve el manifiesto oficial de GTA VI Online.
    /// </summary>
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
    /// GET /api/gta6/online/locations
    /// Ubicaciones futuras de GTA VI Online (lee de data/gta6/online/{lang}/...).
    /// </summary>
    [HttpGet("locations")]
    public ActionResult<List<LocationItem>> GetLocations([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(new List<LocationItem>());
    }
}

using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial de GTA V Modo Historia (Campaña de Michael, Trevor y Franklin).
/// Rutas: /api/gta5/historia, /api/gta5historia y /api/gta5/story.
/// </summary>
[ApiController]
[Route("api/gta5/historia")]
[Route("api/gta5historia")]
[Route("api/gta5/story")]
[EnableRateLimiting("data-policy")]
public class GTA5HistoriaController : ControllerBase
{
    private readonly LocationsService _locationsService;

    public GTA5HistoriaController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta5/historia
    /// Devuelve el manifiesto oficial de GTA V Modo Historia (con mapas Blueprint UV disponibles).
    /// </summary>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta5historia",
            Name = "GTA V Modo Historia",
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
                    new() { Id = "Juego", Label = "Juego" },
                    new() { Id = "UV", Label = "Blueprint" },
                    new() { Id = "UV2", Label = "Blueprint Alt." }
                }
            }
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/historia/properties
    /// Propiedades comprables en Modo Historia (negocios de Michael, Franklin, Trevor).
    /// </summary>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetStoryProperties([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryProperties(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/characters
    /// Personajes narrativos del Modo Historia (Michael, Trevor, Franklin, etc.).
    /// </summary>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetStoryCharacters([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryCharacters(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/services
    /// Servicios presentes en Modo Historia (hospitales, comisarías, Ammu-Nation, 24/7...).
    /// </summary>
    [HttpGet("services")]
    public ActionResult<List<LocationItem>> GetStoryServices([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryServices(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/vehicle-shops
    /// Talleres disponibles en Historia (LS Customs y Garaje Hao).
    /// </summary>
    [HttpGet("vehicle-shops")]
    public ActionResult<List<LocationItem>> GetStoryVehicleShops([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryVehicleShops(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/strange-places
    /// Lugares extraños presentes en Historia (OVNIs, naufragios, cuevas...).
    /// </summary>
    [HttpGet("strange-places")]
    public ActionResult<List<LocationItem>> GetStoryStrangePlaces([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryStrangePlaces(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/fauna
    /// Fauna y vida salvaje (hábitats y fotografía).
    /// </summary>
    [HttpGet("fauna")]
    public ActionResult<List<LocationItem>> GetStoryFauna([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryFauna(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/activities
    /// Actividades y deportes de Modo Historia.
    /// </summary>
    [HttpGet("activities")]
    public ActionResult<List<LocationItem>> GetStoryActivities([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryActivities(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/collectibles
    /// Coleccionables de Modo Historia.
    /// </summary>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetStoryCollectibles([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryCollectibles(category, lang).ToList());
    }
}

using System.Net;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador principal de ubicaciones con correspondencia 1 a 1 para cada categoría
/// del panel de control del mapa de GTA V.
/// </summary>
[ApiController]
[Route("api/locations")]
[EnableRateLimiting("data-policy")]
public class LocationsController : ControllerBase
{
    private static readonly Regex SafeQueryRegex = new(@"^[a-zA-Z0-9_\-]+$", RegexOptions.Compiled);
    private readonly LocationsService _service;

    public LocationsController(LocationsService service)
    {
        _service = service;
    }

    /// <summary>GET /api/locations → Agregación de todas las categorías del mapa</summary>
    [HttpGet("")]
    public ActionResult<List<LocationItem>> GetAllLocations([FromQuery] string? gameMode, [FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_service.GetAllLocations(SanitizeGameMode(gameMode), SanitizeCategory(category), SanitizeLang(lang)));
    }

    /// <summary>GET /api/locations/properties → 1. Propiedades (mansiones, búnkeres, hangares, oficinas CEO...)</summary>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetProperties([FromQuery] string? lang) => Ok(_service.GetPropertiesOnly(SanitizeLang(lang)));

    /// <summary>GET /api/locations/businesses → 2. Negocios (clubes, arcades, laboratorios de moteros...)</summary>
    [HttpGet("businesses")]
    public ActionResult<List<LocationItem>> GetBusinesses([FromQuery] string? lang) => Ok(_service.GetBusinesses(SanitizeLang(lang)));

    /// <summary>GET /api/locations/services → 3. Servicios (comisarías, hospitales, bomberos, 24/7, Ammu-Nation...)</summary>
    [HttpGet("services")]
    public ActionResult<List<LocationItem>> GetServices([FromQuery] string? lang) => Ok(_service.GetServices(SanitizeLang(lang)));

    /// <summary>GET /api/locations/vehicle-shops → 4. Talleres (LS Customs, Benny's, Garaje Hao, Car Meet...)</summary>
    [HttpGet("vehicle-shops")]
    public ActionResult<List<LocationItem>> GetVehicleShops([FromQuery] string? lang) => Ok(_service.GetVehicleShops(SanitizeLang(lang)));

    /// <summary>GET /api/locations/roleplay-jobs → 5. Trabajos Roleplay (Pizza This, bomberos, taxi, carretillero...)</summary>
    [HttpGet("roleplay-jobs")]
    public ActionResult<List<LocationItem>> GetRoleplayJobs([FromQuery] string? lang) => Ok(_service.GetRoleplayJobs(SanitizeLang(lang)));

    /// <summary>GET /api/locations/characters → 6. Personajes y Contactos (Lester, Franklin, Trevor, Michael...)</summary>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetCharacters([FromQuery] string? lang) => Ok(_service.GetCharacters(SanitizeLang(lang)));

    /// <summary>GET /api/locations/fauna → 7. Fauna y Vida Salvaje (12 Hábitats de animales y fotografía)</summary>
    [HttpGet("fauna")]
    public ActionResult<List<LocationItem>> GetFauna([FromQuery] string? lang) => Ok(_service.GetFauna(SanitizeLang(lang)));

    /// <summary>GET /api/locations/activities → 8. Actividades y Deportes</summary>
    [HttpGet("activities")]
    public ActionResult<List<LocationItem>> GetActivities([FromQuery] string? lang) => Ok(_service.GetActivities(SanitizeLang(lang)));

    /// <summary>GET /api/locations/strange-places → 9. Lugares extraños (OVNIs, naufragios, cuevas...)</summary>
    [HttpGet("strange-places")]
    public ActionResult<List<LocationItem>> GetStrangePlaces([FromQuery] string? lang) => Ok(_service.GetStrangePlaces(SanitizeLang(lang)));

    /// <summary>GET /api/locations/collectibles → 10. Coleccionables (GTA Online o Historia)</summary>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category, [FromQuery] string? lang, [FromQuery] string? gameMode)
    {
        var mode = SanitizeGameMode(gameMode);
        if (string.Equals(mode, "story", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(_service.GetStoryCollectibles(SanitizeCategory(category), SanitizeLang(lang)));
        }
        return Ok(_service.GetCollectibles(SanitizeCategory(category), SanitizeLang(lang)));
    }

    /// <summary>GET /api/locations/cayo-perico → Puntos de interés y ubicaciones de Cayo Perico</summary>
    [HttpGet("cayo-perico")]
    public ActionResult<List<LocationItem>> GetCayoPerico([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_service.GetCayoPericoLocations(SanitizeCategory(category), SanitizeLang(lang)));
    }

    private static string? SanitizeGameMode(string? gameMode)
    {
        if (string.IsNullOrWhiteSpace(gameMode)) return null;
        var mode = gameMode.Trim().ToLowerInvariant();
        return mode is "story" or "online" ? mode : null;
    }

    private static string? SanitizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var trimmed = category.Trim();
        return (trimmed.Length <= 50 && SafeQueryRegex.IsMatch(trimmed)) ? WebUtility.HtmlEncode(trimmed) : null;
    }

    private static string? SanitizeLang(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return null;
        var trimmed = lang.Trim().ToLowerInvariant();
        return (trimmed.Length <= 10 && SafeQueryRegex.IsMatch(trimmed)) ? trimmed : null;
    }
}

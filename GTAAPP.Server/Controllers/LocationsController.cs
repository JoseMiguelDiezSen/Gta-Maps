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
    public ActionResult<List<LocationItem>> GetAllLocations([FromQuery] string? gameMode, [FromQuery] string? category)
    {
        return Ok(_service.GetAllLocations(SanitizeGameMode(gameMode), SanitizeCategory(category)));
    }

    /// <summary>GET /api/locations/properties → 1. Propiedades (mansiones, búnkeres, hangares, oficinas CEO...)</summary>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetProperties() => Ok(_service.GetPropertiesOnly());

    /// <summary>GET /api/locations/businesses → 2. Negocios (clubes, arcades, laboratorios de moteros...)</summary>
    [HttpGet("businesses")]
    public ActionResult<List<LocationItem>> GetBusinesses() => Ok(_service.GetBusinesses());

    /// <summary>GET /api/locations/services → 3. Servicios (comisarías, hospitales, bomberos, 24/7, Ammu-Nation...)</summary>
    [HttpGet("services")]
    public ActionResult<List<LocationItem>> GetServices() => Ok(_service.GetServices());

    /// <summary>GET /api/locations/vehicle-shops → 4. Talleres (LS Customs, Benny's, Garaje Hao, Car Meet...)</summary>
    [HttpGet("vehicle-shops")]
    public ActionResult<List<LocationItem>> GetVehicleShops() => Ok(_service.GetVehicleShops());

    /// <summary>GET /api/locations/roleplay-jobs → 5. Trabajos Roleplay (Pizza This, bomberos, taxi, carretillero...)</summary>
    [HttpGet("roleplay-jobs")]
    public ActionResult<List<LocationItem>> GetRoleplayJobs() => Ok(_service.GetRoleplayJobs());

    /// <summary>GET /api/locations/characters → 6. Personajes y Contactos (Lester, Franklin, Trevor, Michael...)</summary>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetCharacters() => Ok(_service.GetCharacters());

    /// <summary>GET /api/locations/fauna → 7. Fauna y Vida Salvaje (12 Hábitats de animales y fotografía)</summary>
    [HttpGet("fauna")]
    public ActionResult<List<LocationItem>> GetFauna() => Ok(_service.GetFauna());

    /// <summary>GET /api/locations/activities → 8. Actividades y Deportes</summary>
    [HttpGet("activities")]
    public ActionResult<List<LocationItem>> GetActivities() => Ok(_service.GetActivities());

    /// <summary>GET /api/locations/strange-places → 9. Lugares extraños (OVNIs, naufragios, cuevas...)</summary>
    [HttpGet("strange-places")]
    public ActionResult<List<LocationItem>> GetStrangePlaces() => Ok(_service.GetStrangePlaces());

    /// <summary>GET /api/locations/collectibles → 10. Coleccionables exclusivos de GTA Online</summary>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category)
    {
        return Ok(_service.GetCollectibles(SanitizeCategory(category)));
    }

    /// <summary>GET /api/locations/vehicles → 11. Catálogo completo de vehículos por concesionario</summary>
    [HttpGet("vehicles")]
    public ActionResult<List<GtaVehicle>> GetVehicles([FromQuery] string? dealership, [FromQuery] string? category)
    {
        string? cleanDealership = null;
        if (!string.IsNullOrWhiteSpace(dealership))
        {
            var trimmedDealer = dealership.Trim();
            if (trimmedDealer.Length <= 50 && SafeQueryRegex.IsMatch(trimmedDealer))
            {
                cleanDealership = WebUtility.HtmlEncode(trimmedDealer);
            }
        }

        return Ok(_service.GetVehicles(cleanDealership, SanitizeCategory(category)));
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
}

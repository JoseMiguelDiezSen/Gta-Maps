using System.Net;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

[ApiController]
[Route("api/locations")]
[EnableRateLimiting("data-policy")]
public class LocationsController : ControllerBase
{
    private static readonly Regex SafeQueryRegex = new(@"^[a-zA-Z0-9_\-]+$", RegexOptions.Compiled);
    private readonly LocationsService _locationsService;

    public LocationsController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/locations/properties → Negocios, búnkeres, propiedades, servicios, contactos, fauna y puntos de interés.
    /// Soporta filtros opcionales por query: ?gameMode=story|online y ?category=bunker|nightclub|police_station|etc.
    /// </summary>
    [HttpGet("properties")]
    public ActionResult<List<PropertyLocation>> GetProperties([FromQuery] string? gameMode, [FromQuery] string? category)
    {
        string? cleanGameMode = null;
        if (!string.IsNullOrWhiteSpace(gameMode))
        {
            var trimmedMode = gameMode.Trim().ToLowerInvariant();
            if (trimmedMode is "story" or "online")
            {
                cleanGameMode = trimmedMode;
            }
        }

        string? cleanCategory = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCat = category.Trim();
            if (trimmedCat.Length <= 50 && SafeQueryRegex.IsMatch(trimmedCat))
            {
                cleanCategory = WebUtility.HtmlEncode(trimmedCat);
            }
        }

        return Ok(_locationsService.GetProperties(cleanGameMode, cleanCategory));
    }

    /// <summary>
    /// GET /api/locations/collectibles → Coleccionables exclusivos de GTA Online (naipes, muñecos, inhibidores, etc.).
    /// Soporta filtro opcional por query: ?category=playing_card|action_figure|signal_jammer|movie_prop|radio_antenna.
    /// </summary>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category)
    {
        string? cleanCategory = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCat = category.Trim();
            if (trimmedCat.Length <= 50 && SafeQueryRegex.IsMatch(trimmedCat))
            {
                cleanCategory = WebUtility.HtmlEncode(trimmedCat);
            }
        }

        return Ok(_locationsService.GetCollectibles(cleanCategory));
    }

    /// <summary>
    /// GET /api/locations/vehicles → Catálogo completo de vehículos por concesionario y/o categoría.
    /// Soporta filtros opcionales: ?dealership=legendarymotorsport|superautos|warstock|docktease|elitastravel&category=super|sports|etc.
    /// </summary>
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

        string? cleanCategory = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCat = category.Trim();
            if (trimmedCat.Length <= 50 && SafeQueryRegex.IsMatch(trimmedCat))
            {
                cleanCategory = WebUtility.HtmlEncode(trimmedCat);
            }
        }

        return Ok(_locationsService.GetVehicles(cleanDealership, cleanCategory));
    }
}

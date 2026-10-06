using System.Net;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador especializado en el catálogo global de vehículos, concesionarios oficiales y talleres de GTA.
/// Ofrece filtrado por concesionario (Legendary Motorsport, Southern San Andreas Super Autos, Warstock Cache &amp; Carry, etc.)
/// y por categoría (Súper, Deportivos, Motos, Militares, Clásicos, etc.) e idioma ("es", "en", "tr", "ja", "ko", etc.).
/// </summary>
[ApiController]
[Route("api/vehicles")]
[EnableRateLimiting("data-policy")]
public class VehiclesController : ControllerBase
{
    private static readonly Regex SafeQueryRegex = new(@"^[a-zA-Z0-9_\-]+$", RegexOptions.Compiled);

    private readonly VehiclesService _service;

    public VehiclesController(VehiclesService service)
    {
        _service = service;
    }

    /// <summary>
    /// GET /api/vehicles → Catálogo completo de vehículos con filtrado opcional por concesionario, categoría e idioma.
    /// </summary>
    /// <param name="dealership">Nombre o identificador del concesionario (ej. "legendary-motorsport", "warstock").</param>
    /// <param name="category">Categoría o clase de vehículo (ej. "super", "sports", "motorcycles", "military").</param>
    /// <param name="lang">Código de idioma (ej. "es", "en", "tr", "ja", "ko", "hi", "ar", etc.).</param>
    /// <returns>Lista filtrada de vehículos con especificaciones (velocidad, aceleración, frenado, precio) y código HTTP 200 (OK).</returns>
    [HttpGet]
    public ActionResult<List<GtaVehicle>> GetVehicles(
        [FromQuery] string? dealership,
        [FromQuery] string? category,
        [FromQuery] string? lang)
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

        return Ok(_service.GetVehicles(cleanDealership, SanitizeCategory(category), lang));
    }

    private static string? SanitizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var trimmed = category.Trim();
        return (trimmed.Length <= 50 && SafeQueryRegex.IsMatch(trimmed)) ? WebUtility.HtmlEncode(trimmed) : null;
    }
}

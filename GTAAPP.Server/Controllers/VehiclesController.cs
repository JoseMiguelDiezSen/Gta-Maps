using System.Net;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador independiente para el catálogo de vehículos y concesionarios de Grand Theft Auto.
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
    /// GET /api/vehicles → Catálogo completo de vehículos por concesionario y/o categoría
    /// </summary>
    [HttpGet]
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

    private static string? SanitizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var trimmed = category.Trim();
        return (trimmed.Length <= 50 && SafeQueryRegex.IsMatch(trimmed)) ? WebUtility.HtmlEncode(trimmed) : null;
    }
}

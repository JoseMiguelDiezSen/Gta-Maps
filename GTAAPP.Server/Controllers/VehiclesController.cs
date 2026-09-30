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
/// y por categoría (Súper, Deportivos, Motos, Militares, Clásicos, etc.) con sanitización de parámetros contra inyecciones.
/// </summary>
[ApiController]
[Route("api/vehicles")]
[EnableRateLimiting("data-policy")]
public class VehiclesController : ControllerBase
{
    /// <summary>
    /// Expresión regular compilada para garantizar que los filtros solo contengan letras, números, guiones y guiones bajos.
    /// </summary>
    private static readonly Regex SafeQueryRegex = new(@"^[a-zA-Z0-9_\-]+$", RegexOptions.Compiled);

    /// <summary>
    /// Servicio de vehículos inyectado para gestionar la lectura y caché de vehículos desde el JSON en disco.
    /// </summary>
    private readonly VehiclesService _service;

    /// <summary>
    /// Inicializa una nueva instancia del controlador inyectando el servicio de vehículos.
    /// </summary>
    /// <param name="service">Instancia de VehiclesService.</param>
    public VehiclesController(VehiclesService service)
    {
        _service = service;
    }

    /// <summary>
    /// GET /api/vehicles → Catálogo completo de vehículos con filtrado opcional por concesionario y/o categoría.
    /// </summary>
    /// <param name="dealership">Nombre o identificador del concesionario (ej. "legendary-motorsport", "warstock").</param>
    /// <param name="category">Categoría o clase de vehículo (ej. "super", "sports", "motorcycles", "military").</param>
    /// <returns>Lista filtrada de vehículos con especificaciones (velocidad, aceleración, frenado, precio) y código HTTP 200 (OK).</returns>
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

    /// <summary>
    /// Sanitiza el parámetro de categoría validando longitud máxima de 50 caracteres y codificando caracteres especiales.
    /// </summary>
    /// <param name="category">Cadena de categoría recibida.</param>
    /// <returns>Categoría limpia o null si no es válida.</returns>
    private static string? SanitizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var trimmed = category.Trim();
        return (trimmed.Length <= 50 && SafeQueryRegex.IsMatch(trimmed)) ? WebUtility.HtmlEncode(trimmed) : null;
    }
}

using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial de la Wiki y Guía informativa para GTA V.
/// Proporciona endpoints para acceder a las secciones, categorías, artículos detallados y búsqueda.
/// Rutas admitidas: /api/gta5/guia, /api/gta5guia y /api/gta5/guide.
/// </summary>
[ApiController]
[Route("api/gta5/guia")]
[Route("api/gta5guia")]
[Route("api/gta5/guide")]
[EnableRateLimiting("data-policy")]
public class GTA5GuiaController : ControllerBase
{
    private readonly IGuiaService _guiaService;
    private readonly ILogger<GTA5GuiaController> _logger;

    public GTA5GuiaController(IGuiaService guiaService, ILogger<GTA5GuiaController> logger)
    {
        _guiaService = guiaService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/gta5/guia → Manifiesto general con todas las secciones y artículos de la guía de GTA V.
    /// </summary>
    [HttpGet]
    [HttpGet("manifest")]
    public ActionResult<GuiaManifest> GetManifest([FromQuery] string? lang = null)
    {
        var manifest = _guiaService.GetGuiaManifest("gta5", lang);
        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/guia/secciones → Listado de categorías temáticas de la guía.
    /// </summary>
    [HttpGet("secciones")]
    public ActionResult<List<GuiaSeccion>> GetSecciones([FromQuery] string? lang = null)
    {
        var secciones = _guiaService.GetSecciones("gta5", lang);
        return Ok(secciones);
    }

    /// <summary>
    /// GET /api/gta5/guia/articulos/{id} → Detalle completo de un artículo específico por ID o slug.
    /// </summary>
    [HttpGet("articulos/{id}")]
    public ActionResult<GuiaArticulo> GetArticulo(string id, [FromQuery] string? lang = null)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Length > 80)
        {
            return BadRequest(new { error = "Identificador de artículo no válido." });
        }

        var articulo = _guiaService.GetArticulo("gta5", id.Trim(), lang);
        if (articulo == null)
        {
            return NotFound(new { error = "Artículo no encontrado en la guía de GTA V." });
        }

        return Ok(articulo);
    }

    /// <summary>
    /// GET /api/gta5/guia/buscar?q=... → Búsqueda de artículos en la guía de GTA V.
    /// </summary>
    [HttpGet("buscar")]
    public ActionResult<List<GuiaArticuloResumen>> Buscar([FromQuery] string? q, [FromQuery] string? lang = null)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<GuiaArticuloResumen>());
        }

        var cleanQuery = q.Trim();
        if (cleanQuery.Length > 80)
        {
            cleanQuery = cleanQuery.Substring(0, 80);
        }

        var resultados = _guiaService.BuscarArticulos("gta5", cleanQuery, lang);
        return Ok(resultados);
    }
}

using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial de la Wiki y Guía informativa para GTA VI (Leonida / Vice City).
/// Proporciona endpoints para acceder a las secciones, categorías, artículos detallados y búsqueda.
/// Rutas admitidas: /api/gta6/guia, /api/gta6guia y /api/gta6/guide.
/// </summary>
[ApiController]
[Route("api/gta6/guia")]
[Route("api/gta6guia")]
[Route("api/gta6/guide")]
[EnableRateLimiting("data-policy")]
public class GTA6GuiaController : ControllerBase
{
    private readonly IGuiaService _guiaService;
    private readonly ILogger<GTA6GuiaController> _logger;

    public GTA6GuiaController(IGuiaService guiaService, ILogger<GTA6GuiaController> logger)
    {
        _guiaService = guiaService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/gta6/guia → Manifiesto general con todas las secciones y artículos de la guía de GTA VI.
    /// </summary>
    [HttpGet]
    [HttpGet("manifest")]
    public ActionResult<GuiaManifest> GetManifest()
    {
        var manifest = _guiaService.GetGuiaManifest("gta6");
        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta6/guia/secciones → Listado de categorías temáticas de la guía.
    /// </summary>
    [HttpGet("secciones")]
    public ActionResult<List<GuiaSeccion>> GetSecciones()
    {
        var secciones = _guiaService.GetSecciones("gta6");
        return Ok(secciones);
    }

    /// <summary>
    /// GET /api/gta6/guia/articulos/{id} → Detalle completo de un artículo específico por ID o slug.
    /// </summary>
    [HttpGet("articulos/{id}")]
    public ActionResult<GuiaArticulo> GetArticulo(string id)
    {
        var articulo = _guiaService.GetArticulo("gta6", id);
        if (articulo == null)
        {
            return NotFound(new { error = $"Artículo '{id}' no encontrado en la guía de GTA VI." });
        }

        return Ok(articulo);
    }

    /// <summary>
    /// GET /api/gta6/guia/buscar?q=... → Búsqueda de artículos en la guía de GTA VI.
    /// </summary>
    [HttpGet("buscar")]
    public ActionResult<List<GuiaArticuloResumen>> Buscar([FromQuery] string q)
    {
        var resultados = _guiaService.BuscarArticulos("gta6", q);
        return Ok(resultados);
    }
}

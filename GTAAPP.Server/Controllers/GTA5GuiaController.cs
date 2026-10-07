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
    public ActionResult<GuiaManifest> GetManifest()
    {
        var manifest = _guiaService.GetGuiaManifest("gta5");
        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/guia/secciones → Listado de categorías temáticas de la guía.
    /// </summary>
    [HttpGet("secciones")]
    public ActionResult<List<GuiaSeccion>> GetSecciones()
    {
        var secciones = _guiaService.GetSecciones("gta5");
        return Ok(secciones);
    }

    /// <summary>
    /// GET /api/gta5/guia/articulos/{id} → Detalle completo de un artículo específico por ID o slug.
    /// </summary>
    [HttpGet("articulos/{id}")]
    public ActionResult<GuiaArticulo> GetArticulo(string id)
    {
        var articulo = _guiaService.GetArticulo("gta5", id);
        if (articulo == null)
        {
            return NotFound(new { error = $"Artículo '{id}' no encontrado en la guía de GTA V." });
        }

        return Ok(articulo);
    }

    /// <summary>
    /// GET /api/gta5/guia/buscar?q=... → Búsqueda de artículos en la guía de GTA V.
    /// </summary>
    [HttpGet("buscar")]
    public ActionResult<List<GuiaArticuloResumen>> Buscar([FromQuery] string q)
    {
        var resultados = _guiaService.BuscarArticulos("gta5", q);
        return Ok(resultados);
    }
}

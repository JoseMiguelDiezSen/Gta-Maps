using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador preliminar para GTA VI Modo Historia (Campaña individual: Lucía y Jason en el estado de Leonida / Vice City).
/// Rutas admitidas: /api/gta6/historia, /api/gta6historia y /api/gta6 (por retrocompatibilidad).
/// Diseñado para incorporar progresivamente la cartografía, personajes y datos a medida que Rockstar Games publique información oficial.
/// </summary>
[ApiController]
[Route("api/gta6/historia")]
[Route("api/gta6historia")]
[Route("api/gta6")]
[EnableRateLimiting("data-policy")]
public class GTA6HistoriaController : ControllerBase
{
    /// <summary>
    /// Servicio de ubicaciones y datasets de GTA VI.
    /// </summary>
    private readonly LocationsService _locationsService;

    /// <summary>
    /// Inicializa una nueva instancia del controlador para el Modo Historia de GTA VI.
    /// </summary>
    /// <param name="locationsService">Servicio de datos inyectado.</param>
    public GTA6HistoriaController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta6/historia → Manifiesto oficial y estado de desarrollo de GTA VI Modo Historia.
    /// Devuelve el identificador del juego, su estado ("proximamente") y placeholder para el mapa cartográfico.
    /// </summary>
    /// <returns>Objeto GameManifest con el estado de disponibilidad del juego.</returns>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta6historia",
            Name = "GTA VI Modo Historia",
            Status = "proximamente",
            Map = null // El mapa oficial aún no ha sido publicado por Rockstar Games
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta6/historia/locations → Puntos de interés y ubicaciones confirmadas de GTA VI Historia
    /// (Vice City, Port Gellhorn, Ambrosia, Leonard County, cayos tropicales y zonas pantanosas).
    /// </summary>
    /// <param name="category">Filtro opcional por categoría.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Lista de ubicaciones preliminares confirmadas.</returns>
    [HttpGet("locations")]
    public ActionResult<List<LocationItem>> GetLocations([FromQuery] string? category, [FromQuery] string? lang)
    {
        // Preparado para servir datos cuando se incorporen filtraciones verificadas o confirmaciones de Rockstar
        return Ok(new List<LocationItem>());
    }

    /// <summary>
    /// GET /api/gta6/historia/characters → Personajes confirmados de GTA VI Modo Historia
    /// (Lucía Caminos, Jason, contactos del hampa de Vice City, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Lista de personajes conocidos de la campaña de Leonida.</returns>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetCharacters([FromQuery] string? lang)
    {
        return Ok(new List<LocationItem>());
    }
}

using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial para GTA Online (Multijugador masivo en Los Santos y el Condado de Blaine).
/// Expone endpoints para el catálogo de mapas, propiedades adquiribles, negocios de producción,
/// coleccionables semanales, golpes (heists), misiones de contacto y la isla de Cayo Perico.
/// Rutas admitidas: /api/gta5/online, /api/gta5online y /api/gta5 (por compatibilidad hacia atrás).
/// </summary>
[ApiController]
[Route("api/gta5/online")]
[Route("api/gta5online")]
[Route("api/gta5")]
[EnableRateLimiting("data-policy")]
public class GTA5OnlineController : ControllerBase
{
    /// <summary>
    /// Servicio central de datos inyectado para acceder a los datasets de GTA Online y su caché en memoria.
    /// </summary>
    private readonly LocationsService _locationsService;

    /// <summary>
    /// Constructor del controlador de GTA Online.
    /// </summary>
    /// <param name="locationsService">Instancia del servicio de gestión de datos y ubicaciones.</param>
    public GTA5OnlineController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta5/online → Manifiesto oficial de GTA Online.
    /// Devuelve las dimensiones máximas y las 4 capas de mapa base disponibles (Satélite, Carreteras, Atlas y Juego).
    /// </summary>
    /// <returns>Objeto GameManifest con metadatos del juego y configuración de capas para el visor interactivo.</returns>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta5online",
            Name = "GTA Online",
            Status = "activo",
            Map = new GameMapInfo
            {
                TilePath = "assets",
                ImageSize = 8192,
                MaxZoom = 7,
                MapTypes = new List<MapTypeInfo>
                {
                    new() { Id = "Satellite", Label = "Satelite" },
                    new() { Id = "Roadmap", Label = "Carreteras" },
                    new() { Id = "Atlas", Label = "Atlas" },
                    new() { Id = "Juego", Label = "Juego" }
                }
            }
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/online/properties → Catálogo de propiedades residenciales y garajes en GTA Online
    /// (apartamentos de lujo Eclipse Towers, áticos de casino, garajes de 10 y 50 plazas).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de propiedades con precios, capacidad de vehículos y coordenadas en el mapa.</returns>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetProperties([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetPropertiesOnly(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/businesses → Negocios y sedes operativas criminales de GTA Online
    /// (búnkeres de tráfico de armas, clubes de moteros, laboratorios de meta y cocaína, clubes nocturnos, agencias y desguace).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de negocios con requisitos de compra, ingresos potenciales y ubicaciones.</returns>
    [HttpGet("businesses")]
    public ActionResult<List<LocationItem>> GetBusinesses([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetBusinesses(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/collectibles → Coleccionables multijugador repartidos por Los Santos
    /// (54 naipes de baraja, 100 figuras de acción, 50 inhibidores de señal, 10 accesorios de película de Solomon, alijos ocultos).
    /// </summary>
    /// <param name="category">Filtro opcional por categoría concreta (ej. "playing-cards", "action-figures").</param>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de coleccionables con pistas detalladas de ubicación, recompensas en dinero/RP y coordenadas.</returns>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetCollectibles(category, lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/cayo-perico → Mapa táctico y puntos de interés de la isla caribeña de Cayo Perico.
    /// Incluye objetivos primarios (diamante rosa, estatua de pantera), botines secundarios (oro, cocaína, hierba),
    /// puntos de infiltración/escape (túnel de desagüe, pista de aterrizaje), torres de control y cámaras.
    /// </summary>
    /// <param name="category">Filtro opcional por tipo de objetivo o punto de interés.</param>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de puntos tácticos para planificar el golpe a la isla privada de El Rubio.</returns>
    [HttpGet("cayo-perico")]
    public ActionResult<List<LocationItem>> GetCayoPerico([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetCayoPericoLocations(category, lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/heists → Compendio completo de los 12 Golpes (Heists) de GTA Online
    /// (Golpes clásicos de Lester, Juicio Final/Doomsday, Golpe a The Diamond Casino, Cayo Perico y El Golpe al Kortz Center).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista completa de golpes con costes de preparación, botín potencial normal/difícil, enfoques y desafíos élite.</returns>
    [HttpGet("heists")]
    public ActionResult<List<HeistItem>> GetHeists([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetHeists(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/missions → Misiones cooperativas oficiales de GTA Online
    /// (misiones de contacto de Gerald, Simeon, Martin Madrazo, Lamar Lowriders, Última Jugada y asesinatos de Franklin).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de misiones de contacto con nivel mínimo requerido, número de jugadores y detalles.</returns>
    [HttpGet("missions")]
    public ActionResult<List<MissionItem>> GetMissions([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetOnlineMissions(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/mysteries → Archivo de misterios, sucesos paranormales y secretos de GTA Online
    /// (El Asesino de Los Santos, el Asesino de la Armada de Slashers, ovnis de Halloween, laboratorio Humane, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de misterios con pistas visuales, trasfondo de lore y mecánicas de desbloqueo.</returns>
    [HttpGet("mysteries")]
    public ActionResult<List<MysteryItem>> GetMysteries([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetMysteries(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/online/weapons → Arsenal oficial y catálogo de armamento de GTA Online
    /// (pistolas, subfusiles, rifles de asalto, escopetas, francotiradores, armas pesadas, cuerpo a cuerpo y arrojadizas).
    /// </summary>
    /// <param name="category">Filtro opcional por categoría concreta.</param>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de armas con estadísticas de daño, cadencia, precisión, accesorios y precios.</returns>
    [HttpGet("weapons")]
    public ActionResult<List<WeaponItem>> GetWeapons([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetWeapons(category, lang).ToList());
    }
}

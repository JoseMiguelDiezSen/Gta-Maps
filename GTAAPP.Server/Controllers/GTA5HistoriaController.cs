using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador oficial para GTA V Modo Historia (Campaña individual de Michael, Trevor y Franklin).
/// Proporciona endpoints específicos para acceder al manifiesto de mapas, misiones, propiedades,
/// contactos, misterios y coleccionables exclusivos de la campaña para un jugador.
/// Rutas admitidas: /api/gta5/historia, /api/gta5historia y /api/gta5/story (por retrocompatibilidad).
/// </summary>
[ApiController]
[Route("api/gta5/historia")]
[Route("api/gta5historia")]
[Route("api/gta5/story")]
[EnableRateLimiting("data-policy")]
public class GTA5HistoriaController : ControllerBase
{
    /// <summary>
    /// Servicio central de datos utilizado para consultar los archivos JSON de historia con caché en memoria.
    /// </summary>
    private readonly LocationsService _locationsService;

    /// <summary>
    /// Constructor del controlador que inyecta la instancia del servicio de ubicaciones y datasets.
    /// </summary>
    /// <param name="locationsService">Servicio de datos de GTA V.</param>
    public GTA5HistoriaController(LocationsService locationsService)
    {
        _locationsService = locationsService;
    }

    /// <summary>
    /// GET /api/gta5/historia → Manifiesto oficial de GTA V Modo Historia.
    /// Devuelve las dimensiones del mapa satélite y los estilos de capas disponibles (incluyendo Blueprint UV exclusivos).
    /// </summary>
    /// <returns>Objeto GameManifest con la configuración de mapas para Leaflet.</returns>
    [HttpGet]
    public ActionResult<GameManifest> GetManifest()
    {
        var manifest = new GameManifest
        {
            Id = "gta5historia",
            Name = "GTA V Modo Historia",
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
                    new() { Id = "Juego", Label = "Juego" },
                    new() { Id = "UV", Label = "Blueprint" },
                    new() { Id = "UV2", Label = "Blueprint Alt." }
                }
            }
        };

        return Ok(manifest);
    }

    /// <summary>
    /// GET /api/gta5/historia/properties → Propiedades y negocios comprables en Modo Historia
    /// (ej. Cine Doppler, Los Santos Customs de Franklin, Vanilla Unicorn, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de propiedades de la campaña con sus ingresos semanales y propietarios.</returns>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetStoryProperties([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryProperties(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/characters → Personajes y contactos de la trama de la campaña
    /// (Michael De Santa, Trevor Philips, Franklin Clinton, Lester Crest, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de personajes con sus biografías, zonas habituales y retratos.</returns>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetStoryCharacters([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryCharacters(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/services → Servicios públicos y comercios habilitados en Modo Historia
    /// (hospitales de reaparición, comisarías, tiendas de armas Ammu-Nation, 24/7, peluquerías).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de puntos de servicio esenciales en el mapa de San Andreas.</returns>
    [HttpGet("services")]
    public ActionResult<List<LocationItem>> GetStoryServices([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryServices(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/vehicle-shops → Talleres de modificación de vehículos en Modo Historia
    /// (sucursales de Los Santos Customs y Garaje de Hao).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de talleres disponibles para tunear coches con Michael, Franklin o Trevor.</returns>
    [HttpGet("vehicle-shops")]
    public ActionResult<List<LocationItem>> GetStoryVehicleShops([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryVehicleShops(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/strange-places → Lugares extraños y easter eggs de la campaña
    /// (Mural del Monte Chiliad, OVNIs al 100%, campamento Altruista, mina abandonada, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de puntos misteriosos, insólitos y de interés sobrenatural.</returns>
    [HttpGet("strange-places")]
    public ActionResult<List<LocationItem>> GetStoryStrangePlaces([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryStrangePlaces(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/fauna → Hábitats de fauna salvaje y desafío fotográfico de Los Santos
    /// (ciervos, pumas, jabalíes, coyotes, tiburones y plantas de peyote).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de localizaciones recomendadas para avistamiento y fotografía animal.</returns>
    [HttpGet("fauna")]
    public ActionResult<List<LocationItem>> GetStoryFauna([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryFauna(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/activities → Pasatiempos, minijuegos y deportes de la campaña
    /// (tenis, campo de golf, triatlones, carreras urbanas, cines y galería de tiro).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de actividades recreativas disponibles para los 3 protagonistas.</returns>
    [HttpGet("activities")]
    public ActionResult<List<LocationItem>> GetStoryActivities([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryActivities(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/collectibles → Coleccionables necesarios para el 100% de la campaña
    /// (piezas de la nave espacial, cartas de Leonora Johnson, residuos nucleares, mosaicos de monos).
    /// </summary>
    /// <param name="category">Filtro opcional por categoría específica de coleccionable.</param>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de coleccionables con sus pistas, recompensas y coordenadas.</returns>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetStoryCollectibles([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryCollectibles(category, lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/missions → Las 69 misiones principales de la campaña de GTA V
    /// (desde el Prólogo en Ludendorff hasta la Gran Puntuación final).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista ordenada de misiones principales con requisitos para la medalla de oro.</returns>
    [HttpGet("missions")]
    public ActionResult<List<MissionItem>> GetStoryMissions([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryMissions(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/strangers → Misiones secundarias de Extraños y Locos (Strangers and Freaks)
    /// (misiones de Mary-Ann, Barry, Beverly, Cletus, Dom, etc.).
    /// Rutas: /api/gta5/historia/strangers y /api/gta5/historia/strangers-and-freaks.
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de misiones secundarias con indicación de si cuentan para el 100%.</returns>
    [HttpGet("strangers")]
    [HttpGet("strangers-and-freaks")]
    public ActionResult<List<StrangerMissionItem>> GetStoryStrangerMissions([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryStrangerMissions(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/mysteries → Archivo de misterios y leyendas urbanas del Modo Historia
    /// (Asesino del Infinito 8, Fantasma de Mount Gordo, Bigfoot en Predator, OVNIs a las 3 AM...).
    /// </summary>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de misterios con pistas, lore detallado, horarios y puntos de observación.</returns>
    [HttpGet("mysteries")]
    public ActionResult<List<MysteryItem>> GetStoryMysteries([FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryMysteries(lang).ToList());
    }

    /// <summary>
    /// GET /api/gta5/historia/weapons → Arsenal y catálogo de armas de Ammu-Nation del Modo Historia
    /// (pistolas, subfusiles, rifles de asalto, escopetas, francotiradores, armas pesadas, cuerpo a cuerpo y arrojadizas).
    /// </summary>
    /// <param name="category">Filtro opcional por categoría de arma.</param>
    /// <param name="lang">Código de idioma opcional ("es" o "en"). Por defecto "es".</param>
    /// <returns>Lista de armas con estadísticas, precios y accesorios.</returns>
    [HttpGet("weapons")]
    public ActionResult<List<WeaponItem>> GetStoryWeapons([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_locationsService.GetStoryWeapons(category, lang).ToList());
    }
}

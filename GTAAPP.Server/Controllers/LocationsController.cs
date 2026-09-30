using System.Net;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Controllers;

/// <summary>
/// Controlador principal de ubicaciones con correspondencia 1 a 1 para cada categoría
/// del panel de control del mapa interactivo de GTA V (GTA Online y Modo Historia).
/// Proporciona endpoints optimizados con soporte multi-idioma, limitación de peticiones (rate limiting)
/// y sanitización estricta de parámetros de entrada para máxima seguridad.
/// </summary>
[ApiController]
[Route("api/locations")]
[EnableRateLimiting("data-policy")]
public class LocationsController : ControllerBase
{
    /// <summary>
    /// Expresión regular compilada para sanitizar parámetros de consulta (query strings).
    /// Solo permite caracteres alfanuméricos, guiones y guiones bajos para prevenir ataques de inyección o traversal.
    /// </summary>
    private static readonly Regex SafeQueryRegex = new(@"^[a-zA-Z0-9_\-]+$", RegexOptions.Compiled);

    /// <summary>
    /// Instancia del servicio de datos inyectado que administra la caché en memoria y la lectura de los JSONs.
    /// </summary>
    private readonly LocationsService _service;

    /// <summary>
    /// Constructor del controlador que recibe el servicio de ubicaciones mediante inyección de dependencias.
    /// </summary>
    /// <param name="service">Servicio singleton o scoped encargado de la carga y caché de datos.</param>
    public LocationsController(LocationsService service)
    {
        _service = service;
    }

    /// <summary>
    /// GET /api/locations → Agregación de todas las categorías del mapa.
    /// Devuelve la lista combinada de puntos de interés según el modo de juego seleccionado (Online o Historia).
    /// </summary>
    /// <param name="gameMode">Modo de juego ("story" para Historia, "online" o null para GTA Online).</param>
    /// <param name="category">Filtro opcional para obtener solo una categoría concreta (ej. "Negocios", "Propiedades").</param>
    /// <param name="lang">Código de idioma opcional ("es", "en"). Si se omite, se usa "es" por defecto.</param>
    /// <returns>Lista completa o filtrada de ubicaciones con código HTTP 200 (OK).</returns>
    [HttpGet("")]
    public ActionResult<List<LocationItem>> GetAllLocations([FromQuery] string? gameMode, [FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_service.GetAllLocations(SanitizeGameMode(gameMode), SanitizeCategory(category), SanitizeLang(lang)));
    }

    /// <summary>
    /// GET /api/locations/properties → 1. Propiedades (apartamentos, mansiones, garajes, oficinas de CEO, búnkeres...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para los nombres y descripciones.</param>
    /// <returns>Lista de propiedades inmobiliarias en GTA Online con código HTTP 200 (OK).</returns>
    [HttpGet("properties")]
    public ActionResult<List<LocationItem>> GetProperties([FromQuery] string? lang) => Ok(_service.GetPropertiesOnly(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/businesses → 2. Negocios (clubes nocturnos, arcades, agencias, laboratorios de moteros...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para los textos descriptivos.</param>
    /// <returns>Lista de negocios criminales y operativos con código HTTP 200 (OK).</returns>
    [HttpGet("businesses")]
    public ActionResult<List<LocationItem>> GetBusinesses([FromQuery] string? lang) => Ok(_service.GetBusinesses(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/services → 3. Servicios (comisarías, hospitales, bomberos, tiendas 24/7, Ammu-Nation, barberías...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para nombres de establecimientos.</param>
    /// <returns>Lista de servicios esenciales y tiendas públicas con código HTTP 200 (OK).</returns>
    [HttpGet("services")]
    public ActionResult<List<LocationItem>> GetServices([FromQuery] string? lang) => Ok(_service.GetServices(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/vehicle-shops → 4. Talleres y Concesionarios (Los Santos Customs, Benny's, Garaje Hao, Car Meet, Luxury Autos...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para las descripciones de tiendas.</param>
    /// <returns>Lista de concesionarios y talleres de modificación de vehículos con código HTTP 200 (OK).</returns>
    [HttpGet("vehicle-shops")]
    public ActionResult<List<LocationItem>> GetVehicleShops([FromQuery] string? lang) => Ok(_service.GetVehicleShops(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/roleplay-jobs → 5. Trabajos Roleplay (Pizza This, taxista, basurero, bombero, carretillero...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para los puestos de trabajo.</param>
    /// <returns>Lista de trabajos y puntos de actividad comunitaria con código HTTP 200 (OK).</returns>
    [HttpGet("roleplay-jobs")]
    public ActionResult<List<LocationItem>> GetRoleplayJobs([FromQuery] string? lang) => Ok(_service.GetRoleplayJobs(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/characters → 6. Personajes y Contactos clave (Lester Crest, Franklin, Trevor, Michael, Lamar...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para las biografías y nombres.</param>
    /// <returns>Lista de ubicaciones de personajes en el mapa con código HTTP 200 (OK).</returns>
    [HttpGet("characters")]
    public ActionResult<List<LocationItem>> GetCharacters([FromQuery] string? lang) => Ok(_service.GetCharacters(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/fauna → 7. Fauna y Vida Salvaje (12 Hábitats de animales silvestres y fotografía en San Andreas).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para los nombres de especies y hábitats.</param>
    /// <returns>Lista de puntos de avistamiento de fauna con código HTTP 200 (OK).</returns>
    [HttpGet("fauna")]
    public ActionResult<List<LocationItem>> GetFauna([FromQuery] string? lang) => Ok(_service.GetFauna(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/activities → 8. Actividades y Deportes (tenis, golf, dardos, paracaidismo, cines, ferias...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para las descripciones de actividades.</param>
    /// <returns>Lista de minijuegos y pasatiempos recreativos con código HTTP 200 (OK).</returns>
    [HttpGet("activities")]
    public ActionResult<List<LocationItem>> GetActivities([FromQuery] string? lang) => Ok(_service.GetActivities(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/strange-places → 9. Lugares extraños (Mural de Chiliad, OVNIs, naufragios submarinos, túneles...).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en") para los nombres de los lugares misteriosos.</param>
    /// <returns>Lista de puntos insólitos, easter eggs y misterios visuales con código HTTP 200 (OK).</returns>
    [HttpGet("strange-places")]
    public ActionResult<List<LocationItem>> GetStrangePlaces([FromQuery] string? lang) => Ok(_service.GetStrangePlaces(SanitizeLang(lang)));

    /// <summary>
    /// GET /api/locations/collectibles → 10. Coleccionables (GTA Online o Modo Historia).
    /// Permite obtener tanto los coleccionables de campaña (piezas de nave, cartas de asesinato) como los del multijugador (figuras, naipes).
    /// </summary>
    /// <param name="category">Filtro opcional para una subcategoría concreta de coleccionable.</param>
    /// <param name="lang">Código de idioma ("es" o "en") para las instrucciones y pistas.</param>
    /// <param name="gameMode">Modo de juego: "story" para Modo Historia o null/"online" para GTA Online.</param>
    /// <returns>Lista de coleccionables filtrada según el modo y categoría solicitada con código HTTP 200 (OK).</returns>
    [HttpGet("collectibles")]
    public ActionResult<List<CollectibleItem>> GetCollectibles([FromQuery] string? category, [FromQuery] string? lang, [FromQuery] string? gameMode)
    {
        var mode = SanitizeGameMode(gameMode);
        if (string.Equals(mode, "story", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(_service.GetStoryCollectibles(SanitizeCategory(category), SanitizeLang(lang)));
        }
        return Ok(_service.GetCollectibles(SanitizeCategory(category), SanitizeLang(lang)));
    }

    /// <summary>
    /// GET /api/locations/cayo-perico → Puntos de interés y ubicaciones de la isla de Cayo Perico.
    /// Incluye objetivos secundarios, torres de vigilancia, puntos de infiltración, vehículos y cámaras de seguridad.
    /// </summary>
    /// <param name="category">Categoría específica dentro de la isla (ej. "primary-target", "poi", "infiltration").</param>
    /// <param name="lang">Código de idioma ("es" o "en") para los nombres de los puntos tácticos.</param>
    /// <returns>Lista de ubicaciones estratégicas de la isla de Cayo Perico con código HTTP 200 (OK).</returns>
    [HttpGet("cayo-perico")]
    public ActionResult<List<LocationItem>> GetCayoPerico([FromQuery] string? category, [FromQuery] string? lang)
    {
        return Ok(_service.GetCayoPericoLocations(SanitizeCategory(category), SanitizeLang(lang)));
    }

    /// <summary>
    /// Sanitiza y valida el parámetro de modo de juego asegurando que solo acepte valores legítimos ('story' u 'online').
    /// </summary>
    /// <param name="gameMode">Cadena de texto recibida por query string.</param>
    /// <returns>El modo en minúsculas si es válido ('story' u 'online'), o null si no lo es.</returns>
    private static string? SanitizeGameMode(string? gameMode)
    {
        if (string.IsNullOrWhiteSpace(gameMode)) return null;
        var mode = gameMode.Trim().ToLowerInvariant();
        return mode is "story" or "online" ? mode : null;
    }

    /// <summary>
    /// Sanitiza el nombre de categoría recibido por query string comprobando longitud máxima,
    /// caracteres seguros (alfanuméricos y guiones) y aplicando codificación HTML para prevenir ataques XSS.
    /// </summary>
    /// <param name="category">Categoría enviada por el cliente.</param>
    /// <returns>Categoría limpia y segura para consultar, o null si contiene caracteres inválidos.</returns>
    private static string? SanitizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var trimmed = category.Trim();
        return (trimmed.Length <= 50 && SafeQueryRegex.IsMatch(trimmed)) ? WebUtility.HtmlEncode(trimmed) : null;
    }

    /// <summary>
    /// Sanitiza el código de idioma asegurando una longitud máxima de 10 caracteres alfanuméricos en minúsculas.
    /// </summary>
    /// <param name="lang">Código de idioma recibido (ej. 'es', 'en').</param>
    /// <returns>Código de idioma normalizado y seguro, o null si no cumple los requisitos.</returns>
    private static string? SanitizeLang(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return null;
        var trimmed = lang.Trim().ToLowerInvariant();
        return (trimmed.Length <= 10 && SafeQueryRegex.IsMatch(trimmed)) ? trimmed : null;
    }
}

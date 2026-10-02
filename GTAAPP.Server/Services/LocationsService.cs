using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado que gestiona en memoria y con sistema de caché inteligente cada uno de los datasets
/// estructurados bajo wwwroot/data/{juego}/{modo}/{idioma}/... tanto para GTA 5 Modo Historia como para GTA Online.
/// </summary>
public class LocationsService
{
    /// <summary>
    /// Entorno de alojamiento web utilizado para resolver las rutas físicas absolutas hacia la carpeta wwwroot.
    /// </summary>
    private readonly IWebHostEnvironment _env;
    
    /// <summary>
    /// Instancia de registro para capturar errores de deserialización y avisos de carga de datasets.
    /// </summary>
    private readonly ILogger<LocationsService> _logger;

    /// <summary>
    /// Objeto de sincronización de subprocesos (thread-safe) para coordinar el acceso y escritura en la caché en memoria.
    /// </summary>
    private readonly object _lock = new();
   
    /// <summary>
    /// Diccionario de caché en memoria que almacena en tuplas (fecha de modificación, objeto deserializado)
    /// para evitar lecturas de disco innecesarias mientras el archivo fuente no haya cambiado.
    /// </summary>
    private readonly Dictionary<string, (DateTime lastModified, object data)> _cache = new();

    /// <summary>
    /// Inicializa una nueva instancia del servicio inyectando el entorno de alojamiento y el servicio de logging.
    /// </summary>
    /// <param name="env">Instancia del entorno web para acceder a las rutas de wwwroot.</param>
    /// <param name="logger">Instancia de ILogger para el seguimiento de eventos.</param>
    public LocationsService(IWebHostEnvironment env, ILogger<LocationsService> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Resuelve la ruta física en disco de un dataset JSON aplicando una estrategia de fallback jerárquica:
    /// 1. Idioma solicitado (ej. data/{game}/{mode}/{lang}/{fileName}).
    /// 2. Fallback a español (data/{game}/{mode}/es/{fileName}).
    /// 3. Fallback retrocompatible raíz (data/{fileName}).
    /// </summary>
    /// <param name="game">Identificador del juego (ej. "gta5").</param>
    /// <param name="mode">Modo de juego ("online" o "historia").</param>
    /// <param name="fileName">Nombre del archivo JSON (ej. "mysteries.json").</param>
    /// <param name="lang">Código de idioma opcional ("es", "en", etc.). Por defecto "es".</param>
    /// <returns>Ruta física absoluta resuelta en disco.</returns>
    private string GetFilePath(string game, string mode, string fileName, string? lang = null)
    {
        var basePath = _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
        var activeLang = string.IsNullOrWhiteSpace(lang) ? "es" : lang.Trim().ToLowerInvariant();

        // 1. Buscar en la estructura jerárquica con el idioma solicitado: data/{game}/{mode}/{activeLang}/{fileName}
        var targetPath = Path.Combine(basePath, "data", game, mode, activeLang, fileName);
        if (File.Exists(targetPath))
        {
            return targetPath;
        }

        // 2. Fallback a español si no existe la traducción: data/{game}/{mode}/es/{fileName}
        var esPath = Path.Combine(basePath, "data", game, mode, "es", fileName);
        if (File.Exists(esPath))
        {
            return esPath;
        }

        // 3. Fallback retrocompatible por si acaso
        var legacyPath = Path.Combine(basePath, "data", fileName);
        if (File.Exists(legacyPath))
        {
            return legacyPath;
        }

        return targetPath;
    }

    // ==========================================
    // GTA 5 ONLINE (carpeta: data/gta5/online/{lang}/)
    // ==========================================
    
    /// <summary>
    /// Obtiene el catálogo de propiedades inmobiliarias residenciales y garajes adquiribles en GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de elementos de ubicación correspondientes a propiedades.</returns>
    public IReadOnlyList<LocationItem> GetPropertiesOnly(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "properties.json", lang);
   
    /// <summary>
    /// Obtiene las sedes operativas y negocios criminales (búnkeres, clubes nocturnos, hangares, etc.) de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de elementos de ubicación correspondientes a negocios.</returns>
    public IReadOnlyList<LocationItem> GetBusinesses(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "businesses.json", lang);
    
    /// <summary>
    /// Obtiene los puntos de interés de servicios públicos y comerciales (comisarías, hospitales, tiendas, etc.) de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de elementos de ubicación correspondientes a servicios.</returns>
    public IReadOnlyList<LocationItem> GetServices(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "services.json", lang);
    
    /// <summary>
    /// Obtiene las tiendas físicas y concesionarios de vehículos (Luxury Autos, PDM, talleres Benny's, etc.) de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de concesionarios y talleres en el mapa.</returns>
    public IReadOnlyList<LocationItem> GetVehicleShops(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "vehicle_shops.json", lang);
    
    /// <summary>
    /// Obtiene los puntos y actividades orientadas al roleplay y trabajos comunitarios en GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de ubicaciones de trabajos de roleplay.</returns>
    public IReadOnlyList<LocationItem> GetRoleplayJobs(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "roleplay_jobs.json", lang);
    
    /// <summary>
    /// Obtiene las ubicaciones de personajes y contactos clave del multijugador de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de ubicaciones de personajes en el mapa.</returns>
    public IReadOnlyList<LocationItem> GetCharacters(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "characters.json", lang);
    
    /// <summary>
    /// Obtiene los puntos de avistamiento y fotografía de fauna silvestre en el entorno de San Andreas para GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de zonas de fauna silvestre.</returns>
    public IReadOnlyList<LocationItem> GetFauna(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "fauna.json", lang);

    /// <summary>
    /// Obtiene las actividades recreativas y minijuegos disponibles en el mapa de GTA Online (golf, tenis, cine, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de actividades recreativas.</returns>
    public IReadOnlyList<LocationItem> GetActivities(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "activities.json", lang);

    /// <summary>
    /// Obtiene localizaciones curiosas, lugares insólitos y puntos de interés atípicos en el mapa de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de lugares extraños.</returns>
    public IReadOnlyList<LocationItem> GetStrangePlaces(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "strange_places.json", lang);
    
    /// <summary>
    /// Obtiene el registro completo de golpes cooperativos (Heists) de GTA Online, incluyendo Apartamentos, Doomsday, Casino, Cayo Perico, Cluckin' Bell y Kortz Center.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección estructurada de golpes con misiones preparatorias, botines y desafíos de élite.</returns>
    public IReadOnlyList<HeistItem> GetHeists(string? lang = null) => LoadJsonFile<HeistItem>("gta5", "online", "heists.json", lang);
    
    /// <summary>
    /// Obtiene el catálogo de misiones de contacto, contratos y operaciones del multijugador de GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de misiones cooperativas y de contacto.</returns>
    public IReadOnlyList<MissionItem> GetOnlineMissions(string? lang = null) => LoadJsonFile<MissionItem>("gta5", "online", "missions.json", lang);
        
    /// <summary>
    /// Obtiene el catálogo de misterios, fenómenos paranormales y leyendas urbanas activos y descubribles en GTA Online.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de misterios con coordenadas, lore, mecánicas y pistas.</returns>
    public IReadOnlyList<MysteryItem> GetMysteries(string? lang = null) => LoadJsonFile<MysteryItem>("gta5", "online", "mysteries.json", lang);

    /// <summary>
    /// Obtiene el arsenal oficial de armas de GTA Online con filtrado opcional por categoría.
    /// </summary>
    /// <param name="category">Categoría de arma opcional.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de armas de GTA Online.</returns>
    public IReadOnlyList<WeaponItem> GetWeapons(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<WeaponItem>("gta5", "online", "weapons.json", lang);
        if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase)) return list;
        return list.Where(w => w.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Obtiene la lista de coleccionables de GTA Online (figuras de acción, naipes, alijos submarinos, etc.), con filtrado opcional por categoría.
    /// </summary>
    /// <param name="category">Categoría específica del coleccionable o null para obtener todos.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de coleccionables filtrados.</returns>
    public IReadOnlyList<CollectibleItem> GetCollectibles(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<CollectibleItem>("gta5", "online", "collectibles.json", lang);
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Obtiene las localizaciones, puntos de interés, puntos de infiltración y objetivos secundarios en la isla de Cayo Perico.
    /// </summary>
    /// <param name="category">Categoría específica de Cayo Perico o null para obtener todos.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de puntos de Cayo Perico.</returns>
    public IReadOnlyList<LocationItem> GetCayoPericoLocations(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<LocationItem>("gta5", "online", "cayo_perico.json", lang);
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    // ==========================================
    // GTA 5 MODO HISTORIA (carpeta: data/gta5/historia/{lang}/)
    // ==========================================

    /// <summary>
    /// Obtiene las propiedades comerciales, refugios y garajes adquiribles por los protagonistas en el Modo Historia de GTA V.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de propiedades del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryProperties(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "properties.json", lang);
    
    /// <summary>
    /// Obtiene las residencias y ubicaciones clave de los personajes principales y secundarios del Modo Historia.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de personajes del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryCharacters(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "characters.json", lang);
    
    /// <summary>
    /// Obtiene los servicios públicos, comercios y puntos de abastecimiento disponibles en el Modo Historia.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de servicios del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryServices(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "services.json", lang);
    
    /// <summary>
    /// Obtiene los talleres de modificación Los Santos Customs y tiendas de vehículos del Modo Historia.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de talleres y tiendas de vehículos del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryVehicleShops(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "vehicle_shops.json", lang);
    
    /// <summary>
    /// Obtiene las zonas de fauna silvestre, puestos de caza y animales fotografiables del Modo Historia.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de zonas de fauna del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryFauna(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "fauna.json", lang);
    
    /// <summary>
    /// Obtiene las actividades recreativas, deportes y pasatiempos disponibles en el Modo Historia (dardos, golf, triatlones, etc.).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de actividades del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryActivities(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "activities.json", lang);
    
    /// <summary>
    /// Obtiene los lugares extraños, secretos del mapa y puntos insólitos exclusivos o destacados del Modo Historia.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de lugares extraños del Modo Historia.</returns>
    public IReadOnlyList<LocationItem> GetStoryStrangePlaces(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "strange_places.json", lang);
    
    /// <summary>
    /// Obtiene el listado completo de misiones principales de la campaña narrativa de GTA V.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de misiones de la historia principal con objetivos de medalla de oro.</returns>
    public IReadOnlyList<MissionItem> GetStoryMissions(string? lang = null) => LoadJsonFile<MissionItem>("gta5", "historia", "missions.json", lang);
    
    /// <summary>
    /// Obtiene las 66 misiones secundarias de Extraños y Locos (Strangers and Freaks) estructuradas por serie y personaje.
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección completa de misiones de Extraños y Locos.</returns>
    public IReadOnlyList<StrangerMissionItem> GetStoryStrangerMissions(string? lang = null) => LoadJsonFile<StrangerMissionItem>("gta5", "historia", "strangers_and_freaks.json", lang);
    
    /// <summary>
    /// Obtiene el catálogo de misterios, apariciones y leyendas urbanas activos y descubribles en el Modo Historia (incluyendo exclusivos como los OVNIs del 100%, el perro del cementerio y el Sasquatch).
    /// </summary>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de misterios del Modo Historia.</returns>
    public IReadOnlyList<MysteryItem> GetStoryMysteries(string? lang = null) => LoadJsonFile<MysteryItem>("gta5", "historia", "mysteries.json", lang);

    /// <summary>
    /// Obtiene el arsenal oficial de armas del Modo Historia de GTA V con filtrado opcional por categoría.
    /// </summary>
    /// <param name="category">Categoría de arma opcional.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de armas del Modo Historia.</returns>
    public IReadOnlyList<WeaponItem> GetStoryWeapons(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<WeaponItem>("gta5", "historia", "weapons.json", lang);
        if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase)) return list;
        return list.Where(w => w.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Obtiene la colección de coleccionables del Modo Historia (partes de nave espacial, cartas de Leonora Johnson, residuos tóxicos, mosaicos de monos, etc.), con filtrado opcional por categoría.
    /// </summary>
    /// <param name="category">Categoría específica del coleccionable o null para obtener todos.</param>
    /// <param name="lang">Código de idioma ("es" o "en").</param>
    /// <returns>Colección de coleccionables del Modo Historia filtrados.</returns>
    public IReadOnlyList<CollectibleItem> GetStoryCollectibles(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<CollectibleItem>("gta5", "historia", "collectibles.json", lang);
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Agregador general que unifica y consolida todas las ubicaciones y puntos de interés del mapa según el modo de juego ("story" u "online") y categoría solicitada.
    /// </summary>
    /// <param name="gameMode">Modo de juego: "story" para Modo Historia o null/vacío para GTA Online.</param>
    /// <param name="category">Categoría específica para filtrar los resultados, o null para obtener la totalidad.</param>
    /// <param name="lang">Código de idioma para las etiquetas descriptivas.</param>
    /// <returns>Colección unificada y filtrada de puntos de localización.</returns>
    public IReadOnlyList<LocationItem> GetAllLocations(string? gameMode = null, string? category = null, string? lang = null)
    {
        var all = new List<LocationItem>();

        // Si el cliente pide el modo historia ("story"), agrupamos únicamente las ubicaciones de la campaña individual
        if (string.Equals(gameMode, "story", StringComparison.OrdinalIgnoreCase))
        {
            all.AddRange(GetStoryProperties(lang));
            all.AddRange(GetStoryServices(lang));
            all.AddRange(GetStoryVehicleShops(lang));
            all.AddRange(GetStoryCharacters(lang));
            all.AddRange(GetStoryFauna(lang));
            all.AddRange(GetStoryActivities(lang));
            all.AddRange(GetStoryStrangePlaces(lang));
        }
        else // Por defecto, consolidamos todas las ubicaciones y actividades de GTA Online
        {
            all.AddRange(GetPropertiesOnly(lang));
            all.AddRange(GetBusinesses(lang));
            all.AddRange(GetServices(lang));
            all.AddRange(GetVehicleShops(lang));
            all.AddRange(GetRoleplayJobs(lang));
            all.AddRange(GetCharacters(lang));
            all.AddRange(GetFauna(lang));
            all.AddRange(GetActivities(lang));
            all.AddRange(GetStrangePlaces(lang));
        }

        IEnumerable<LocationItem> result = all;

        // Si el usuario especificó una categoría concreta (ej. "Negocios" o "Propiedades"), filtramos la lista
        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    /// <summary>
    /// Método genérico interno que lee, deserializa y almacena en caché en memoria los datasets JSON ubicados en wwwroot/data.
    /// Incorpora invalidación automática comparando la marca de tiempo de última escritura del archivo (LastWriteTimeUtc).
    /// </summary>
    /// <typeparam name="T">Tipo del modelo en el que se deserializarán los elementos de la lista.</typeparam>
    /// <param name="game">Juego ("gta5").</param>
    /// <param name="mode">Modo ("online" o "historia").</param>
    /// <param name="fileName">Nombre del archivo físico (ej. "heists.json").</param>
    /// <param name="lang">Idioma solicitado ("es", "en").</param>
    /// <returns>Colección deserializada de solo lectura del tipo solicitado.</returns>
    private IReadOnlyList<T> LoadJsonFile<T>(string game, string mode, string fileName, string? lang = null)
    {
        // 1. Buscamos la ruta del archivo físico en disco según el idioma
        var fullPath = GetFilePath(game, mode, fileName, lang);
        if (!File.Exists(fullPath))
        {
            return [];
        }

        // 2. Creamos una clave única para identificar este dataset en el diccionario de caché
        var activeLang = string.IsNullOrWhiteSpace(lang) ? "es" : lang.Trim().ToLowerInvariant();
        var cacheKey = $"{game}/{mode}/{activeLang}/{fileName}";
        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        // 3. Usamos bloqueo 'lock' para evitar problemas de concurrencia si varios usuarios piden el mismo archivo a la vez
        lock (_lock)
        {
            // Si ya está cargado en memoria y el archivo en disco no se ha modificado, devolvemos la copia en caché (super rápido)
            if (_cache.TryGetValue(cacheKey, out var cachedEntry) && cachedEntry.lastModified >= lastWrite)
            {
                return (IReadOnlyList<T>)cachedEntry.data;
            }

            try
            {
                // Si no está en caché o el archivo cambió en disco, leemos el JSON directamente
                using var stream = File.OpenRead(fullPath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var list = JsonSerializer.Deserialize<List<T>>(stream, options) ?? [];
                
                // Guardamos en la memoria caché la lista deserializada y la fecha del archivo
                _cache[cacheKey] = (lastWrite, list);
                return list;
            }
            catch (Exception ex)
            {
                // Si ocurre algún fallo de lectura o formato, lo registramos en los logs y devolvemos lista vacía para no romper la app
                _logger.LogError(ex, "Error al cargar dataset {Game}/{Mode}/{Lang}/{FileName}", game, mode, activeLang, fileName);
                return [];
            }
        }
    }
}

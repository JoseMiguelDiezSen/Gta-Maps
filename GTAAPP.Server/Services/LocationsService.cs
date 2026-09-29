using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado que gestiona en memoria y con caché cada uno de los datasets
/// estructurados bajo wwwroot/data/{juego}/{modo}/{idioma}/...
/// </summary>
public class LocationsService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LocationsService> _logger;

    private readonly object _lock = new();
    private readonly Dictionary<string, (DateTime lastModified, object data)> _cache = new();

    public LocationsService(IWebHostEnvironment env, ILogger<LocationsService> logger)
    {
        _env = env;
        _logger = logger;
    }

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
    public IReadOnlyList<LocationItem> GetPropertiesOnly(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "properties.json", lang);
    public IReadOnlyList<LocationItem> GetBusinesses(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "businesses.json", lang);
    public IReadOnlyList<LocationItem> GetServices(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "services.json", lang);
    public IReadOnlyList<LocationItem> GetVehicleShops(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "vehicle_shops.json", lang);
    public IReadOnlyList<LocationItem> GetRoleplayJobs(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "roleplay_jobs.json", lang);
    public IReadOnlyList<LocationItem> GetCharacters(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "characters.json", lang);
    public IReadOnlyList<LocationItem> GetFauna(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "fauna.json", lang);
    public IReadOnlyList<LocationItem> GetActivities(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "activities.json", lang);
    public IReadOnlyList<LocationItem> GetStrangePlaces(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "online", "strange_places.json", lang);
    public IReadOnlyList<HeistItem> GetHeists(string? lang = null) => LoadJsonFile<HeistItem>("gta5", "online", "heists.json", lang);
    public IReadOnlyList<MissionItem> GetOnlineMissions(string? lang = null) => LoadJsonFile<MissionItem>("gta5", "online", "missions.json", lang);

    public IReadOnlyList<CollectibleItem> GetCollectibles(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<CollectibleItem>("gta5", "online", "collectibles.json", lang);
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    // ==========================================
    // GTA 5 MODO HISTORIA (carpeta: data/gta5/historia/{lang}/)
    // ==========================================
    public IReadOnlyList<LocationItem> GetStoryProperties(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "properties.json", lang);
    public IReadOnlyList<LocationItem> GetStoryCharacters(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "characters.json", lang);
    public IReadOnlyList<LocationItem> GetStoryServices(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "services.json", lang);
    public IReadOnlyList<LocationItem> GetStoryVehicleShops(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "vehicle_shops.json", lang);
    public IReadOnlyList<LocationItem> GetStoryFauna(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "fauna.json", lang);
    public IReadOnlyList<LocationItem> GetStoryActivities(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "activities.json", lang);
    public IReadOnlyList<LocationItem> GetStoryStrangePlaces(string? lang = null) => LoadJsonFile<LocationItem>("gta5", "historia", "strange_places.json", lang);
    public IReadOnlyList<MissionItem> GetStoryMissions(string? lang = null) => LoadJsonFile<MissionItem>("gta5", "historia", "missions.json", lang);
    public IReadOnlyList<StrangerMissionItem> GetStoryStrangerMissions(string? lang = null) => LoadJsonFile<StrangerMissionItem>("gta5", "historia", "strangers_and_freaks.json", lang);

    public IReadOnlyList<CollectibleItem> GetStoryCollectibles(string? category = null, string? lang = null)
    {
        var list = LoadJsonFile<CollectibleItem>("gta5", "historia", "collectibles.json", lang);
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    // ==========================================
    // AGREGACIÓN DE UBICACIONES POR MODO E IDIOMA
    // ==========================================
    public IReadOnlyList<LocationItem> GetAllLocations(string? gameMode = null, string? category = null, string? lang = null)
    {
        var all = new List<LocationItem>();

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
        else
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

        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    private IReadOnlyList<T> LoadJsonFile<T>(string game, string mode, string fileName, string? lang = null)
    {
        var fullPath = GetFilePath(game, mode, fileName, lang);
        if (!File.Exists(fullPath))
        {
            return [];
        }

        var activeLang = string.IsNullOrWhiteSpace(lang) ? "es" : lang.Trim().ToLowerInvariant();
        var cacheKey = $"{game}/{mode}/{activeLang}/{fileName}";
        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        lock (_lock)
        {
            if (_cache.TryGetValue(cacheKey, out var cachedEntry) && cachedEntry.lastModified >= lastWrite)
            {
                return (IReadOnlyList<T>)cachedEntry.data;
            }

            try
            {
                using var stream = File.OpenRead(fullPath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var list = JsonSerializer.Deserialize<List<T>>(stream, options) ?? [];
                _cache[cacheKey] = (lastWrite, list);
                return list;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar dataset {Game}/{Mode}/{Lang}/{FileName}", game, mode, activeLang, fileName);
                return [];
            }
        }
    }
}

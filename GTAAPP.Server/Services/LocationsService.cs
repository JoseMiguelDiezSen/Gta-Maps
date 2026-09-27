using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado que gestiona en memoria y con caché cada uno de los datasets
/// correspondientes a las categorías del panel de control de GTA V.
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

    private string DataPath => Path.Combine(_env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot"), "data");

    // 1. PROPIEDADES
    public IReadOnlyList<LocationItem> GetPropertiesOnly() => LoadJsonFile<LocationItem>("properties.json");

    // 2. NEGOCIOS
    public IReadOnlyList<LocationItem> GetBusinesses() => LoadJsonFile<LocationItem>("businesses.json");

    // 3. SERVICIOS
    public IReadOnlyList<LocationItem> GetServices() => LoadJsonFile<LocationItem>("services.json");

    // 4. VEHÍCULOS / TALLERES
    public IReadOnlyList<LocationItem> GetVehicleShops() => LoadJsonFile<LocationItem>("vehicle_shops.json");

    // 5. TRABAJOS ROLEPLAY
    public IReadOnlyList<LocationItem> GetRoleplayJobs() => LoadJsonFile<LocationItem>("roleplay_jobs.json");

    // 6. PERSONAJES Y CONTACTOS
    public IReadOnlyList<LocationItem> GetCharacters() => LoadJsonFile<LocationItem>("characters.json");

    // 7. FAUNA Y VIDA SALVAJE
    public IReadOnlyList<LocationItem> GetFauna() => LoadJsonFile<LocationItem>("fauna.json");

    // 8. ACTIVIDADES Y DEPORTES
    public IReadOnlyList<LocationItem> GetActivities() => LoadJsonFile<LocationItem>("activities.json");

    // 9. LUGARES EXTRAÑOS
    public IReadOnlyList<LocationItem> GetStrangePlaces() => LoadJsonFile<LocationItem>("strange_places.json");

    // 10. COLECCIONABLES
    public IReadOnlyList<CollectibleItem> GetCollectibles(string? category = null)
    {
        var list = LoadJsonFile<CollectibleItem>("collectibles.json");
        if (string.IsNullOrWhiteSpace(category)) return list;
        return list.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    // AGREGACIÓN DE TODAS LAS UBICACIONES DEL MAPA
    public IReadOnlyList<LocationItem> GetAllLocations(string? gameMode = null, string? category = null)
    {
        var all = new List<LocationItem>();
        all.AddRange(GetPropertiesOnly());
        all.AddRange(GetBusinesses());
        all.AddRange(GetServices());
        all.AddRange(GetVehicleShops());
        all.AddRange(GetRoleplayJobs());
        all.AddRange(GetCharacters());
        all.AddRange(GetFauna());
        all.AddRange(GetActivities());
        all.AddRange(GetStrangePlaces());

        IEnumerable<LocationItem> result = all;

        if (!string.IsNullOrWhiteSpace(gameMode))
        {
            result = result.Where(p =>
                p.GameMode.Equals(gameMode, StringComparison.OrdinalIgnoreCase) ||
                p.GameMode.Equals("both", StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    private IReadOnlyList<T> LoadJsonFile<T>(string fileName)
    {
        var fullPath = Path.Combine(DataPath, fileName);
        if (!File.Exists(fullPath))
        {
            return [];
        }

        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        lock (_lock)
        {
            if (_cache.TryGetValue(fileName, out var cachedEntry) && cachedEntry.lastModified >= lastWrite)
            {
                return (IReadOnlyList<T>)cachedEntry.data;
            }

            try
            {
                using var stream = File.OpenRead(fullPath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var list = JsonSerializer.Deserialize<List<T>>(stream, options) ?? [];
                _cache[fileName] = (lastWrite, list);
                return list;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar dataset: {FileName}", fileName);
                return [];
            }
        }
    }
}

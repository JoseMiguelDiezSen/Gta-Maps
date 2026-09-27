using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para cargar y cachear en memoria los datasets de ubicaciones,
/// coleccionables y vehículos de GTA V / GTA Online desde los archivos JSON categorizados.
/// </summary>
public class LocationsService
{
    private static readonly string[] LocationFiles =
    [
        "properties.json",
        "businesses.json",
        "services.json",
        "vehicle_shops.json",
        "roleplay_jobs.json",
        "characters.json",
        "fauna.json",
        "activities.json",
        "strange_places.json"
    ];

    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LocationsService> _logger;

    private readonly object _lockLocations = new();
    private readonly object _lockCollectibles = new();
    private readonly object _lockVehicles = new();

    private IReadOnlyList<PropertyLocation>? _locations;
    private DateTime _locationsLastLoaded = DateTime.MinValue;

    private IReadOnlyList<CollectibleItem>? _collectibles;
    private DateTime _collectiblesLastLoaded = DateTime.MinValue;

    private IReadOnlyList<GtaVehicle>? _vehicles;
    private DateTime _vehiclesLastLoaded = DateTime.MinValue;

    public LocationsService(IWebHostEnvironment env, ILogger<LocationsService> logger)
    {
        _env = env;
        _logger = logger;
    }

    private string DataPath => Path.Combine(_env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot"), "data");

    /// <summary>
    /// Obtiene las ubicaciones unificadas (propiedades, negocios, servicios, fauna, etc.),
    /// agregando todos los archivos modulares de categorías.
    /// </summary>
    public IReadOnlyList<PropertyLocation> GetProperties(string? gameMode = null, string? category = null)
    {
        EnsureLocationsLoaded();

        IEnumerable<PropertyLocation> result = _locations ?? [];

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

    /// <summary>
    /// Obtiene los coleccionables exclusivos de GTA Online.
    /// </summary>
    public IReadOnlyList<CollectibleItem> GetCollectibles(string? category = null)
    {
        EnsureCollectiblesLoaded();

        IEnumerable<CollectibleItem> result = _collectibles ?? [];

        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    /// <summary>
    /// Obtiene el catálogo de vehículos por concesionario y/o categoría.
    /// </summary>
    public IReadOnlyList<GtaVehicle> GetVehicles(string? dealership = null, string? category = null)
    {
        EnsureVehiclesLoaded();

        IEnumerable<GtaVehicle> result = _vehicles ?? [];

        if (!string.IsNullOrWhiteSpace(dealership))
        {
            result = result.Where(v => v.Dealership.Equals(dealership, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(v => v.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    private void EnsureLocationsLoaded()
    {
        var dataDir = DataPath;
        var maxWriteTime = DateTime.MinValue;

        foreach (var file in LocationFiles)
        {
            var full = Path.Combine(dataDir, file);
            if (File.Exists(full))
            {
                var wt = File.GetLastWriteTimeUtc(full);
                if (wt > maxWriteTime) maxWriteTime = wt;
            }
        }

        if (_locations is not null && maxWriteTime <= _locationsLastLoaded)
        {
            return;
        }

        lock (_lockLocations)
        {
            if (_locations is not null && maxWriteTime <= _locationsLastLoaded)
            {
                return;
            }

            var aggregated = new List<PropertyLocation>();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var file in LocationFiles)
            {
                var full = Path.Combine(dataDir, file);
                if (!File.Exists(full)) continue;

                try
                {
                    using var stream = File.OpenRead(full);
                    var items = JsonSerializer.Deserialize<List<PropertyLocation>>(stream, options);
                    if (items is { Count: > 0 })
                    {
                        aggregated.AddRange(items);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error deserializando archivo de ubicaciones: {FileName}", file);
                }
            }

            _locations = aggregated;
            _locationsLastLoaded = maxWriteTime > DateTime.MinValue ? maxWriteTime : DateTime.UtcNow;
            _logger.LogInformation("Cargadas {Count} ubicaciones combinadas desde {Files} archivos de categorías.", aggregated.Count, LocationFiles.Length);
        }
    }

    private void EnsureCollectiblesLoaded()
    {
        var full = Path.Combine(DataPath, "collectibles.json");
        if (!File.Exists(full))
        {
            _collectibles ??= [];
            return;
        }

        var lastWrite = File.GetLastWriteTimeUtc(full);
        if (_collectibles is not null && lastWrite <= _collectiblesLastLoaded)
        {
            return;
        }

        lock (_lockCollectibles)
        {
            if (_collectibles is not null && lastWrite <= _collectiblesLastLoaded)
            {
                return;
            }

            try
            {
                using var stream = File.OpenRead(full);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                _collectibles = JsonSerializer.Deserialize<List<CollectibleItem>>(stream, options) ?? [];
                _collectiblesLastLoaded = lastWrite;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar collectibles.json");
                _collectibles ??= [];
            }
        }
    }

    private void EnsureVehiclesLoaded()
    {
        var full = Path.Combine(DataPath, "vehicles.json");
        if (!File.Exists(full))
        {
            _vehicles ??= [];
            return;
        }

        var lastWrite = File.GetLastWriteTimeUtc(full);
        if (_vehicles is not null && lastWrite <= _vehiclesLastLoaded)
        {
            return;
        }

        lock (_lockVehicles)
        {
            if (_vehicles is not null && lastWrite <= _vehiclesLastLoaded)
            {
                return;
            }

            try
            {
                using var stream = File.OpenRead(full);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                _vehicles = JsonSerializer.Deserialize<List<GtaVehicle>>(stream, options) ?? [];
                _vehiclesLastLoaded = lastWrite;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar vehicles.json");
                _vehicles ??= [];
            }
        }
    }
}

using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio independiente para la gestión y consulta del catálogo de vehículos y concesionarios.
/// Lee desde wwwroot/data/gta5/online/{lang}/vehicles.json.
/// </summary>
public class VehiclesService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<VehiclesService> _logger;

    private readonly object _lock = new();
    private (DateTime lastModified, IReadOnlyList<GtaVehicle> data) _cache;

    public VehiclesService(IWebHostEnvironment env, ILogger<VehiclesService> logger)
    {
        _env = env;
        _logger = logger;
    }

    private string BaseWebRoot => _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

    public IReadOnlyList<GtaVehicle> GetVehicles(string? dealership = null, string? category = null)
    {
        var list = LoadVehicles();
        IEnumerable<GtaVehicle> result = list;

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

    private IReadOnlyList<GtaVehicle> LoadVehicles()
    {
        // 1. Nueva ruta jerárquica
        var hierPath = Path.Combine(BaseWebRoot, "data", "gta5", "online", "es", "vehicles.json");
        // 2. Fallback retrocompatible
        var fullPath = File.Exists(hierPath) ? hierPath : Path.Combine(BaseWebRoot, "data", "vehicles.json");

        if (!File.Exists(fullPath))
        {
            return [];
        }

        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        lock (_lock)
        {
            if (_cache.data != null && _cache.lastModified >= lastWrite)
            {
                return _cache.data;
            }

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                using var stream = File.OpenRead(fullPath);
                var list = JsonSerializer.Deserialize<List<GtaVehicle>>(stream, options) ?? [];
                _cache = (lastWrite, list);
                return list;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar dataset de vehículos desde {Path}", fullPath);
                return [];
            }
        }
    }
}

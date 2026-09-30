using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio independiente para la gestión y consulta del catálogo completo de vehículos y concesionarios de GTA.
/// Carga en memoria y cachea de forma segura el dataset de vehículos ubicado en wwwroot/data/gta5/online/es/vehicles.json
/// (con fallback a la ruta raíz legacy wwwroot/data/vehicles.json) e invalida la caché automáticamente si el archivo se edita en disco.
/// </summary>
public class VehiclesService
{
    /// <summary>
    /// Entorno de alojamiento para resolver rutas físicas hacia wwwroot.
    /// </summary>
    private readonly IWebHostEnvironment _env;

    /// <summary>
    /// Instancia de registro para capturar errores de lectura o deserialización del catálogo de vehículos.
    /// </summary>
    private readonly ILogger<VehiclesService> _logger;

    /// <summary>
    /// Objeto de sincronización (lock) para garantizar acceso seguro entre múltiples hilos concurrentes.
    /// </summary>
    private readonly object _lock = new();

    /// <summary>
    /// Tupla en memoria que guarda la última fecha de modificación del archivo físico y la lista de vehículos deserializada.
    /// </summary>
    private (DateTime lastModified, IReadOnlyList<GtaVehicle> data) _cache;

    /// <summary>
    /// Inicializa una nueva instancia de VehiclesService inyectando el entorno web y el servicio de logging.
    /// </summary>
    /// <param name="env">Instancia de IWebHostEnvironment.</param>
    /// <param name="logger">Instancia de ILogger.</param>
    public VehiclesService(IWebHostEnvironment env, ILogger<VehiclesService> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene la ruta física base hacia el directorio wwwroot, con respaldo en AppContext.BaseDirectory si es nula.
    /// </summary>
    private string BaseWebRoot => _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

    /// <summary>
    /// Obtiene la lista completa de vehículos con filtros opcionales por concesionario oficial y por categoría.
    /// </summary>
    /// <param name="dealership">Concesionario de venta (ej. "legendary-motorsport", "warstock", "southern-san-andreas").</param>
    /// <param name="category">Categoría del vehículo (ej. "super", "sports", "motorcycles", "military").</param>
    /// <returns>Lista inmutable de vehículos filtrados.</returns>
    public IReadOnlyList<GtaVehicle> GetVehicles(string? dealership = null, string? category = null)
    {
        var list = LoadVehicles();
        IEnumerable<GtaVehicle> result = list;

        // Filtrado por concesionario si se especificó en la petición
        if (!string.IsNullOrWhiteSpace(dealership))
        {
            result = result.Where(v => v.Dealership.Equals(dealership, StringComparison.OrdinalIgnoreCase));
        }

        // Filtrado por clase o categoría de vehículo si se especificó
        if (!string.IsNullOrWhiteSpace(category))
        {
            result = result.Where(v => v.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    /// <summary>
    /// Lee, deserializa y mantiene en caché la lista de vehículos desde el archivo JSON físico.
    /// Solo vuelve a leer del disco si el archivo ha sido modificado desde la última carga.
    /// </summary>
    /// <returns>Colección inmutable de todos los vehículos disponibles en el dataset.</returns>
    private IReadOnlyList<GtaVehicle> LoadVehicles()
    {
        // 1. Ruta jerárquica oficial en español
        var hierPath = Path.Combine(BaseWebRoot, "data", "gta5", "online", "es", "vehicles.json");
        // 2. Ruta de fallback retrocompatible por si el archivo está en la raíz de data
        var fullPath = File.Exists(hierPath) ? hierPath : Path.Combine(BaseWebRoot, "data", "vehicles.json");

        if (!File.Exists(fullPath))
        {
            return [];
        }

        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        // Bloqueo thread-safe para lectura y refresco de caché
        lock (_lock)
        {
            // Si la caché es válida y el archivo en disco no ha cambiado, devolvemos la memoria de inmediato
            if (_cache.data != null && _cache.lastModified >= lastWrite)
            {
                return _cache.data;
            }

            try
            {
                // Si ha cambiado o es la primera llamada, deserializamos el archivo JSON
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

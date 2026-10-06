using System.Text.Json;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio independiente para la gestión y consulta del catálogo completo de vehículos y concesionarios de GTA.
/// Carga en memoria y cachea de forma segura el dataset de vehículos ubicado en wwwroot/data/gta5/online/{lang}/vehicles.json
/// (con fallback a "es" y a la ruta raíz legacy wwwroot/data/vehicles.json) e invalida la caché automáticamente si el archivo se edita en disco.
/// </summary>
public class VehiclesService
{
    private static readonly Regex SafeLangRegex = new(@"^[a-z]{2,5}$", RegexOptions.Compiled);

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
    /// Diccionario en memoria que guarda la última fecha de modificación del archivo físico y la lista de vehículos deserializada por idioma.
    /// </summary>
    private readonly Dictionary<string, (DateTime lastModified, IReadOnlyList<GtaVehicle> data)> _cache = new();

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
    /// Obtiene la lista completa de vehículos con filtros opcionales por concesionario oficial, categoría e idioma.
    /// </summary>
    /// <param name="dealership">Concesionario de venta (ej. "legendary-motorsport", "warstock", "superautos").</param>
    /// <param name="category">Categoría del vehículo (ej. "super", "sports", "motorcycles", "military").</param>
    /// <param name="lang">Código de idioma (ej. "es", "en", "tr", "ja", "ko", etc.). Por defecto "es".</param>
    /// <returns>Lista inmutable de vehículos filtrados.</returns>
    public IReadOnlyList<GtaVehicle> GetVehicles(string? dealership = null, string? category = null, string? lang = null)
    {
        var activeLang = "es";
        if (!string.IsNullOrWhiteSpace(lang))
        {
            var cleaned = lang.Trim().ToLowerInvariant();
            if (SafeLangRegex.IsMatch(cleaned))
            {
                activeLang = cleaned;
            }
        }

        var list = LoadVehicles(activeLang);
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
    /// Lee, deserializa y mantiene en caché la lista de vehículos desde el archivo JSON físico para el idioma indicado.
    /// Solo vuelve a leer del disco si el archivo ha sido modificado desde la última carga.
    /// </summary>
    /// <param name="lang">Idioma a cargar.</param>
    /// <returns>Colección inmutable de todos los vehículos disponibles en el dataset.</returns>
    private IReadOnlyList<GtaVehicle> LoadVehicles(string lang)
    {
        // 1. Ruta jerárquica con el idioma solicitado: data/gta5/online/{lang}/vehicles.json
        var hierPath = Path.Combine(BaseWebRoot, "data", "gta5", "online", lang, "vehicles.json");
        // 2. Ruta fallback en español: data/gta5/online/es/vehicles.json
        var esPath = Path.Combine(BaseWebRoot, "data", "gta5", "online", "es", "vehicles.json");
        // 3. Ruta fallback retrocompatible en la raíz
        var legacyPath = Path.Combine(BaseWebRoot, "data", "vehicles.json");

        var fullPath = File.Exists(hierPath) ? hierPath : (File.Exists(esPath) ? esPath : legacyPath);

        if (!File.Exists(fullPath))
        {
            return [];
        }

        var lastWrite = File.GetLastWriteTimeUtc(fullPath);

        // Bloqueo thread-safe para lectura y refresco de caché
        lock (_lock)
        {
            // Si la caché es válida para este idioma y el archivo en disco no ha cambiado, devolvemos la memoria de inmediato
            if (_cache.TryGetValue(lang, out var cached) && cached.data != null && cached.lastModified >= lastWrite)
            {
                return cached.data;
            }

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                using var stream = File.OpenRead(fullPath);
                var list = JsonSerializer.Deserialize<List<GtaVehicle>>(stream, options) ?? [];
                _cache[lang] = (lastWrite, list);
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

using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para proveer contenido, secciones y artículos de la Wiki / Guía de GTA 5 y GTA 6.
/// Carga los datos de GTA 5 dinámicamente desde los archivos JSON estructurados en wwwroot/data/gta5/guia/.
/// </summary>
public interface IGuiaService
{
    GuiaManifest GetGuiaManifest(string juegoId);
    List<GuiaSeccion> GetSecciones(string juegoId);
    GuiaArticulo? GetArticulo(string juegoId, string articuloId);
    List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query);
}

public class GuiaService : IGuiaService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<GuiaService> _logger;
    private readonly Dictionary<string, GuiaManifest> _manifiestos;
    private readonly Dictionary<string, List<GuiaArticulo>> _articulos;
    private readonly object _lock = new();

    public GuiaService(IWebHostEnvironment env, ILogger<GuiaService> logger)
    {
        _env = env;
        _logger = logger;
        _manifiestos = new Dictionary<string, GuiaManifest>(StringComparer.OrdinalIgnoreCase);
        _articulos = new Dictionary<string, List<GuiaArticulo>>(StringComparer.OrdinalIgnoreCase);

        CargarGta5DesdeJson();
        CargarGta6DesdeJson();
        // CargarGta6Online
    }

    private string BaseWebRoot => _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

    private void CargarGta5DesdeJson()
    {
        var articulosGta5 = new List<GuiaArticulo>();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        var offlineDir = Path.Combine(BaseWebRoot, "data", "gta5", "guia", "offline");
        if (Directory.Exists(offlineDir))
        {
            var files = Directory.GetFiles(offlineDir, "*.json");
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith("["))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, options);
                        if (list != null) articulosGta5.AddRange(list);
                    }
                    else if (json.TrimStart().StartsWith("{"))
                    {
                        var single = JsonSerializer.Deserialize<GuiaArticulo>(json, options);
                        if (single != null && !string.IsNullOrEmpty(single.Id)) articulosGta5.Add(single);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al cargar archivo de guía {File}", f);
                }
            }
        }

        var onlineDir = Path.Combine(BaseWebRoot, "data", "gta5", "guia", "online");
        if (Directory.Exists(onlineDir))
        {
            var files = Directory.GetFiles(onlineDir, "*.json", SearchOption.AllDirectories);
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith("["))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, options);
                        if (list != null) articulosGta5.AddRange(list);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al cargar archivo de guía online {File}", f);
                }
            }
        }

        _articulos["gta5"] = articulosGta5;

        _manifiestos["gta5"] = new GuiaManifest
        {
            Id = "gta5",
            Titulo = "Guía Oficial GTA V",
            Descripcion = "Guía enciclopédica completa del Modo Historia y GTA Online.",
            Secciones = new List<GuiaSeccion>
            {
                new() { Id = "historia-100", Titulo = "Modo Historia & 100%", Icono = "trophy", Descripcion = "Guía paso a paso de la campaña, requisitos del 100% y decisiones clave.", Orden = 1 },
                new() { Id = "personajes", Titulo = "Protagonistas & Facciones", Icono = "users", Descripcion = "Biografías, habilidades especiales y misiones personales.", Orden = 2 },
                new() { Id = "armas", Titulo = "Armas", Icono = "crosshairs", Descripcion = "Catálogo de armamento del modo historia y online.", Orden = 3 },
                new() { Id = "negocios-economia", Titulo = "Mercado Bursátil", Icono = "trending-up", Descripcion = "Guía de finanzas y especulación bursátil.", Orden = 4 },
                new() { Id = "secretos-misterios", Titulo = "Secretos & Misterios", Icono = "eye", Descripcion = "Archivo de enigmas, sucesos paranormales y mitos.", Orden = 5 },
                new() { Id = "trucos", Titulo = "Códigos & Trucos", Icono = "gamepad", Descripcion = "Trucos de salud, armas, nivel de búsqueda y vehículos.", Orden = 6 }
            }
        };
    }

    public GuiaManifest GetGuiaManifest(string juegoId)
    {
        if (_manifiestos.TryGetValue(juegoId, out var manifest))
        {
            return manifest;
        }

        return new GuiaManifest
        {
            Id = juegoId,
            Titulo = $"Guía {juegoId.ToUpper()}",
            Descripcion = "Guía completa en construcción."
        };
    }

    public List<GuiaSeccion> GetSecciones(string juegoId)
    {
        if (_manifiestos.TryGetValue(juegoId, out var manifest))
        {
            return manifest.Secciones;
        }

        return new List<GuiaSeccion>();
    }

    public GuiaArticulo? GetArticulo(string juegoId, string articuloId)
    {
        if (_articulos.TryGetValue(juegoId, out var lista))
        {
            return lista.FirstOrDefault(a => 
                a.Id.Equals(articuloId, StringComparison.OrdinalIgnoreCase) || 
                (a.Slug != null && a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase)));
        }

        return null;
    }

    public List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query)
    {
        if (string.IsNullOrWhiteSpace(query) || !_articulos.TryGetValue(juegoId, out var lista))
        {
            return new List<GuiaArticuloResumen>();
        }

        var q = query.Trim().ToLowerInvariant();
        return lista
            .Where(a => (a.Titulo != null && a.Titulo.ToLowerInvariant().Contains(q)) || 
                        (a.Subtitulo != null && a.Subtitulo.ToLowerInvariant().Contains(q)) || 
                        (a.Tags != null && a.Tags.Any(t => t.ToLowerInvariant().Contains(q))))
            .Select(a => new GuiaArticuloResumen
            {
                Id = a.Id,
                Slug = a.Slug,
                Titulo = a.Titulo,
                Subtitulo = a.Subtitulo,
                Categoria = a.Categoria,
                Badge = a.Badge,
                TiempoLecturaMinutos = a.TiempoLecturaMinutos
            })
            .ToList();
    }

    private void CargarGta6DesdeJson()
    {
        var articulosGta6 = new List<GuiaArticulo>();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        var offlineDir = Path.Combine(BaseWebRoot, "data", "gta6", "guia", "offline");
        if (Directory.Exists(offlineDir))
        {
            var files = Directory.GetFiles(offlineDir, "*.json");
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith("["))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, options);
                        if (list != null) articulosGta6.AddRange(list);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al cargar archivo de guía GTA6 {File}", f);
                }
            }
        }

        var onlineDir = Path.Combine(BaseWebRoot, "data", "gta6", "guia", "online");
        if (Directory.Exists(onlineDir))
        {
            var files = Directory.GetFiles(onlineDir, "*.json");
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith("["))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, options);
                        if (list != null) articulosGta6.AddRange(list);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al cargar archivo de guía online GTA6 {File}", f);
                }
            }
        }

        _articulos["gta6"] = articulosGta6;

        _manifiestos["gta6"] = new GuiaManifest
        {
            Id = "gta6",
            Juego = "Grand Theft Auto VI",
            Titulo = "Base de Datos & Guía Oficial de GTA VI",
            Descripcion = "Toda la información confirmada, regiones de Leonida, análisis de tráileres, personajes y mecánicas de la próxima obra maestra de Rockstar Games.",
            BannerUrl = "assets/gta6-banner.jpg",
            Secciones = new List<GuiaSeccion>
            {
                new() { Id = "prologo", Titulo = "Prólogo & Leonida", Icono = "book-open", Descripcion = "Introducción al Estado de Leonida, Vice City y perfiles de los protagonistas.", Orden = 0 },
                new() { Id = "misiones", Titulo = "Misiones & Golpes", Icono = "crosshairs", Descripcion = "Campañas criminales y atracos en Leonida.", Orden = 1 },
                new() { Id = "vehiculos", Titulo = "Vehículos", Icono = "car", Descripcion = "Catálogo de vehículos, deportivos, embarcaciones y aeronaves.", Orden = 2 }
            }
        };
    }
}
using System.Text.Json;
using System.Text.RegularExpressions;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para proveer contenido, secciones y artículos de la Wiki / Guía de GTA 5 y GTA 6.
/// Carga los datos de GTA 5 dinámicamente desde los archivos JSON estructurados en wwwroot/data/gta5/guia/.
/// </summary>
public interface IGuiaService
{
    GuiaManifest GetGuiaManifest(string juegoId, string? lang = null);
    List<GuiaSeccion> GetSecciones(string juegoId, string? lang = null);
    GuiaArticulo? GetArticulo(string juegoId, string articuloId, string? lang = null);
    List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query, string? lang = null);
}

public class GuiaService : IGuiaService
{
    private static readonly Regex SafeLangRegex = new(@"^[a-z]{2,5}$", RegexOptions.Compiled, TimeSpan.FromSeconds(1));
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
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

        CargarGta5DesdeJson("es");
        CargarGta6DesdeJson();
        // CargarGta6Online
    }

    private string BaseWebRoot => _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

    private static string ResolveLang(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return "es";
        var cleaned = lang.Trim().ToLowerInvariant();
        return SafeLangRegex.IsMatch(cleaned) ? cleaned : "es";
    }

    private static GuiaArticulo MergeArticulo(GuiaArticulo baseArt, GuiaArticulo trans)
    {
        return new GuiaArticulo
        {
            Id = baseArt.Id,
            Slug = string.IsNullOrWhiteSpace(trans.Slug) ? baseArt.Slug : trans.Slug,
            Titulo = string.IsNullOrWhiteSpace(trans.Titulo) ? baseArt.Titulo : trans.Titulo,
            Subtitulo = string.IsNullOrWhiteSpace(trans.Subtitulo) ? baseArt.Subtitulo : trans.Subtitulo,
            Categoria = string.IsNullOrWhiteSpace(trans.Categoria) ? baseArt.Categoria : trans.Categoria,
            Badge = string.IsNullOrWhiteSpace(trans.Badge) ? baseArt.Badge : trans.Badge,
            TiempoLecturaMinutos = trans.TiempoLecturaMinutos > 0 ? trans.TiempoLecturaMinutos : baseArt.TiempoLecturaMinutos,
            ContenidoMarkdown = string.IsNullOrWhiteSpace(trans.ContenidoMarkdown) ? baseArt.ContenidoMarkdown : trans.ContenidoMarkdown,
            Imagen = string.IsNullOrWhiteSpace(trans.Imagen) ? baseArt.Imagen : trans.Imagen,
            ImagenPrincipalUrl = string.IsNullOrWhiteSpace(trans.ImagenPrincipalUrl) ? baseArt.ImagenPrincipalUrl : trans.ImagenPrincipalUrl,
            Sinopsis = string.IsNullOrWhiteSpace(trans.Sinopsis) ? baseArt.Sinopsis : trans.Sinopsis,
            Recompensa = string.IsNullOrWhiteSpace(trans.Recompensa) ? baseArt.Recompensa : trans.Recompensa,
            DesbloqueadoTras = string.IsNullOrWhiteSpace(trans.DesbloqueadoTras) ? baseArt.DesbloqueadoTras : trans.DesbloqueadoTras,
            Contacto = string.IsNullOrWhiteSpace(trans.Contacto) ? baseArt.Contacto : trans.Contacto,
            Ubicacion = string.IsNullOrWhiteSpace(trans.Ubicacion) ? baseArt.Ubicacion : trans.Ubicacion,
            Protagonistas = (trans.Protagonistas != null && trans.Protagonistas.Count > 0) ? trans.Protagonistas : baseArt.Protagonistas,
            RequisitosOro = (trans.RequisitosOro != null && trans.RequisitosOro.Count > 0) ? trans.RequisitosOro : baseArt.RequisitosOro,
            DetallesTecnicos = trans.DetallesTecnicos ?? baseArt.DetallesTecnicos,
            Tags = (trans.Tags != null && trans.Tags.Count > 0) ? trans.Tags : baseArt.Tags,
            UltimaActualizacion = trans.UltimaActualizacion != default ? trans.UltimaActualizacion : baseArt.UltimaActualizacion,
            Relacionados = (trans.Relacionados != null && trans.Relacionados.Count > 0) ? trans.Relacionados : baseArt.Relacionados
        };
    }

    private void EnsureGta5Cargado(string lang)
    {
        var key = $"gta5:{lang}";
        if (_articulos.ContainsKey(key) && _manifiestos.ContainsKey(key))
        {
            return;
        }

        lock (_lock)
        {
            if (_articulos.ContainsKey(key) && _manifiestos.ContainsKey(key))
            {
                return;
            }

            if (!_articulos.ContainsKey("gta5:es"))
            {
                CargarGta5DesdeJson("es");
            }

            if (!lang.Equals("es", StringComparison.OrdinalIgnoreCase))
            {
                CargarGta5DesdeJson(lang);
            }
        }
    }

    private void CargarGta5DesdeJson(string lang = "es")
    {
        Func<GuiaArticulo, GuiaArticuloResumen> toResumen = a => new GuiaArticuloResumen
        {
            Id = a.Id,
            Slug = a.Slug,
            Titulo = a.Titulo,
            Subtitulo = a.Subtitulo,
            Categoria = a.Categoria,
            Badge = a.Badge,
            TiempoLecturaMinutos = a.TiempoLecturaMinutos
        };

        if (lang.Equals("es", StringComparison.OrdinalIgnoreCase))
        {
            var articulosGta5 = new List<GuiaArticulo>();
            var offlineDir = Path.Combine(BaseWebRoot, "data", "gta5", "guia", "offline");
            if (Directory.Exists(offlineDir))
            {
                var files = Directory.GetFiles(offlineDir, "*.json");
                foreach (var f in files)
                {
                    try
                    {
                        var json = File.ReadAllText(f);
                        if (json.TrimStart().StartsWith('['))
                        {
                            var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, JsonOptions);
                            if (list != null) articulosGta5.AddRange(list);
                        }
                        else if (json.TrimStart().StartsWith('{'))
                        {
                            var single = JsonSerializer.Deserialize<GuiaArticulo>(json, JsonOptions);
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
                        if (json.TrimStart().StartsWith('['))
                        {
                            var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, JsonOptions);
                            if (list != null) articulosGta5.AddRange(list);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error al cargar archivo de guía online {File}", f);
                    }
                }
            }

            _articulos["gta5:es"] = articulosGta5;
            _articulos["gta5"] = articulosGta5;

            var seccionesGta5 = new List<GuiaSeccion>
            {
                new GuiaSeccion
                {
                    Id = "prologo",
                    Titulo = "Inicio",
                    Icono = "book-open",
                    Descripcion = "Introducción a la guía interactiva de Grand Theft Auto V y perfiles de los protagonistas.",
                    Orden = 0,
                    Articulos = articulosGta5.Where(a => a.Categoria == "prologo" || a.Categoria == "historia-100").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "misiones-historia",
                    Titulo = "Misiones Principales",
                    Icono = "gun",
                    Descripcion = "Guía detallada paso a paso de todas las misiones principales de GTA V.",
                    Orden = 1,
                    Articulos = articulosGta5.Where(a => a.Categoria == "misiones-historia").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "extranos-locos",
                    Titulo = "Locos y Extraños",
                    Icono = "burst",
                    Descripcion = "Misiones secundarias de Extraños y Locos por todo San Andreas.",
                    Orden = 2,
                    Articulos = articulosGta5.Where(a => a.Categoria == "extranos-locos").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "armas",
                    Titulo = "Armas",
                    Icono = "gun",
                    Descripcion = "Catálogo de armamento del modo historia, desbloqueos en Ammu-Nation y ubicaciones en el mapa.",
                    Orden = 3,
                    Articulos = CargarArmasResumenGta5()
                },
                new GuiaSeccion
                {
                    Id = "negocios-economia",
                    Titulo = "Mercado Bursátil",
                    Icono = "briefcase",
                    Descripcion = "Guía de finanzas, funcionamiento de LCN y BAWSAQ y especulación bursátil.",
                    Orden = 4,
                    Articulos = articulosGta5.Where(a => a.Categoria == "negocios-economia").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "eventos-aleatorios",
                    Titulo = "Eventos Aleatorios",
                    Icono = "shuffle",
                    Descripcion = "Encuentros fortuitos y eventos dinámicos por todo Los Santos y Blaine County.",
                    Orden = 5,
                    Articulos = articulosGta5.Where(a => a.Categoria == "eventos-aleatorios").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "secretos-misterios",
                    Titulo = "Misterios",
                    Icono = "ghost",
                    Descripcion = "El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.",
                    Orden = 6,
                    Articulos = articulosGta5.Where(a => a.Categoria == "secretos-misterios").Select(toResumen).ToList()
                },
                new GuiaSeccion
                {
                    Id = "trofeos",
                    Titulo = "Trofeos",
                    Icono = "trophy",
                    Descripcion = "Listado de trofeos y logros de GTA V: Platino, Oro, Plata y Bronce.",
                    Orden = 7,
                    Articulos = new List<GuiaArticuloResumen>()
                }
            };

            var manifestEs = new GuiaManifest
            {
                Id = "gta5",
                Juego = "Grand Theft Auto V",
                Titulo = "Guía GTA V",
                Descripcion = "Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.",
                BannerUrl = "assets/images/home/home-bg.jpg",
                Secciones = seccionesGta5
            };
            _manifiestos["gta5:es"] = manifestEs;
            _manifiestos["gta5"] = manifestEs;
            return;
        }

        // Carga localizada para idiomas distintos de "es"
        var baseList = _articulos.TryGetValue("gta5:es", out var esArticles) ? esArticles : new List<GuiaArticulo>();
        var localizedItems = new List<GuiaArticulo>();
        var locOfflineDir = Path.Combine(BaseWebRoot, "data", "gta5", "guia", "offline", "idiomas", lang);
        if (Directory.Exists(locOfflineDir))
        {
            var files = Directory.GetFiles(locOfflineDir, "*.json");
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith('['))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, JsonOptions);
                        if (list != null) localizedItems.AddRange(list);
                    }
                    else if (json.TrimStart().StartsWith('{'))
                    {
                        var single = JsonSerializer.Deserialize<GuiaArticulo>(json, JsonOptions);
                        if (single != null && !string.IsNullOrEmpty(single.Id)) localizedItems.Add(single);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al cargar archivo de guía localizada ({Lang}) {File}", lang, f);
                }
            }
        }

        var locMap = localizedItems.Where(a => !string.IsNullOrEmpty(a.Id))
            .ToDictionary(a => a.Id, a => a, StringComparer.OrdinalIgnoreCase);

        var articulosLocalized = baseList.Select(baseArt =>
        {
            if (locMap.TryGetValue(baseArt.Id, out var trans))
            {
                return MergeArticulo(baseArt, trans);
            }
            return baseArt;
        }).ToList();

        _articulos[$"gta5:{lang}"] = articulosLocalized;

        var isEn = lang.Equals("en", StringComparison.OrdinalIgnoreCase);
        var seccionesLoc = new List<GuiaSeccion>
        {
            new GuiaSeccion
            {
                Id = "prologo",
                Titulo = isEn ? "Start" : "Inicio",
                Icono = "book-open",
                Descripcion = isEn ? "Introduction to Grand Theft Auto V interactive guide and protagonists profiles." : "Introducción a la guía interactiva de Grand Theft Auto V y perfiles de los protagonistas.",
                Orden = 0,
                Articulos = articulosLocalized.Where(a => a.Categoria == "prologo" || a.Categoria == "historia-100").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "misiones-historia",
                Titulo = isEn ? "Main Missions" : "Misiones Principales",
                Icono = "gun",
                Descripcion = isEn ? "Step-by-step detailed walkthrough for all main story missions of GTA V." : "Guía detallada paso a paso de todas las misiones principales de GTA V.",
                Orden = 1,
                Articulos = articulosLocalized.Where(a => a.Categoria == "misiones-historia").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "extranos-locos",
                Titulo = isEn ? "Strangers & Freaks" : "Locos y Extraños",
                Icono = "burst",
                Descripcion = isEn ? "Strangers and Freaks side missions across San Andreas." : "Misiones secundarias de Extraños y Locos por todo San Andreas.",
                Orden = 2,
                Articulos = articulosLocalized.Where(a => a.Categoria == "extranos-locos").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "armas",
                Titulo = isEn ? "Weapons" : "Armas",
                Icono = "gun",
                Descripcion = isEn ? "Story mode weaponry catalog, Ammu-Nation unlocks, and map locations." : "Catálogo de armamento del modo historia, desbloqueos en Ammu-Nation y ubicaciones en el mapa.",
                Orden = 3,
                Articulos = CargarArmasResumenGta5()
            },
            new GuiaSeccion
            {
                Id = "negocios-economia",
                Titulo = isEn ? "Stock Market" : "Mercado Bursátil",
                Icono = "briefcase",
                Descripcion = isEn ? "Finance guide, LCN and BAWSAQ mechanics, and market speculation." : "Guía de finanzas, funcionamiento de LCN y BAWSAQ y especulación bursátil.",
                Orden = 4,
                Articulos = articulosLocalized.Where(a => a.Categoria == "negocios-economia").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "eventos-aleatorios",
                Titulo = isEn ? "Random Events" : "Eventos Aleatorios",
                Icono = "shuffle",
                Descripcion = isEn ? "Random encounters and dynamic events throughout Los Santos and Blaine County." : "Encuentros fortuitos y eventos dinámicos por todo Los Santos y Blaine County.",
                Orden = 5,
                Articulos = articulosLocalized.Where(a => a.Categoria == "eventos-aleatorios").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "secretos-misterios",
                Titulo = isEn ? "Mysteries" : "Misterios",
                Icono = "ghost",
                Descripcion = isEn ? "Mount Chiliad mystery, the 4 UFOs, and the Infinity 8 killer." : "El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.",
                Orden = 6,
                Articulos = articulosLocalized.Where(a => a.Categoria == "secretos-misterios").Select(toResumen).ToList()
            },
            new GuiaSeccion
            {
                Id = "trofeos",
                Titulo = isEn ? "Trophies" : "Trofeos",
                Icono = "trophy",
                Descripcion = isEn ? "Full GTA V trophy and achievement list: Platinum, Gold, Silver, and Bronze." : "Listado de trofeos y logros de GTA V: Platino, Oro, Plata y Bronce.",
                Orden = 7,
                Articulos = new List<GuiaArticuloResumen>()
            }
        };

        _manifiestos[$"gta5:{lang}"] = new GuiaManifest
        {
            Id = "gta5",
            Juego = "Grand Theft Auto V",
            Titulo = isEn ? "GTA V Guide" : "Guía GTA V",
            Descripcion = isEn ? "Interactive compendium of Los Santos and Blaine County: 100% Story Mode, Heists, Stock Market & Secrets." : "Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.",
            BannerUrl = "assets/images/home/home-bg.jpg",
            Secciones = seccionesLoc
        };
    }

    private List<GuiaArticuloResumen> CargarArmasResumenGta5()
    {
        var armasPath = Path.Combine(BaseWebRoot, "data", "gta5", "guia", "guia-weapons-offline.json");
        if (File.Exists(armasPath))
        {
            try
            {
                var json = File.ReadAllText(armasPath);
                using var doc = JsonDocument.Parse(json);
                var list = new List<GuiaArticuloResumen>();
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    var id = el.TryGetProperty("id", out var pId) ? pId.GetString() ?? "" : "";
                    var name = el.TryGetProperty("name", out var pName) ? pName.GetString() ?? "" : "";
                    var category = el.TryGetProperty("category", out var pCat) ? pCat.GetString() ?? "" : "";
                    list.Add(new GuiaArticuloResumen
                    {
                        Id = id,
                        Slug = id,
                        Titulo = name,
                        Subtitulo = string.IsNullOrEmpty(category) ? "Arma" : category.ToUpperInvariant(),
                        Categoria = "armas",
                        Badge = category,
                        TiempoLecturaMinutos = 2
                    });
                }
                return list;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al cargar armas resumen desde {Path}", armasPath);
            }
        }
        return new List<GuiaArticuloResumen>();
    }

    public GuiaManifest GetGuiaManifest(string juegoId, string? lang = null)
    {
        var cleanLang = ResolveLang(lang);
        if (juegoId.Equals("gta5", StringComparison.OrdinalIgnoreCase))
        {
            EnsureGta5Cargado(cleanLang);
            var key = $"gta5:{cleanLang}";
            if (_manifiestos.TryGetValue(key, out var manifest))
            {
                return manifest;
            }
            if (_manifiestos.TryGetValue("gta5:es", out var fallbackManifest))
            {
                return fallbackManifest;
            }
            if (_manifiestos.TryGetValue("gta5", out var directGta5))
            {
                return directGta5;
            }
        }

        if (_manifiestos.TryGetValue(juegoId, out var directManifest))
        {
            return directManifest;
        }

        return new GuiaManifest
        {
            Id = juegoId,
            Titulo = $"Guía {juegoId.ToUpperInvariant()}",
            Descripcion = "Guía completa en construcción."
        };
    }

    public List<GuiaSeccion> GetSecciones(string juegoId, string? lang = null)
    {
        var manifest = GetGuiaManifest(juegoId, lang);
        return manifest?.Secciones ?? new List<GuiaSeccion>();
    }

    public GuiaArticulo? GetArticulo(string juegoId, string articuloId, string? lang = null)
    {
        if (string.IsNullOrWhiteSpace(articuloId)) return null;

        var cleanLang = ResolveLang(lang);
        if (juegoId.Equals("gta5", StringComparison.OrdinalIgnoreCase))
        {
            EnsureGta5Cargado(cleanLang);
            var key = $"gta5:{cleanLang}";
            if (_articulos.TryGetValue(key, out var localizedList))
            {
                var found = localizedList.FirstOrDefault(a => 
                    a.Id.Equals(articuloId, StringComparison.OrdinalIgnoreCase) || 
                    (a.Slug != null && a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase)));
                if (found != null) return found;
            }

            if (!cleanLang.Equals("es", StringComparison.OrdinalIgnoreCase) && _articulos.TryGetValue("gta5:es", out var esList))
            {
                var foundEs = esList.FirstOrDefault(a => 
                    a.Id.Equals(articuloId, StringComparison.OrdinalIgnoreCase) || 
                    (a.Slug != null && a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase)));
                if (foundEs != null) return foundEs;
            }
        }

        if (_articulos.TryGetValue(juegoId, out var lista))
        {
            return lista.FirstOrDefault(a => 
                a.Id.Equals(articuloId, StringComparison.OrdinalIgnoreCase) || 
                (a.Slug != null && a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase)));
        }

        return null;
    }

    public List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query, string? lang = null)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<GuiaArticuloResumen>();
        }

        var cleanLang = ResolveLang(lang);
        List<GuiaArticulo>? lista = null;

        if (juegoId.Equals("gta5", StringComparison.OrdinalIgnoreCase))
        {
            EnsureGta5Cargado(cleanLang);
            var key = $"gta5:{cleanLang}";
            if (!_articulos.TryGetValue(key, out lista))
            {
                _articulos.TryGetValue("gta5:es", out lista);
            }
        }
        else
        {
            _articulos.TryGetValue(juegoId, out lista);
        }

        if (lista == null) return new List<GuiaArticuloResumen>();

        var q = query.Trim();
        return lista
            .Where(a => (a.Titulo != null && a.Titulo.Contains(q, StringComparison.OrdinalIgnoreCase)) || 
                        (a.Subtitulo != null && a.Subtitulo.Contains(q, StringComparison.OrdinalIgnoreCase)) || 
                        (a.Tags != null && a.Tags.Any(t => t.Contains(q, StringComparison.OrdinalIgnoreCase))))
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

        var offlineDir = Path.Combine(BaseWebRoot, "data", "gta6", "guia", "offline");
        if (Directory.Exists(offlineDir))
        {
            var files = Directory.GetFiles(offlineDir, "*.json");
            foreach (var f in files)
            {
                try
                {
                    var json = File.ReadAllText(f);
                    if (json.TrimStart().StartsWith('['))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, JsonOptions);
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
                    if (json.TrimStart().StartsWith('['))
                    {
                        var list = JsonSerializer.Deserialize<List<GuiaArticulo>>(json, JsonOptions);
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

        var manifestGta6Path = Path.Combine(BaseWebRoot, "data", "gta6", "guia", "manifest.json");
        if (File.Exists(manifestGta6Path))
        {
            try
            {
                var manifestJson = File.ReadAllText(manifestGta6Path);
                var manifest = JsonSerializer.Deserialize<GuiaManifest>(manifestJson, JsonOptions);
                if (manifest != null)
                {
                    _manifiestos["gta6"] = manifest;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al deserializar manifest.json de GTA 6 desde {Path}", manifestGta6Path);
            }
        }

        if (!_manifiestos.ContainsKey("gta6"))
        {
            _manifiestos["gta6"] = new GuiaManifest
            {
                Id = "gta6",
                Juego = "Grand Theft Auto VI",
                Titulo = "Base de Datos & Guía Oficial de GTA VI",
                Descripcion = "Compendio interactivo de Vice City y el Estado de Leonida.",
                BannerUrl = "assets/gta6-banner.jpg",
                Secciones = new List<GuiaSeccion>()
            };
        }
    }
}
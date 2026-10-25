using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para proveer contenido, secciones y art�culos de la Wiki / Gu�a de GTA 5 y GTA 6.
/// Carga los datos de GTA 5 din�micamente desde los archivos JSON estructurados en wwwroot/data/gta5/guia/.
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
        InicializarGta6();
        InicializarGta6Online();
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
                    _logger.LogWarning(ex, "Error al cargar archivo de gu�a {File}", f);
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
                    _logger.LogWarning(ex, "Error al cargar archivo de gu�a online {File}", f);
                }
            }
        }

        _articulos["gta5"] = articulosGta5;

        _manifiestos["gta5"] = new GuiaManifest
        {
            Id = "gta5",
            Titulo = "Gu�a Oficial GTA V",
            Descripcion = "Gu�a enciclop�dica completa del Modo Historia y GTA Online.",
            Secciones = new List<GuiaSeccion>
            {
                new() { Id = "historia-100", Titulo = "Modo Historia & 100%", Icono = "trophy", Descripcion = "Gu�a paso a paso de la campa�a, requisitos del 100% y decisiones clave.", Orden = 1 },
                new() { Id = "personajes", Titulo = "Protagonistas & Facciones", Icono = "users", Descripcion = "Biograf�as, habilidades especiales y misiones personales.", Orden = 2 },
                new() { Id = "armas", Titulo = "Armas", Icono = "crosshairs", Descripcion = "Cat�logo de armamento del modo historia y online.", Orden = 3 },
                new() { Id = "negocios-economia", Titulo = "Mercado Burs�til", Icono = "trending-up", Descripcion = "Gu�a de finanzas y especulaci�n burs�til.", Orden = 4 },
                new() { Id = "secretos-misterios", Titulo = "Secretos & Misterios", Icono = "eye", Descripcion = "Archivo de enigmas, sucesos paranormales y mitos.", Orden = 5 },
                new() { Id = "trucos", Titulo = "C�digos & Trucos", Icono = "gamepad", Descripcion = "Trucos de salud, armas, nivel de b�squeda y veh�culos.", Orden = 6 }
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
            Titulo = $"Gu�a {juegoId.ToUpper()}",
            Descripcion = "Gu�a completa en construcci�n."
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

    private void InicializarGta6()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "prologo",
                Titulo = "Prólogo",
                Icono = "book-open",
                Descripcion = "Introducción al Estado de Leonida, Vice City y perfiles de los protagonistas.",
                Orden = 0,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "prologo-introduccion-gta6", Slug = "introduccion-guia-gta6", Titulo = "Introducción a la Guía & Estado de Leonida", Subtitulo = "Estructura de la enciclopedia, análisis del mapa y primeros pasos en Vice City", Categoria = "prologo", Badge = "Introducción", TiempoLecturaMinutos = 4 },
                    new() { Id = "jason-lucia-dinamica", Slug = "jason-lucia-dinamica", Titulo = "Jason y Lucia: El Dúo Criminal", Subtitulo = "Mecánicas cooperativas, confianza y robos a mano armada en Leonida", Categoria = "prologo", Badge = "Dúo", TiempoLecturaMinutos = 6 },
                    new() { Id = "lucia-caminos-perfil", Slug = "lucia-caminos-perfil", Titulo = "Lucia Caminos: Perfil y Trasfondo", Subtitulo = "El Centro Correccional de Leonida, grillete electrónico y motivaciones", Categoria = "prologo", Badge = "Lucia", TiempoLecturaMinutos = 5 },
                    new() { Id = "jason-duval-perfil", Slug = "jason-duval-perfil", Titulo = "Jason Duval: Perfil y Especialidades", Subtitulo = "Pasado militar, contactos clandestinos y sincronización de combate", Categoria = "prologo", Badge = "Jason", TiempoLecturaMinutos = 5 }
                }
            },
            new()
            {
                Id = "vehiculos",
                Titulo = "Vehículos",
                Icono = "car",
                Descripcion = "Catálogo de vehículos, deportivos, embarcaciones y aeronaves de Leonida.",
                Orden = 3,
                Articulos = new List<GuiaArticuloResumen>()
            }
        };

        _manifiestos["gta6"] = new GuiaManifest
        {
            Id = "gta6",
            Juego = "Grand Theft Auto VI",
            Titulo = "Base de Datos & Guía Oficial de GTA VI",
            Descripcion = "Toda la información confirmada, regiones de Leonida, análisis de tráileres, personajes y mecánicas de la próxima obra maestra de Rockstar Games.",
            BannerUrl = "assets/gta6-banner.jpg",
            Secciones = secciones
        };

        var articulosGta6 = new List<GuiaArticulo>
        {
            new()
            {
                Id = "prologo-introduccion-gta6",
                Slug = "introduccion-guia-gta6",
                Titulo = "Introducción a la Guía de GTA VI",
                Subtitulo = "Estructura de la enciclopedia interactiva y primeros pasos",
                Categoria = "prologo",
                Badge = "Introducción",
                TiempoLecturaMinutos = 4,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Prólogo", "Introducción", "GTA VI", "Leonida" },
                ContenidoMarkdown = @"# Prólogo: Bienvenido a la Guía de GTA VI y Estado de Leonida

Bienvenido a la enciclopedia interactiva y base de datos oficial de Grand Theft Auto VI. Esta guía recopila toda la información documentada, análisis geográfico de Vice City y el Estado de Leonida, mecánicas de inventario realista y dinámicas de los protagonistas Jason y Lucia.

---

### Estructura de la Base de Datos
La enciclopedia se organiza en módulos de análisis especializado:

* **Prólogo**: Introducción general y primeros pasos en Leonida.
* **Protagonistas & Trama Criminal**: Análisis táctico de Jason y Lucia, mecánicas de cooperación y antecedentes penitenciarios.
* **Vice City & Regiones de Leonida**: Distritos urbanos, zonas pantanosas de Grassrivers, playas de Vice Beaches y flora/fauna autóctona.
* **Mecánicas & Físicas de Juego**: Sistema de inventario físico en maleteros, interacción ambiental y balística de última generación.
* **Fuerzas del Orden & Redes Sociales**: IA policial inteligente, viralidad in-game y tácticas de persecución.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "jason-lucia-dinamica", Slug = "jason-lucia-dinamica", Titulo = "Jason y Lucia: El Dúo Criminal" }
                }
            },
            new()
            {
                Id = "jason-lucia-dinamica",
                Slug = "jason-lucia-dinamica",
                Titulo = "Jason y Lucia: El Dúo Criminal",
                Subtitulo = "Mecánicas de cambio de personaje, confianza y robos coordinados",
                Categoria = "protagonistas-leonida",
                Badge = "Exclusivo",
                TiempoLecturaMinutos = 5,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Lucia", "Jason", "Historia", "Mecánicas", "Vice City" },
                ContenidoMarkdown = @"# Jason y Lucia: La pareja criminal en el Estado de Leonida

Grand Theft Auto VI presenta la primera protagonista femenina jugable en la era 3D/HD de la saga, formando una pareja criminal inspirada en Bonnie y Clyde.

## 1. Lucia Caminos
* **Trasfondo**: En el primer tráiler oficial se la observa en el correccional de Leonida antes de asociarse con Jason.
* **Habilidades observadas**: Alta agilidad, manipulación de ganzúas modernas y liderazgo en asaltos rápidos.

## 2. Jason Duval
* **Trasfondo**: Veterano o ex-militar con experiencia en combate táctico y manejo de armamento pesado.
* **Habilidades observadas**: Conducción todoterreno en zonas pantanosas y manejo de armas largas.

## 3. Mecánica de Dúo Cooperativo
* **Sistema de órdenes rápidas**: Puedes ordenar a tu compañero cubrirte, vigilar a los rehenes en un robo a tienda o saquear la caja fuerte mientras aseguras el perímetro.
* **Inventario compartido en vehículos**: Ambos personajes pueden guardar armas largas y equipo especializado en el maletero del coche principal.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "mapa-leonida-zonas", Slug = "mapa-leonida-zonas", Titulo = "Las Regiones del Estado de Leonida" },
                    new() { Id = "inventario-maletero-armas", Slug = "inventario-maletero-armas", Titulo = "Sistema de Inventario Realista y Maleteros" }
                }
            }
        };

        _articulos["gta6"] = articulosGta6;
    }

    private void InicializarGta6Online()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "prologo",
                Titulo = "Prólogo & Iniciación",
                Icono = "book-open",
                Descripcion = "Primeros pasos, reputación y economía en Leonida Online.",
                Orden = 0,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new()
                    {
                        Id = "prologo-gta6-online-inicio",
                        Slug = "primeros-pasos-leonida-online",
                        Titulo = "Primeros Pasos en Leonida Online",
                        Subtitulo = "Creación de personaje, llegada a Vice City y primeras oportunidades",
                        Categoria = "prologo",
                        Badge = "Iniciación",
                        TiempoLecturaMinutos = 4
                    },
                    new()
                    {
                        Id = "prologo-gta6-online-economia",
                        Slug = "economia-y-reputacion-online",
                        Titulo = "Economía y Reputación en Vice City",
                        Subtitulo = "Cuentas bancarias, teléfonos inteligentes y gestión de dinero",
                        Categoria = "prologo",
                        Badge = "Economía",
                        TiempoLecturaMinutos = 5
                    }
                }
            },
            new()
            {
                Id = "misiones-online",
                Titulo = "Misiones & Operaciones",
                Icono = "crosshairs",
                Descripcion = "Misiones de contacto y operaciones clandestinas en Vice City.",
                Orden = 1,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new()
                    {
                        Id = "mision-online-contacto-vicecity",
                        Slug = "misiones-de-contacto-vice-city",
                        Titulo = "Trabajos de Contacto en Vice City",
                        Subtitulo = "Asaltos a almacenes y entregas rápidas en Downtown y Vice Beaches",
                        Categoria = "misiones-online",
                        Badge = "Trabajos",
                        TiempoLecturaMinutos = 6
                    },
                    new()
                    {
                        Id = "mision-online-operaciones-gellhorn",
                        Slug = "operaciones-en-port-gellhorn",
                        Titulo = "Operaciones en Port Gellhorn",
                        Subtitulo = "Contrabando marítimo y asaltos por carretera en la costa oeste",
                        Categoria = "misiones-online",
                        Badge = "Contrabando",
                        TiempoLecturaMinutos = 7
                    }
                }
            },
            new()
            {
                Id = "vehiculos",
                Titulo = "Vehículos",
                Icono = "car",
                Descripcion = "Catálogo multijugador de transportes, concesionarios y vehículos de Vice City.",
                Orden = 2,
                Articulos = new List<GuiaArticuloResumen>()
            }
        };

        _manifiestos["gta6-online"] = new GuiaManifest
        {
            Id = "gta6-online",
            Juego = "Grand Theft Auto VI Online",
            Titulo = "Base de Datos & Guía Oficial de GTA VI Online",
            Descripcion = "Compendio multijugador del Estado de Leonida: primeros pasos, operaciones y economía criminal.",
            BannerUrl = "assets/gta6-banner.jpg",
            Secciones = secciones
        };

        var articulosGta6Online = new List<GuiaArticulo>
        {
            new()
            {
                Id = "prologo-gta6-online-inicio",
                Slug = "primeros-pasos-leonida-online",
                Titulo = "Primeros Pasos en Leonida Online",
                Subtitulo = "Creación de personaje, llegada a Vice City y primeras oportunidades",
                Categoria = "prologo",
                Badge = "Iniciación",
                TiempoLecturaMinutos = 4,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Prólogo", "Iniciación", "GTA VI Online", "Vice City" },
                ContenidoMarkdown = @"# Primeros Pasos en Leonida Online

Bienvenido a la experiencia multijugador de Grand Theft Auto VI ambientada en el Estado de Leonida. Al iniciar tu andadura criminal en línea, deberás consolidar tu reputación comenzando desde lo más bajo del escalafón.

---

### 1. Llegada y Creación de Identidad
* **Diseño del Personaje**: Configura la herencia genética, fisionomía y rasgos distintivos en el editor.
* **Punto de Llegada**: Tu primera toma de contacto con Vice City comenzará en las terminales de transporte de la metrópolis.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "prologo-gta6-online-economia", Slug = "economia-y-reputacion-online", Titulo = "Economía y Reputación en Vice City" }
                }
            },
            new()
            {
                Id = "prologo-gta6-online-economia",
                Slug = "economia-y-reputacion-online",
                Titulo = "Economía y Reputación en Vice City",
                Subtitulo = "Cuentas bancarias, teléfonos inteligentes y gestión de dinero",
                Categoria = "prologo",
                Badge = "Economía",
                TiempoLecturaMinutos = 5,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Economía", "Dinero", "GTA VI Online", "Vice City" },
                ContenidoMarkdown = @"# Economía y Reputación en Vice City

El dinero en efectivo y el saldo bancario son indispensables para adquirir propiedades, armas y vehículos de alta gama en Leonida.

---

### 1. Gestión Financiera Segura
* **Cajeros ATM y Aplicación Bancaria**: Ingresa el dinero en efectivo obtenido tras cada trabajo para evitar perderlo en caso de incidente en el modo libre.
* **Bolsa y Propiedades**: Invierte tus ganancias tempranas en garajes y almacenes para ampliar tu capacidad operativa.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "prologo-gta6-online-inicio", Slug = "primeros-pasos-leonida-online", Titulo = "Primeros Pasos en Leonida Online" }
                }
            }
        };

        _articulos["gta6-online"] = articulosGta6Online;
    }
}

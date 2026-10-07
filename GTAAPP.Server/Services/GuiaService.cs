using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para proveer contenido, secciones y artículos de la Wiki / Guía de GTA 5 y GTA 6.
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
    private readonly Dictionary<string, GuiaManifest> _manifiestos;
    private readonly Dictionary<string, List<GuiaArticulo>> _articulos;

    public GuiaService()
    {
        _manifiestos = new Dictionary<string, GuiaManifest>(StringComparer.OrdinalIgnoreCase);
        _articulos = new Dictionary<string, List<GuiaArticulo>>(StringComparer.OrdinalIgnoreCase);

        InicializarGta5();
        InicializarGta6();
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
                a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase));
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
            .Where(a => a.Titulo.ToLowerInvariant().Contains(q) || 
                        a.Subtitulo.ToLowerInvariant().Contains(q) || 
                        a.Tags.Any(t => t.ToLowerInvariant().Contains(q)))
            .Cast<GuiaArticuloResumen>()
            .ToList();
    }

    private void InicializarGta5()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "historia-100",
                Titulo = "Guía del 100% & Misiones",
                Icono = "trophy",
                Descripcion = "Requisitos exactos, medallas de oro y pasos para completar el 100% de la historia.",
                Orden = 1,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "Requisitos para el 100% de GTA V", Subtitulo = "Todo lo necesario para conseguir la estadística del 100%", Categoria = "historia-100", Badge = "Imprescindible", TiempoLecturaMinutos = 6 },
                    new() { Id = "golpes-principales", Slug = "golpes-principales", Titulo = "Guía de los 6 Golpes de Campaña", Subtitulo = "Planes A/B, mejores pistoleros, conductores y hackers", Categoria = "historia-100", Badge = "Guía", TiempoLecturaMinutos = 10 },
                    new() { Id = "asesinatos-lester-bolsa", Slug = "asesinatos-lester-bolsa", Titulo = "Inversión en Bolsa con las Misiones de Lester", Subtitulo = "Cómo conseguir 2.147 millones con cada personaje", Categoria = "historia-100", Badge = "Dinero", TiempoLecturaMinutos = 8 }
                }
            },
            new()
            {
                Id = "personajes",
                Titulo = "Personajes & Habilidades",
                Icono = "users",
                Descripcion = "Biografías, habilidades especiales y misiones personales de Michael, Franklin y Trevor.",
                Orden = 2,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "michael-de-santa", Slug = "michael-de-santa", Titulo = "Michael De Santa", Subtitulo = "Habilidad de tiempo bala, armas preferidas y trasfondo", Categoria = "personajes", TiempoLecturaMinutos = 4 },
                    new() { Id = "franklin-clinton", Slug = "franklin-clinton", Titulo = "Franklin Clinton", Subtitulo = "Conducción ralentizada, Chop y progresión", Categoria = "personajes", TiempoLecturaMinutos = 4 },
                    new() { Id = "trevor-philips", Slug = "trevor-philips", Titulo = "Trevor Philips", Subtitulo = "Modo Furia, Industrias Trevor Philips y locuras", Categoria = "personajes", TiempoLecturaMinutos = 4 }
                }
            },
            new()
            {
                Id = "secretos-misterios",
                Titulo = "Secretos, Easter Eggs y Misterios",
                Icono = "sparkles",
                Descripcion = "El misterio de Mount Chiliad, OVNIS, el Fantasma de Mount Gordo y el Asesino de los 8 Infinitos.",
                Orden = 3,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "misterio-chiliad", Slug = "misterio-chiliad", Titulo = "El Misterio de Mount Chiliad", Subtitulo = "El mural, los 4 OVNIs y la verdad del Jetpack", Categoria = "secretos-misterios", Badge = "Misterio", TiempoLecturaMinutos = 7 },
                    new() { Id = "fantasma-monte-gordo", Slug = "fantasma-monte-gordo", Titulo = "El Fantasma de Jolene Cranley-Evans", Subtitulo = "Hora de aparición, ubicación y la historia de Jock Cranley", Categoria = "secretos-misterios", TiempoLecturaMinutos = 3 }
                }
            },
            new()
            {
                Id = "trucos-codigos",
                Titulo = "Trucos y Códigos de Teléfono",
                Icono = "key",
                Descripcion = "Lista completa de trucos para PC, PlayStation, Xbox y números de teléfono celular.",
                Orden = 4,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "lista-trucos-gta5", Slug = "lista-trucos-gta5", Titulo = "Todos los Trucos de GTA 5", Subtitulo = "Invencibilidad, armas, súper salto, caída libre y vehículos", Categoria = "trucos-codigos", Badge = "Popular", TiempoLecturaMinutos = 5 }
                }
            }
        };

        _manifiestos["gta5"] = new GuiaManifest
        {
            Id = "gta5",
            Juego = "Grand Theft Auto V",
            Titulo = "Enciclopedia & Guía Oficial de GTA V",
            Descripcion = "La guía más exhaustiva y detallada de Los Santos y el Condado de Blaine: historia al 100%, golpes, personajes, misterios y trucos.",
            BannerUrl = "assets/gta5-banner.jpg",
            Secciones = secciones
        };

        var articulosGta5 = new List<GuiaArticulo>
        {
            new()
            {
                Id = "requisitos-100",
                Slug = "requisitos-100",
                Titulo = "Requisitos para el 100% de GTA V",
                Subtitulo = "Todo lo necesario para conseguir la estadística del 100%",
                Categoria = "historia-100",
                Badge = "Imprescindible",
                TiempoLecturaMinutos = 6,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "100%", "Logros", "Misiones", "Coleccionables" },
                ContenidoMarkdown = @"# Requisitos Oficiales para el 100% en GTA V

Para alcanzar el 100% en la pestaña de Estadísticas de GTA V no necesitas hacer absolutamente todo el juego, sino cumplir una serie específica de objetivos fijados por Rockstar:

## 1. Misiones Principales (69 misiones)
* Completar las 69 misiones de la historia principal, incluyendo todos los golpes planificados.
* Las elecciones de cómo ejecutar cada golpe no impiden el 100%.

## 2. Extraños y Locos (20 de 58 misiones)
* Debes completar 20 misiones específicas de Extraños y Locos (principalmente las de Franklin):
  * **Tonya**: Todas las misiones de grúa (5 en total).
  * **Beverly**: Todas las misiones de paparazzi (5 en total).
  * **Hao**: Carrera urbana inicial.
  * **Barry**: Misiones de legalización de Franklin.
  * **Mary-Ann**: Carrera de triatlón con Franklin.
  * **Dom**: Los 4 saltos de paracaidismo extremo.
  * **Omega**: Reunir las 50 piezas de la nave espacial.
  * **Dreyfuss**: Reunir los 50 fragmentos de carta y resolver el asesinato de Leonora Johnson.

## 3. Pasatiempos y Aficiones (42 actividades)
* Ganar al Golf (9 hoyos bajo par).
* Ganar al Tenis (1 set completo).
* Ganar a los Dardos (1 partida).
* Completar los 3 Triatlones (incluyendo el Triatlón del Lago Zancudo).
* Superar todos los desafíos de la Galería de Tiro con al menos medalla de bronce en cada arma.
* Superar las 12 pruebas de la Escuela de Vuelo.
* Ganar las 5 Carreras Urbanas de coches.
* Ganar las 6 Carreras Todoterreno.
* Ganar las 4 Carreras Marítimas en lancha.
* Conseguir un baile privado en el Club de Striptease.
* Superar todos los saltos en paracaídas (base jumps y saltos desde helicóptero).

## 4. Eventos Aleatorios (14 eventos)
* Presenciar y resolver con éxito al menos 14 de los 57 eventos aleatorios repartidos por el mapa.

## 5. Varios (16 actividades)
* Comprar 5 propiedades que generen ingresos.
* Comprar un vehículo por Internet en el móvil (Eyefind).
* Recoger las 50 partes de la nave espacial.
* Recoger las 50 cartas de Leonora Johnson.
* Realizar 25 de los 50 Saltos Acrobáticos únicos.
* Realizar 8 de los 15 Vuelos Bajo el Puente.
* Realizar 8 de los 15 Vuelos a Cuchillo entre rascacielos.
* Visitar el cine a ver una película.
* Pasear y jugar a la pelota con Chop.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "golpes-principales", Slug = "golpes-principales", Titulo = "Guía de los 6 Golpes de Campaña" },
                    new() { Id = "asesinatos-lester-bolsa", Slug = "asesinatos-lester-bolsa", Titulo = "Inversión en Bolsa con las Misiones de Lester" }
                }
            }
        };

        _articulos["gta5"] = articulosGta5;
    }

    private void InicializarGta6()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "protagonistas-leonida",
                Titulo = "Protagonistas & Estado de Leonida",
                Icono = "map-pin",
                Descripcion = "Todo lo conocido sobre Lucia Caminos, Jason Duval y las regiones de Vice City, Kelly County y Grassrivers.",
                Orden = 1,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "jason-lucia-dinamica", Slug = "jason-lucia-dinamica", Titulo = "Jason y Lucia: El Dúo Criminal", Subtitulo = "Mecánicas de cambio de personaje, confianza y robos coordinados", Categoria = "protagonistas-leonida", Badge = "Exclusivo", TiempoLecturaMinutos = 5 },
                    new() { Id = "mapa-leonida-zonas", Slug = "mapa-leonida-zonas", Titulo = "Las Regiones del Estado de Leonida", Subtitulo = "Vice City, Port Gellhorn, Ambrosia, Leonard County y los Cayos", Categoria = "protagonistas-leonida", Badge = "Mapa", TiempoLecturaMinutos = 8 }
                }
            },
            new()
            {
                Id = "mecanicas-novedades",
                Titulo = "Novedades & Mecánicas Confirmadas",
                Icono = "cpu",
                Descripcion = "Física de vehículos, inventario físico en maleteros, cámaras de seguridad y redes sociales in-game.",
                Orden = 2,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "inventario-maletero-armas", Slug = "inventario-maletero-armas", Titulo = "Sistema de Inventario Realista y Maleteros", Subtitulo = "Límite de armas portables y equipamiento vehicular estilo RDR2", Categoria = "mecanicas-novedades", TiempoLecturaMinutos = 4 },
                    new() { Id = "redes-sociales-policia", Slug = "redes-sociales-policia", Titulo = "Redes Sociales y Sistema Policial Inteligente", Subtitulo = "Grabaciones de testigos, reconocimiento facial y patrullas de Vice Dale", Categoria = "mecanicas-novedades", TiempoLecturaMinutos = 6 }
                }
            },
            new()
            {
                Id = "fauna-naturaleza",
                Titulo = "Fauna, Ecosistemas y Clima Extremo",
                Icono = "sun",
                Descripcion = "Cocodrilos, flamencos, tiburones y el sistema dinámico de tormentas tropicales y huracanes.",
                Orden = 3,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "vida-salvaje-leonida", Slug = "vida-salvaje-leonida", Titulo = "Enciclopedia de Fauna de Leonida", Subtitulo = "Comportamiento animal, interacción y peligros de los pantanos", Categoria = "fauna-naturaleza", TiempoLecturaMinutos = 5 }
                }
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
}

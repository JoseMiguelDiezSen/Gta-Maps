namespace GTAAPP.Server.Models;

/// <summary>
/// Representa el manifiesto general de una guía/wiki (GTA 5 o GTA 6).
/// </summary>
public class GuiaManifest
{
    public string Id { get; set; } = string.Empty;
    public string Juego { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public List<GuiaSeccion> Secciones { get; set; } = new();
}

/// <summary>
/// Representa una categoría o sección temática dentro de la guía (ej. Historia 100%, Personajes, Armas, etc.).
/// </summary>
public class GuiaSeccion
{
    public string Id { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Icono { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int Orden { get; set; }
    public List<GuiaArticuloResumen> Articulos { get; set; } = new();
}

/// <summary>
/// Resumen ligero de un artículo para listados y barras laterales de navegación.
/// </summary>
public class GuiaArticuloResumen
{
    public string Id { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Subtitulo { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public int TiempoLecturaMinutos { get; set; }
}

/// <summary>
/// Detalle completo de un artículo informativo de la guía/wiki.
/// </summary>
public class GuiaArticulo : GuiaArticuloResumen
{
    public string ContenidoMarkdown { get; set; } = string.Empty;
    public string? ImagenPrincipalUrl { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime UltimaActualizacion { get; set; }
    public List<GuiaArticuloRelacionado> Relacionados { get; set; } = new();
}

public class GuiaArticuloRelacionado
{
    public string Id { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

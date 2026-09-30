namespace GTAAPP.Server.Models;

/// <summary>
/// Representa una variante o capa de visualización de mapa disponible (ej. Satélite, Atlas, Carreteras, UV Blueprint).
/// </summary>
public class MapTypeInfo
{
    /// <summary>
    /// Identificador técnico de la capa de mapa (ej. "Satellite", "Roadmap", "Atlas", "UV").
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Nombre visible de la capa para el selector de la interfaz de usuario (ej. "Satélite", "Carreteras", "Blueprint").
    /// </summary>
    public string Label { get; set; } = string.Empty;
}

/// <summary>
/// Contiene la configuración técnica y parámetros de renderizado de la cartografía interactiva para Leaflet.
/// </summary>
public class GameMapInfo
{
    /// <summary>
    /// Ruta relativa hacia el directorio de teselas o tiles del mapa (ej. "assets").
    /// </summary>
    public string TilePath { get; set; } = string.Empty;

    /// <summary>
    /// Lista de estilos y tipos de mapa disponibles para este juego o modo.
    /// </summary>
    public List<MapTypeInfo> MapTypes { get; set; } = new();

    /// <summary>
    /// Dimensión nativa en píxeles del mapa completo a máxima resolución (ej. 8192x8192).
    /// </summary>
    public int ImageSize { get; set; }

    /// <summary>
    /// Nivel máximo de zoom permitido en el visor interactivo de mapas (ej. 7).
    /// </summary>
    public int MaxZoom { get; set; }
}

/// <summary>
/// Manifiesto descriptivo de un juego o modo (GTA Online, GTA V Historia, GTA VI).
/// Informa a la aplicación cliente si el juego está activo, su nombre oficial y la configuración de su mapa.
/// </summary>
public class GameManifest
{
    /// <summary>
    /// Identificador único del juego o modo (ej. "gta5online", "gta5historia", "gta6historia").
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Título oficial del juego presentado en el encabezado de la aplicación.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Estado actual de disponibilidad del título (ej. "activo" o "proximamente").
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Metadatos cartográficos del mapa, o null si el juego aún no tiene mapa publicado (ej. GTA VI).
    /// </summary>
    public GameMapInfo? Map { get; set; }
}

using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Coordenadas espaciales (X, Y, Z) donde se sitúa el misterio en el mapa del juego.
/// </summary>
public class MysteryPosition
{
    /// <summary>
    /// Coordenada horizontal Oeste-Este.
    /// </summary>
    [JsonPropertyName("x")]
    public double X { get; set; }

    /// <summary>
    /// Coordenada horizontal Sur-Norte.
    /// </summary>
    [JsonPropertyName("y")]
    public double Y { get; set; }

    /// <summary>
    /// Coordenada vertical (altitud).
    /// </summary>
    [JsonPropertyName("z")]
    public double Z { get; set; }
}

/// <summary>
/// Punto de observación recomendado para visualizar el misterio (ej. mirador frente al fantasma o cima para ver el OVNI).
/// </summary>
public class MysteryObservationPoint
{
    /// <summary>
    /// Coordenada X del punto de mira óptimo.
    /// </summary>
    [JsonPropertyName("x")]
    public double X { get; set; }

    /// <summary>
    /// Coordenada Y del punto de mira óptimo.
    /// </summary>
    [JsonPropertyName("y")]
    public double Y { get; set; }

    /// <summary>
    /// Coordenada Z de altitud del punto de mira.
    /// </summary>
    [JsonPropertyName("z")]
    public double Z { get; set; }

    /// <summary>
    /// Consejo o recomendación sobre desde qué ángulo o distancia mirar para apreciar el misterio.
    /// </summary>
    [JsonPropertyName("tip")]
    public string Tip { get; set; } = string.Empty;
}

/// <summary>
/// Modelo detallado de un misterio, suceso paranormal, leyenda urbana o secreto del mundo de GTA V.
/// Contiene datos de investigación, pistas, condiciones climáticas/horarias y trasfondo narrativo.
/// </summary>
public class MysteryItem
{
    /// <summary>
    /// Identificador único del misterio (ej. "mystery-infinity-8", "mystery-mount-chiliad-ufo").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Orden de visualización en el archivo de misterios.
    /// </summary>
    [JsonPropertyName("order")]
    public int Order { get; set; }

    /// <summary>
    /// Título oficial del misterio en español.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Título oficial del misterio en inglés.
    /// </summary>
    [JsonPropertyName("titleEn")]
    public string? TitleEn { get; set; }

    /// <summary>
    /// Categoría del misterio (ej. "mysteries", "paranormal", "easter-eggs").
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Etiqueta visible de la categoría.
    /// </summary>
    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    /// <summary>
    /// Horario y condiciones ambientales requeridas para presenciarlo (ej. "3:00 AM con lluvia/tormenta", "23:00 - 0:00").
    /// </summary>
    [JsonPropertyName("schedule")]
    public string? Schedule { get; set; }

    /// <summary>
    /// Nombre del lugar geográfico específico.
    /// </summary>
    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Zona general o municipio del mapa (ej. "Mount Chiliad", "Mount Gordo", "Sandy Shores").
    /// </summary>
    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    /// <summary>
    /// Coordenadas geográficas exactas del epicentro del misterio.
    /// </summary>
    [JsonPropertyName("position")]
    public MysteryPosition Position { get; set; } = new();

    /// <summary>
    /// Coordenadas alternativas y consejos de observación si el misterio solo se ve a cierta distancia.
    /// </summary>
    [JsonPropertyName("observationPoint")]
    public MysteryObservationPoint? ObservationPoint { get; set; }

    /// <summary>
    /// Descripción detallada del fenómeno, lo que se ve y cómo interactuar.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Trasfondo narrativo, historia comunitaria e investigación del lore de Rockstar.
    /// </summary>
    [JsonPropertyName("lore")]
    public string Lore { get; set; } = string.Empty;

    /// <summary>
    /// Condiciones técnicas del motor del juego para que el suceso ocurra (100% del juego, mira térmica, clima tormentoso).
    /// </summary>
    [JsonPropertyName("mechanics")]
    public List<string> Mechanics { get; set; } = new();

    /// <summary>
    /// Lista de pistas, grafitis o poemas repartidos por el mapa que conducen a la resolución del misterio.
    /// </summary>
    [JsonPropertyName("clues")]
    public List<string> Clues { get; set; } = new();

    /// <summary>
    /// Ruta o URL a la imagen ilustrativa del misterio.
    /// </summary>
    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    /// <summary>
    /// Color temático de la tarjeta o marcador (ej. "#ff5722", "#9c27b0").
    /// </summary>
    [JsonPropertyName("badgeColor")]
    public string BadgeColor { get; set; } = string.Empty;

    /// <summary>
    /// Icono representativo de FontAwesome para el marcador (ej. "fa-ghost", "fa-user-secret", "fa-skull").
    /// </summary>
    [JsonPropertyName("badgeIcon")]
    public string BadgeIcon { get; set; } = string.Empty;

    /// <summary>
    /// Símbolo gráfico superpuesto (ej. "OVNI", "8", "👻").
    /// </summary>
    [JsonPropertyName("badgeSymbol")]
    public string BadgeSymbol { get; set; } = string.Empty;

    /// <summary>
    /// Modo de juego donde está disponible ("story", "online" o "both").
    /// </summary>
    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = "both";
}

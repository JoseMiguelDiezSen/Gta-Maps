using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Modelo que representa un elemento coleccionable tanto de GTA Online como del Modo Historia
/// (ej. naipes de baraja, figuras de acción, inhibidores de señal, partes de la nave espacial, cartas de asesinato, etc.).
/// </summary>
public class CollectibleItem
{
    /// <summary>
    /// Identificador único del coleccionable (ej. "card-01", "action-fig-42", "spaceship-part-15").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Nombre descriptivo del objeto coleccionable (ej. "Naipe: As de Picas", "Figura de Acción: Impotent Rage").
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Identificador técnico de la categoría a la que pertenece (ej. "playing-cards", "action-figures", "spaceship-parts").
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Etiqueta visual para mostrar la categoría en la interfaz de usuario.
    /// </summary>
    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    /// <summary>
    /// Número correlativo del coleccionable dentro de su serie específica (ej. 1 de 54).
    /// </summary>
    [JsonPropertyName("number")]
    public int Number { get; set; }

    /// <summary>
    /// Cantidad total de elementos que componen la colección completa (ej. 54, 100, 50).
    /// </summary>
    [JsonPropertyName("total")]
    public int Total { get; set; }

    /// <summary>
    /// Zona, barrio o región geográfica del mapa de San Andreas donde se ubica (ej. "Sandy Shores", "Downtown Los Santos").
    /// </summary>
    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    /// <summary>
    /// Descripción del entorno y detalles específicos sobre cómo encontrar el objeto.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Pista concisa o indicación clave para guiar al jugador en su búsqueda.
    /// </summary>
    [JsonPropertyName("hint")]
    public string Hint { get; set; } = string.Empty;

    /// <summary>
    /// Recompensa obtenida al recoger el objeto o al completar toda la serie (dinero GTA$, RP, indumentarias exclusivas).
    /// </summary>
    [JsonPropertyName("reward")]
    public string Reward { get; set; } = string.Empty;

    /// <summary>
    /// Coordenadas tridimensionales (X, Y, Z) en el sistema de coordenadas del mapa de GTA V.
    /// </summary>
    [JsonPropertyName("position")]
    public MapPosition Position { get; set; } = new();

    /// <summary>
    /// Configuración visual de la insignia o marcador que se renderiza sobre el mapa interactivo (icono, color, símbolo).
    /// </summary>
    [JsonPropertyName("badge")]
    public MapBadge Badge { get; set; } = new();
}

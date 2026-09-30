using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Coordenadas de posición tridimensional en el mundo de Grand Theft Auto (ejes X, Y, Z del motor del juego).
/// </summary>
public class MapPosition
{
    /// <summary>
    /// Coordenada horizontal Oeste-Este.
    /// </summary>
    [JsonPropertyName("x")]
    public float X { get; set; }

    /// <summary>
    /// Coordenada horizontal Sur-Norte.
    /// </summary>
    [JsonPropertyName("y")]
    public float Y { get; set; }

    /// <summary>
    /// Coordenada de elevación vertical (altitud sobre el nivel del mar).
    /// </summary>
    [JsonPropertyName("z")]
    public float Z { get; set; }
}

/// <summary>
/// Insignia gráfica (icono, color de fondo, símbolo) para la representación de marcadores en el mapa interactivo.
/// </summary>
public class MapBadge
{
    /// <summary>
    /// Nombre de la clase del icono (ej. "fa-building", "fa-warehouse", "fa-car").
    /// </summary>
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    /// <summary>
    /// Color hexadecimal para el marcador en el mapa (ej. "#ff9900", "#33cc66").
    /// </summary>
    [JsonPropertyName("color")]
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Símbolo alfanumérico o abreviatura visual superpuesta al icono.
    /// </summary>
    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = string.Empty;
}

/// <summary>
/// Modelo polivalente y unificado para cualquier punto de interés o ubicación del mapa de GTA V
/// (propiedades, negocios, servicios, talleres, trabajos de rol, contactos, fauna, actividades, etc.).
/// </summary>
public class LocationItem
{
    /// <summary>
    /// Identificador único de la ubicación (ej. "prop-eclipse-penthouse", "biz-nightclub-del-perro").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Nombre oficial o comercial de la ubicación.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Identificador técnico de la categoría a la que pertenece (ej. "properties", "businesses", "services").
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Etiqueta legible de la categoría para mostrar al usuario.
    /// </summary>
    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    /// <summary>
    /// Modo de juego al que corresponde ("online", "story" o "both").
    /// </summary>
    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = string.Empty;

    /// <summary>
    /// Propietario por defecto o personaje al que se asocia la propiedad (ej. "Franklin", "Michael", "Trevor" o null).
    /// </summary>
    [JsonPropertyName("owner")]
    public string? Owner { get; set; }

    /// <summary>
    /// Precio de adquisición en dólares GTA (numérico).
    /// </summary>
    [JsonPropertyName("price")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public long Price { get; set; }

    /// <summary>
    /// Precio formateado con símbolo de moneda y separadores de miles (ej. "$1,500,000").
    /// </summary>
    [JsonPropertyName("priceFormatted")]
    public string PriceFormatted { get; set; } = string.Empty;

    /// <summary>
    /// URL o ruta relativa a la fotografía o miniatura de la ubicación.
    /// </summary>
    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Distrito, barrio o región donde se ubica el punto (ej. "Vinewood Hills", "Del Perro", "Sandy Shores").
    /// </summary>
    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    /// <summary>
    /// Descripción detallada de las ventajas, funciones o servicios que ofrece esta ubicación.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Lista de características y mejoras disponibles (ej. "Garaje de 10 plazas", "Heliotropo", "Armero personal").
    /// </summary>
    [JsonPropertyName("features")]
    public List<string> Features { get; set; } = [];

    /// <summary>
    /// Rendimiento o ingresos semanales generados en el caso de negocios (ej. "$9,300 / semana", "Hasta $50,000 / día en el juego").
    /// </summary>
    [JsonPropertyName("income")]
    public string? Income { get; set; }

    /// <summary>
    /// Coordenadas tridimensionales de geolocalización en el mapa de Los Santos.
    /// </summary>
    [JsonPropertyName("position")]
    public MapPosition Position { get; set; } = new();

    /// <summary>
    /// Marcador e icono configurado para renderizarse sobre Leaflet.
    /// </summary>
    [JsonPropertyName("badge")]
    public MapBadge Badge { get; set; } = new();
}

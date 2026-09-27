using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Modelo unificado para cualquier punto de interés o ubicación del mapa de GTA V
/// (propiedades, negocios, servicios, talleres, trabajos de rol, contactos, fauna, actividades, etc.).
/// </summary>
public class LocationItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = string.Empty;

    [JsonPropertyName("owner")]
    public string? Owner { get; set; }

    [JsonPropertyName("price")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public long Price { get; set; }

    [JsonPropertyName("priceFormatted")]
    public string PriceFormatted { get; set; } = string.Empty;

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("features")]
    public List<string> Features { get; set; } = [];

    [JsonPropertyName("income")]
    public string? Income { get; set; }

    [JsonPropertyName("position")]
    public MapPosition Position { get; set; } = new();

    [JsonPropertyName("badge")]
    public MapBadge Badge { get; set; } = new();
}

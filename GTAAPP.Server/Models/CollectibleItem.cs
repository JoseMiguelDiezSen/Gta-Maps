using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Elemento coleccionable exclusivo de GTA Online (naipes, figuras de acción, inhibidores, etc.).
/// </summary>
public class CollectibleItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    [JsonPropertyName("number")]
    public int Number { get; set; }

    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("hint")]
    public string Hint { get; set; } = string.Empty;

    [JsonPropertyName("reward")]
    public string Reward { get; set; } = string.Empty;

    [JsonPropertyName("position")]
    public MapPosition Position { get; set; } = new();

    [JsonPropertyName("badge")]
    public MapBadge Badge { get; set; } = new();
}

using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Representa una misión del Modo Historia de GTA V.
/// </summary>
public class MissionItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("character")]
    public string Character { get; set; } = string.Empty;

    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("goldRequirements")]
    public List<string> GoldRequirements { get; set; } = new();

    [JsonPropertyName("reward")]
    public string? Reward { get; set; }

    [JsonPropertyName("unlockedBy")]
    public string? UnlockedBy { get; set; }

    [JsonPropertyName("minLevel")]
    public int? MinLevel { get; set; }

    [JsonPropertyName("players")]
    public string? Players { get; set; }
}

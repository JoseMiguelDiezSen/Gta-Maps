using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Representa una misión secundaria de Extraños y Locos (Strangers and Freaks) de GTA V Modo Historia.
/// </summary>
public class StrangerMissionItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("titleEn")]
    public string TitleEn { get; set; } = string.Empty;

    [JsonPropertyName("series")]
    public string Series { get; set; } = string.Empty;

    [JsonPropertyName("seriesName")]
    public string SeriesName { get; set; } = string.Empty;

    [JsonPropertyName("seriesIcon")]
    public string SeriesIcon { get; set; } = string.Empty;

    [JsonPropertyName("seriesColor")]
    public string SeriesColor { get; set; } = string.Empty;

    [JsonPropertyName("seriesOrder")]
    public int SeriesOrder { get; set; }

    [JsonPropertyName("seriesTotal")]
    public int SeriesTotal { get; set; }

    [JsonPropertyName("character")]
    public string Character { get; set; } = string.Empty;

    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    [JsonPropertyName("requiredFor100")]
    public bool RequiredFor100 { get; set; }

    [JsonPropertyName("unlockedBy")]
    public string? UnlockedBy { get; set; }

    [JsonPropertyName("reward")]
    public string? Reward { get; set; }

    [JsonPropertyName("goldRequirements")]
    public List<string> GoldRequirements { get; set; } = new();

    [JsonPropertyName("objectives")]
    public List<string> Objectives { get; set; } = new();

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }

    [JsonPropertyName("walkthroughUrl")]
    public string? WalkthroughUrl { get; set; }
}

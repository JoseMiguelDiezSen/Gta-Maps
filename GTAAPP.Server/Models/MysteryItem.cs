using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

public class MysteryPosition
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("z")]
    public double Z { get; set; }
}

public class MysteryObservationPoint
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("z")]
    public double Z { get; set; }

    [JsonPropertyName("tip")]
    public string Tip { get; set; } = string.Empty;
}

public class MysteryItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("titleEn")]
    public string? TitleEn { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    [JsonPropertyName("schedule")]
    public string? Schedule { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    [JsonPropertyName("position")]
    public MysteryPosition Position { get; set; } = new();

    [JsonPropertyName("observationPoint")]
    public MysteryObservationPoint? ObservationPoint { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("lore")]
    public string Lore { get; set; } = string.Empty;

    [JsonPropertyName("mechanics")]
    public List<string> Mechanics { get; set; } = new();

    [JsonPropertyName("clues")]
    public List<string> Clues { get; set; } = new();

    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    [JsonPropertyName("badgeColor")]
    public string BadgeColor { get; set; } = string.Empty;

    [JsonPropertyName("badgeIcon")]
    public string BadgeIcon { get; set; } = string.Empty;

    [JsonPropertyName("badgeSymbol")]
    public string BadgeSymbol { get; set; } = string.Empty;

    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = "both";
}

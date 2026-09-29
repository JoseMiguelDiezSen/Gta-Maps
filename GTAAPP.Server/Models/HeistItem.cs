using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

public class HeistSetupMissionItem
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public class HeistApproachItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

public class HeistPotentialTake
{
    [JsonPropertyName("normal")]
    public string Normal { get; set; } = string.Empty;

    [JsonPropertyName("hard")]
    public string? Hard { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public class HeistItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("titleEn")]
    public string TitleEn { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    [JsonPropertyName("players")]
    public string Players { get; set; } = string.Empty;

    [JsonPropertyName("minLevel")]
    public int MinLevel { get; set; } = 1;

    [JsonPropertyName("propertyRequired")]
    public string PropertyRequired { get; set; } = string.Empty;

    [JsonPropertyName("setupCost")]
    public decimal SetupCost { get; set; }

    [JsonPropertyName("setupCostFormatted")]
    public string SetupCostFormatted { get; set; } = string.Empty;

    [JsonPropertyName("potentialTake")]
    public HeistPotentialTake? PotentialTake { get; set; }

    [JsonPropertyName("target")]
    public string Target { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    [JsonPropertyName("badgeColor")]
    public string BadgeColor { get; set; } = "#ffb833";

    [JsonPropertyName("badgeIcon")]
    public string BadgeIcon { get; set; } = "fa-sack-dollar";

    [JsonPropertyName("eliteChallenges")]
    public List<string> EliteChallenges { get; set; } = new();

    [JsonPropertyName("eliteReward")]
    public string? EliteReward { get; set; }

    [JsonPropertyName("unlockedVehicles")]
    public List<string>? UnlockedVehicles { get; set; }

    [JsonPropertyName("setupMissions")]
    public List<HeistSetupMissionItem> SetupMissions { get; set; } = new();

    [JsonPropertyName("approaches")]
    public List<HeistApproachItem>? Approaches { get; set; }

    [JsonPropertyName("tips")]
    public List<string>? Tips { get; set; }
}

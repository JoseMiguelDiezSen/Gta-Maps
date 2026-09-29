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

// -------------------------------------------------------------
// MODELOS DE GOLPES (HEISTS) DE GTA ONLINE
// -------------------------------------------------------------
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

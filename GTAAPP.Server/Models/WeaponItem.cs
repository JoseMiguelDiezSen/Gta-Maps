using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Modelo representativo de un arma del arsenal de GTA V / GTA Online.
/// Incluye especificaciones balísticas (daño, cadencia, precisión, alcance),
/// fabricante in-game, homólogo en la vida real, precio en Ammu-Nation y accesorios disponibles.
/// </summary>
public class WeaponItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("nameEn")]
    public string? NameEn { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    [JsonPropertyName("manufacturer")]
    public string Manufacturer { get; set; } = string.Empty;

    [JsonPropertyName("realCounterpart")]
    public string? RealCounterpart { get; set; }

    [JsonPropertyName("price")]
    public int Price { get; set; }

    [JsonPropertyName("priceFormatted")]
    public string PriceFormatted { get; set; } = string.Empty;

    [JsonPropertyName("rankUnlock")]
    public int RankUnlock { get; set; }

    [JsonPropertyName("damage")]
    public double Damage { get; set; }

    [JsonPropertyName("fireRate")]
    public double FireRate { get; set; }

    [JsonPropertyName("accuracy")]
    public double Accuracy { get; set; }

    [JsonPropertyName("range")]
    public double Range { get; set; }

    [JsonPropertyName("clipSize")]
    public string? ClipSize { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("attachments")]
    public List<string>? Attachments { get; set; }

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "fa-gun";

    [JsonPropertyName("badgeColor")]
    public string BadgeColor { get; set; } = "#ffb833";

    [JsonPropertyName("hasMk2")]
    public bool HasMk2 { get; set; }

    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = "both";

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }
}

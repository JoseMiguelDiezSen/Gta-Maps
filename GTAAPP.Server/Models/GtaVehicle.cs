using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

public class GtaVehicle
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("manufacturer")]
    public string Manufacturer { get; set; } = string.Empty;

    [JsonPropertyName("dealership")]
    public string Dealership { get; set; } = string.Empty;

    [JsonPropertyName("class")]
    public string Class { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("price")]
    public long Price { get; set; }

    [JsonPropertyName("priceTrade")]
    public long PriceTrade { get; set; }

    [JsonPropertyName("priceFormatted")]
    public string PriceFormatted { get; set; } = string.Empty;

    [JsonPropertyName("speed")]
    public double Speed { get; set; }

    [JsonPropertyName("acceleration")]
    public double Acceleration { get; set; }

    [JsonPropertyName("braking")]
    public double Braking { get; set; }

    [JsonPropertyName("handling")]
    public double Handling { get; set; }

    [JsonPropertyName("weaponized")]
    public bool Weaponized { get; set; }

    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = "both";

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

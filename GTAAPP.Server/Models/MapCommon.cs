using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Coordenadas de posición tridimensional en el mundo de Grand Theft Auto.
/// </summary>
public class MapPosition
{
    [JsonPropertyName("x")]
    public float X { get; set; }

    [JsonPropertyName("y")]
    public float Y { get; set; }

    [JsonPropertyName("z")]
    public float Z { get; set; }
}

/// <summary>
/// Insignia gráfica (icono, color, símbolo) para la representación de marcadores en el mapa.
/// </summary>
public class MapBadge
{
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("color")]
    public string Color { get; set; } = string.Empty;

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = string.Empty;
}

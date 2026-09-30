using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Modelo detallado de un vehículo en el universo de Grand Theft Auto.
/// Almacena especificaciones técnicas de rendimiento (velocidad, aceleración, manejo),
/// concesionario de adquisición, precios de compra y precio especial de intercambio (Trade Price).
/// </summary>
public class GtaVehicle
{
    /// <summary>
    /// Identificador técnico del vehículo (ej. "t20", "oppressor2", "krieger").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Nombre comercial del vehículo (ej. "Pegassi Tezeract", "Benefactor Krieger").
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Fabricante o marca ficticia dentro del lore de GTA (ej. "Pegassi", "Grotti", "Benefactor", "Declasse").
    /// </summary>
    [JsonPropertyName("manufacturer")]
    public string Manufacturer { get; set; } = string.Empty;

    /// <summary>
    /// Concesionario o tienda web del juego donde se adquiere (ej. "Legendary Motorsport", "Warstock Cache &amp; Carry", "Southern San Andreas Super Autos").
    /// </summary>
    [JsonPropertyName("dealership")]
    public string Dealership { get; set; } = string.Empty;

    /// <summary>
    /// Clase oficial según la física del juego (ej. "Super", "Sports", "Motorcycles", "Muscle", "Off-Road").
    /// </summary>
    [JsonPropertyName("class")]
    public string Class { get; set; } = string.Empty;

    /// <summary>
    /// Categoría organizativa para filtros en la aplicación.
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Subtipo o variante específica del vehículo (ej. "Coche eléctrico", "Blindado", "Helicóptero de ataque").
    /// </summary>
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    /// <summary>
    /// Precio estándar de compra en dólares GTA (GTA$).
    /// </summary>
    [JsonPropertyName("price")]
    public long Price { get; set; }

    /// <summary>
    /// Precio especial de intercambio (Trade Price) desbloqueable tras cumplir ciertos requisitos o misiones de preparación.
    /// </summary>
    [JsonPropertyName("priceTrade")]
    public long PriceTrade { get; set; }

    /// <summary>
    /// Representación formateada del precio para visualización (ej. "$2,875,000").
    /// </summary>
    [JsonPropertyName("priceFormatted")]
    public string PriceFormatted { get; set; } = string.Empty;

    /// <summary>
    /// Puntuación de velocidad máxima (en escala estándar de 0 a 100 o km/h teóricos).
    /// </summary>
    [JsonPropertyName("speed")]
    public double Speed { get; set; }

    /// <summary>
    /// Puntuación de aceleración de 0 a 100.
    /// </summary>
    [JsonPropertyName("acceleration")]
    public double Acceleration { get; set; }

    /// <summary>
    /// Puntuación de eficacia de frenado.
    /// </summary>
    [JsonPropertyName("braking")]
    public double Braking { get; set; }

    /// <summary>
    /// Puntuación de maniobrabilidad y estabilidad en curvas (handling).
    /// </summary>
    [JsonPropertyName("handling")]
    public double Handling { get; set; }

    /// <summary>
    /// Indica si el vehículo cuenta con armamento integrado o modificable (misiles guiados, ametralladoras, minas de proximidad).
    /// </summary>
    [JsonPropertyName("weaponized")]
    public bool Weaponized { get; set; }

    /// <summary>
    /// Modo de juego en el que está disponible ("online", "story" o "both").
    /// </summary>
    [JsonPropertyName("gameMode")]
    public string GameMode { get; set; } = "both";

    /// <summary>
    /// URL o ruta local hacia la imagen del vehículo.
    /// </summary>
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Texto de descripción o reseña satírica del vehículo según el sitio web dentro del juego.
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

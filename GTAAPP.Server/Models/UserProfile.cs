using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Perfil del jugador y datos sincronizados con Rockstar Games Social Club (SCAPI).
/// </summary>
public class UserProfile
{
    [MaxLength(100, ErrorMessage = "RockstarId demasiado largo.")]
    [JsonPropertyName("rockstarId")]
    public string? RockstarId { get; set; }

    [Required(ErrorMessage = "El alias es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El alias no puede superar los 50 caracteres.")]
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = "Jugador de Los Santos";

    [MaxLength(2000000, ErrorMessage = "La imagen de avatar supera el tamaño permitido.")]
    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [RegularExpression("^(pc|ps5|xboxsx)$", ErrorMessage = "Plataforma no válida.")]
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = "pc"; // pc, ps5, xboxsx

    [Range(0, 1, ErrorMessage = "Slot de personaje inválido.")]
    [JsonPropertyName("characterSlot")]
    public int CharacterSlot { get; set; } = 0; // 0 = Personaje 1, 1 = Personaje 2

    [JsonPropertyName("isSyncedWithSocialClub")]
    public bool IsSyncedWithSocialClub { get; set; } = false;

    [JsonPropertyName("lastSyncDate")]
    public DateTime? LastSyncDate { get; set; }

    [Range(1, 8000, ErrorMessage = "El nivel debe estar comprendido entre 1 y 8000.")]
    [JsonPropertyName("rank")]
    public int? Rank { get; set; }

    [Range(0, 999999999999, ErrorMessage = "Cantidad de dinero en efectivo no válida.")]
    [JsonPropertyName("cash")]
    public long? Cash { get; set; }

    [Range(0, 999999999999, ErrorMessage = "Cantidad de dinero en banco no válida.")]
    [JsonPropertyName("bank")]
    public long? Bank { get; set; }

    [JsonPropertyName("ownedPropertyIds")]
    public List<string> OwnedPropertyIds { get; set; } = new();

    [JsonPropertyName("collectedItemIds")]
    public List<string> CollectedItemIds { get; set; } = new();

    [JsonPropertyName("highlightOwnedProperties")]
    public bool HighlightOwnedProperties { get; set; } = true;

    [JsonPropertyName("hideCollectedItems")]
    public bool HideCollectedItems { get; set; } = false;
}

/// <summary>
/// Payload recibido desde el UserScript o cliente con datos de sincronización de SCAPI.
/// </summary>
public class SocialClubSyncPayload
{
    [MaxLength(100)]
    [JsonPropertyName("rockstarId")]
    public string? RockstarId { get; set; }

    [MaxLength(50)]
    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }

    [MaxLength(2000000)]
    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [RegularExpression("^(pc|ps5|xboxsx)$")]
    [JsonPropertyName("platform")]
    public string? Platform { get; set; }

    [Range(0, 1)]
    [JsonPropertyName("characterSlot")]
    public int? CharacterSlot { get; set; }

    [Range(1, 8000)]
    [JsonPropertyName("rank")]
    public int? Rank { get; set; }

    [Range(0, 999999999999)]
    [JsonPropertyName("cash")]
    public long? Cash { get; set; }

    [Range(0, 999999999999)]
    [JsonPropertyName("bank")]
    public long? Bank { get; set; }

    [JsonPropertyName("ownedPropertyIds")]
    public List<string>? OwnedPropertyIds { get; set; }

    [JsonPropertyName("collectedItemIds")]
    public List<string>? CollectedItemIds { get; set; }

    [JsonPropertyName("rawScapiData")]
    public object? RawScapiData { get; set; }
}

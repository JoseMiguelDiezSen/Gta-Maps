using System.Text.Json.Serialization;

namespace GTAAPP.Server.Models;

/// <summary>
/// Representa una misión principal de la trama narrativa del Modo Historia de GTA V.
/// </summary>
public class MissionItem
{
    /// <summary>
    /// Identificador único de la misión (ej. "mission-01-prologue").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Título oficial en español de la misión.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Protagonista jugable asignado a la misión ("Michael", "Franklin", "Trevor" o combinaciones).
    /// </summary>
    [JsonPropertyName("character")]
    public string Character { get; set; } = string.Empty;

    /// <summary>
    /// Contacto o personaje que encarga la misión (ej. "Lester", "Lamar", "Devin Weston").
    /// </summary>
    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    /// <summary>
    /// Categoría organizativa de la misión (ej. "Historia", "Golpe", "Preparación").
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Posición cronológica de la misión en la campaña (del 1 al 69).
    /// </summary>
    [JsonPropertyName("order")]
    public int Order { get; set; }

    /// <summary>
    /// Resumen sinopsis de la trama y objetivos de la misión.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Lista de desafíos opcionales exigidos para conseguir la medalla de oro (100% de sincronización).
    /// </summary>
    [JsonPropertyName("goldRequirements")]
    public List<string> GoldRequirements { get; set; } = new();

    /// <summary>
    /// Recompensa monetaria o botín otorgado al concluir con éxito la misión.
    /// </summary>
    [JsonPropertyName("reward")]
    public string? Reward { get; set; }

    /// <summary>
    /// Misión previa requerida para desbloquear esta misión.
    /// </summary>
    [JsonPropertyName("unlockedBy")]
    public string? UnlockedBy { get; set; }

    /// <summary>
    /// Nivel mínimo de personaje requerido (aplicable en misiones de contacto multijugador).
    /// </summary>
    [JsonPropertyName("minLevel")]
    public int? MinLevel { get; set; }

    /// <summary>
    /// Número de jugadores admitidos (ej. "1", "1-4 jugadores").
    /// </summary>
    [JsonPropertyName("players")]
    public string? Players { get; set; }
}

/// <summary>
/// Representa una misión secundaria de Extraños y Locos (Strangers and Freaks) de GTA V Modo Historia.
/// </summary>
public class StrangerMissionItem
{
    /// <summary>
    /// Identificador único de la misión secundaria.
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Orden numérico general en el listado de Extraños y Locos.
    /// </summary>
    [JsonPropertyName("order")]
    public int Order { get; set; }

    /// <summary>
    /// Título en español de la misión.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Título original en inglés de la misión.
    /// </summary>
    [JsonPropertyName("titleEn")]
    public string TitleEn { get; set; } = string.Empty;

    /// <summary>
    /// Identificador técnico de la serie temática (ej. "tonya", "barry", "maryann").
    /// </summary>
    [JsonPropertyName("series")]
    public string Series { get; set; } = string.Empty;

    /// <summary>
    /// Nombre visible del personaje o hilo de la serie (ej. "Misiones de Grúa de Tonya", "Carreras de Hao").
    /// </summary>
    [JsonPropertyName("seriesName")]
    public string SeriesName { get; set; } = string.Empty;

    /// <summary>
    /// Icono representativo de la serie en la UI.
    /// </summary>
    [JsonPropertyName("seriesIcon")]
    public string SeriesIcon { get; set; } = string.Empty;

    /// <summary>
    /// Color temático de la serie.
    /// </summary>
    [JsonPropertyName("seriesColor")]
    public string SeriesColor { get; set; } = string.Empty;

    /// <summary>
    /// Número de misión dentro de la serie del personaje (ej. Misión 2 de 5).
    /// </summary>
    [JsonPropertyName("seriesOrder")]
    public int SeriesOrder { get; set; }

    /// <summary>
    /// Total de misiones que componen esta serie específica.
    /// </summary>
    [JsonPropertyName("seriesTotal")]
    public int SeriesTotal { get; set; }

    /// <summary>
    /// Personaje protagonista necesario para iniciarla ("Franklin", "Michael" o "Trevor").
    /// </summary>
    [JsonPropertyName("character")]
    public string Character { get; set; } = string.Empty;

    /// <summary>
    /// Nombre del contacto o extraño que ofrece la misión.
    /// </summary>
    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    /// <summary>
    /// Indica si esta misión es obligatoria para alcanzar el 100% de progreso del juego.
    /// </summary>
    [JsonPropertyName("requiredFor100")]
    public bool RequiredFor100 { get; set; }

    /// <summary>
    /// Misión o condición previa necesaria para que aparezca en el mapa.
    /// </summary>
    [JsonPropertyName("unlockedBy")]
    public string? UnlockedBy { get; set; }

    /// <summary>
    /// Recompensa obtenida al finalizar la misión.
    /// </summary>
    [JsonPropertyName("reward")]
    public string? Reward { get; set; }

    /// <summary>
    /// Requisitos específicos para conseguir el rango de oro en la misión.
    /// </summary>
    [JsonPropertyName("goldRequirements")]
    public List<string> GoldRequirements { get; set; } = new();

    /// <summary>
    /// Objetivos paso a paso para completar la misión.
    /// </summary>
    [JsonPropertyName("objectives")]
    public List<string> Objectives { get; set; } = new();

    /// <summary>
    /// Descripción del trasfondo y situación humorística o dramática del personaje.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Ruta a la miniatura o captura de la misión.
    /// </summary>
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }

    /// <summary>
    /// Enlace a la guía de vídeo o walkthrough oficial.
    /// </summary>
    [JsonPropertyName("walkthroughUrl")]
    public string? WalkthroughUrl { get; set; }
}

/// <summary>
/// Misión preliminar o preparatoria de un Golpe de GTA Online (adquisición de vehículos de escape, disfraces, taladros).
/// </summary>
public class HeistSetupMissionItem
{
    /// <summary>
    /// Nombre de la misión preparatoria.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de preparación ("Obligatoria", "Opcional").
    /// </summary>
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    /// <summary>
    /// Instrucciones y descripción táctica de la preparación.
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

/// <summary>
/// Vía táctica o enfoque de asalto para un Golpe (Sigilo, Agresivo, Infiltración con disfraces, etc.).
/// </summary>
public class HeistApproachItem
{
    /// <summary>
    /// Identificador del enfoque táctico.
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Nombre descriptivo del enfoque táctico.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Explicación operativa de la estrategia a seguir.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Cifras estimadas de botín recaudable en un Golpe según la dificultad (Normal vs Difícil).
/// </summary>
public class HeistPotentialTake
{
    /// <summary>
    /// Botín máximo en dificultad normal.
    /// </summary>
    [JsonPropertyName("normal")]
    public string Normal { get; set; } = string.Empty;

    /// <summary>
    /// Botín máximo en dificultad difícil.
    /// </summary>
    [JsonPropertyName("hard")]
    public string? Hard { get; set; }

    /// <summary>
    /// Notas explicativas de deducciones (comisiones de Lester, tripulación, daños recibidos).
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

/// <summary>
/// Modelo exhaustivo de un Golpe (Heist) de GTA Online.
/// </summary>
public class HeistItem
{
    /// <summary>
    /// Identificador único del golpe (ej. "heist-fleeca", "heist-cayo-perico", "heist-kortz-center").
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Orden correlativo en el catálogo cronológico de golpes (1 a 12).
    /// </summary>
    [JsonPropertyName("order")]
    public int Order { get; set; }

    /// <summary>
    /// Título oficial del golpe en español.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Título oficial del golpe en inglés.
    /// </summary>
    [JsonPropertyName("titleEn")]
    public string TitleEn { get; set; } = string.Empty;

    /// <summary>
    /// Identificador de categoría (ej. "heists").
    /// </summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Etiqueta visual de la categoría.
    /// </summary>
    [JsonPropertyName("categoryLabel")]
    public string CategoryLabel { get; set; } = string.Empty;

    /// <summary>
    /// Contacto o cerebro detrás de la operación (ej. "Lester Crest", "Pavel", "Franklin Clinton").
    /// </summary>
    [JsonPropertyName("giver")]
    public string Giver { get; set; } = string.Empty;

    /// <summary>
    /// Rango de jugadores requeridos (ej. "2 jugadores", "1-4 jugadores").
    /// </summary>
    [JsonPropertyName("players")]
    public string Players { get; set; } = string.Empty;

    /// <summary>
    /// Nivel de rango mínimo requerido para ejercer de anfitrión del golpe.
    /// </summary>
    [JsonPropertyName("minLevel")]
    public int MinLevel { get; set; } = 1;

    /// <summary>
    /// Propiedad inmobiliaria obligatoria para iniciar la planificación (apartamento de lujo, arcade, submarino Kosatka, etc.).
    /// </summary>
    [JsonPropertyName("propertyRequired")]
    public string PropertyRequired { get; set; } = string.Empty;

    /// <summary>
    /// Coste económico en GTA$ que el líder debe abonar para comenzar los preparativos.
    /// </summary>
    [JsonPropertyName("setupCost")]
    public decimal SetupCost { get; set; }

    /// <summary>
    /// Coste de preparación formateado para visualización (ej. "$25,000").
    /// </summary>
    [JsonPropertyName("setupCostFormatted")]
    public string SetupCostFormatted { get; set; } = string.Empty;

    /// <summary>
    /// Estructura con las estimaciones de botín potencial en dificultades normal y difícil.
    /// </summary>
    [JsonPropertyName("potentialTake")]
    public HeistPotentialTake? PotentialTake { get; set; }

    /// <summary>
    /// Objetivo principal del golpe (caja fuerte del banco, archivos de la IAA, bóveda del casino, colección de arte).
    /// </summary>
    [JsonPropertyName("target")]
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Ubicación física del asalto dentro del mapa.
    /// </summary>
    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Descripción táctica y contextual de la trama del golpe.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Ruta a la miniatura o imagen de portada del golpe.
    /// </summary>
    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    /// <summary>
    /// Color temático de la tarjeta o insignia del golpe.
    /// </summary>
    [JsonPropertyName("badgeColor")]
    public string BadgeColor { get; set; } = "#ffb833";

    /// <summary>
    /// Icono de FontAwesome asignado al golpe (ej. "fa-sack-dollar").
    /// </summary>
    [JsonPropertyName("badgeIcon")]
    public string BadgeIcon { get; set; } = "fa-sack-dollar";

    /// <summary>
    /// Desafíos de élite para obtener bonificaciones económicas adicionales (ej. tiempo límite, sin muertes, sin reiniciar).
    /// </summary>
    [JsonPropertyName("eliteChallenges")]
    public List<string> EliteChallenges { get; set; } = new();

    /// <summary>
    /// Recompensa extra en GTA$ otorgada al completar todos los desafíos de élite.
    /// </summary>
    [JsonPropertyName("eliteReward")]
    public string? EliteReward { get; set; }

    /// <summary>
    /// Lista de vehículos cuyo precio especial con descuento (Trade Price) se desbloquea tras finalizar el golpe.
    /// </summary>
    [JsonPropertyName("unlockedVehicles")]
    public List<string>? UnlockedVehicles { get; set; }

    /// <summary>
    /// Lista de misiones preparatorias necesarias antes del gran asalto.
    /// </summary>
    [JsonPropertyName("setupMissions")]
    public List<HeistSetupMissionItem> SetupMissions { get; set; } = new();

    /// <summary>
    /// Distintos enfoques tácticos posibles si el golpe admite variedad de estrategias.
    /// </summary>
    [JsonPropertyName("approaches")]
    public List<HeistApproachItem>? Approaches { get; set; }

    /// <summary>
    /// Consejos estratégicos y trucos de la comunidad para maximizar el rendimiento y la supervivencia.
    /// </summary>
    [JsonPropertyName("tips")]
    public List<string>? Tips { get; set; }
}

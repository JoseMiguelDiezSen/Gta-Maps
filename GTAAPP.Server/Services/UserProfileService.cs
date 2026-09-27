using System.Net;
using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio de persistencia y gestión del perfil de juego de GTA con sanitización de entradas anti-XSS.
/// </summary>
public class UserProfileService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<UserProfileService> _logger;
    private readonly string _filePath;
    private readonly object _lock = new();
    private UserProfile _profile;

    public UserProfileService(IWebHostEnvironment env, ILogger<UserProfileService> logger)
    {
        _env = env;
        _logger = logger;
        
        var baseDir = _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
        _filePath = Path.Combine(baseDir, "data", "user_profile.json");

        _profile = LoadProfile();
    }

    /// <summary>
    /// Obtener perfil activo.
    /// </summary>
    public UserProfile GetProfile()
    {
        lock (_lock)
        {
            return _profile;
        }
    }

    /// <summary>
    /// Guardar perfil.
    /// </summary>
    public UserProfile SaveProfile(UserProfile updated)
    {
        lock (_lock)
        {
            SanitizeProfile(updated);
            _profile = updated;
            PersistProfile();
            return _profile;
        }
    }

    /// <summary>
    /// Sincronización desde SCAPI.
    /// </summary>
    public UserProfile SyncFromSocialClub(SocialClubSyncPayload payload)
    {
        lock (_lock)
        {
            if (!string.IsNullOrWhiteSpace(payload.RockstarId))
                _profile.RockstarId = payload.RockstarId;

            if (!string.IsNullOrWhiteSpace(payload.Nickname))
                _profile.Nickname = payload.Nickname;

            if (!string.IsNullOrWhiteSpace(payload.AvatarUrl))
                _profile.AvatarUrl = payload.AvatarUrl;

            if (!string.IsNullOrWhiteSpace(payload.Platform))
                _profile.Platform = payload.Platform;

            if (payload.CharacterSlot.HasValue)
                _profile.CharacterSlot = payload.CharacterSlot.Value;

            if (payload.Rank.HasValue)
                _profile.Rank = payload.Rank.Value;

            if (payload.Cash.HasValue)
                _profile.Cash = payload.Cash.Value;

            if (payload.Bank.HasValue)
                _profile.Bank = payload.Bank.Value;

            if (payload.OwnedPropertyIds != null)
                _profile.OwnedPropertyIds = payload.OwnedPropertyIds;

            if (payload.CollectedItemIds != null)
                _profile.CollectedItemIds = payload.CollectedItemIds;

            _profile.IsSyncedWithSocialClub = true;
            _profile.LastSyncDate = DateTime.UtcNow;

            SanitizeProfile(_profile);
            PersistProfile();
            return _profile;
        }
    }

    private static void SanitizeProfile(UserProfile profile)
    {
        if (profile == null) return;

        if (!string.IsNullOrWhiteSpace(profile.Nickname))
        {
            var raw = profile.Nickname.Trim();
            if (raw.Length > 50) raw = raw.Substring(0, 50);
            profile.Nickname = WebUtility.HtmlEncode(raw);
        }
        else
        {
            profile.Nickname = "Jugador de Los Santos";
        }

        if (!string.IsNullOrWhiteSpace(profile.AvatarUrl))
        {
            var url = profile.AvatarUrl.Trim();
            // Permite esquemas seguros de data:image o https://
            if (!(url.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
                  url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                profile.AvatarUrl = null;
            }
            else if (url.Length > 2_000_000)
            {
                profile.AvatarUrl = null;
            }
        }

        if (profile.Rank.HasValue)
        {
            profile.Rank = Math.Clamp(profile.Rank.Value, 1, 8000);
        }

        if (profile.Cash.HasValue && profile.Cash.Value < 0)
        {
            profile.Cash = 0;
        }

        if (profile.Bank.HasValue && profile.Bank.Value < 0)
        {
            profile.Bank = 0;
        }

        if (profile.Platform != "pc" && profile.Platform != "ps5" && profile.Platform != "xboxsx")
        {
            profile.Platform = "pc";
        }
    }

    private UserProfile LoadProfile()
    {
        try
        {
            if (File.Exists(_filePath))
            {
                var json = File.ReadAllText(_filePath);
                var loaded = JsonSerializer.Deserialize<UserProfile>(json);
                if (loaded != null) return loaded;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cargar user_profile.json.");
        }

        return new UserProfile();
    }

    private void PersistProfile()
    {
        try
        {
            var dir = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var json = JsonSerializer.Serialize(_profile, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_filePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al persistir user_profile.json.");
        }
    }
}

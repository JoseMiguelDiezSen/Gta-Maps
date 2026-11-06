using System.Collections.Concurrent;
using System.Text.Json;

namespace GTAAPP.Server.Services;

/// <summary>
/// Entrega de las rutas públicas de la web: redirecciones antiguas y index.html con el título,
/// la descripción, el canonical y el texto para rastreadores de cada ruta e idioma.
/// </summary>
public interface ISeoService
{
    IResult GetSitemap();
    IResult GetRobots();
    Task HandleRequestAsync(HttpContext ctx);
}

public class SeoService : ISeoService
{
    private readonly IWebHostEnvironment _env;

    private static readonly HashSet<string> SupportedSeoLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "es", "en", "pt", "zh", "fr", "de", "it", "ru", "ar", "ja", "hi", "tr", "ko"
    };

    private readonly ConcurrentDictionary<string, IReadOnlyDictionary<string, string>> _seoDictionaryCache = new(StringComparer.OrdinalIgnoreCase);

    private IReadOnlyDictionary<string, string> GetSeoTranslations(string langCode)
    {
        return _seoDictionaryCache.GetOrAdd(langCode, code =>
        {
            var candidates = new[]
            {
                Path.Combine(_env.WebRootPath ?? string.Empty, "assets", "i18n", $"{code}.json"),
                Path.Combine(_env.ContentRootPath, "..", "gtaapp.client", "src", "assets", "i18n", $"{code}.json")
            };

            foreach (var candidate in candidates)
            {
                if (!File.Exists(candidate)) continue;
                try
                {
                    using var doc = JsonDocument.Parse(File.ReadAllBytes(candidate));
                    if (doc.RootElement.TryGetProperty("seo", out var seoNode) && seoNode.ValueKind == JsonValueKind.Object)
                    {
                        var map = new Dictionary<string, string>(StringComparer.Ordinal);
                        foreach (var prop in seoNode.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.String)
                            {
                                map[prop.Name] = prop.Value.GetString() ?? string.Empty;
                            }
                        }
                        return map;
                    }
                }
                catch
                {
                    // Fallback seguro a textos base si hubiera error de lectura
                }
            }

            return new Dictionary<string, string>(StringComparer.Ordinal);
        });
    }

    private static readonly Dictionary<string, (string CanonicalPath, string TitleKey, string DescriptionKey, string Title, string Description, string Canonical)> SeoRoutes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/home"] = (
            "/home",
            "homeTitle",
            "homeDesc",
            "GTA Explorer - Mapas HD de GTA V y GTA VI con asistente de IA y guías interactivas",
            "Plataforma en 13 idiomas con mapas HD y guías interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online, con asistente de IA integrado, misiones, ubicaciones, vehículos, armas y misterios.",
            "https://gtaexplorer.com/home"
        ),
        ["/gta5-map-online"] = (
            "/gta5-map-online",
            "gta5OnlineTitle",
            "gta5OnlineDesc",
            "Mapa GTA V Online | GTA Explorer",
            "Mapa interactivo en HD de GTA 5 Online y Cayo Perico. Misiones, Propiedades, Vehículos, Armas, Negocios, Golpes, Misterios y asistente IA en tiempo real.",
            "https://gtaexplorer.com/gta5-map-online"
        ),
        ["/gta5-map-offline"] = (
            "/gta5-map-offline",
            "gta5HistoriaTitle",
            "gta5HistoriaDesc",
            "Mapa GTA V Modo Historia | GTA Explorer",
            "Mapa interactivo de GTA V en HD: Misiones Principales, Cartas, Coleccionables, Saltos y Misterios.",
            "https://gtaexplorer.com/gta5-map-offline"
        ),
        ["/gta5-guia-offline"] = (
            "/gta5-guia-offline",
            "gta5GuiaTitle",
            "gta5GuiaDesc",
            "Guía GTA V Modo Historia | GTA Explorer",
            "Guía completa y enciclopedia de GTA V: requisitos del 100%, guía táctica de los 6 golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.",
            "https://gtaexplorer.com/gta5-guia-offline"
        ),
        ["/gta5-guia-online"] = (
            "/gta5-guia-online",
            "gta5GuiaOnlineTitle",
            "gta5GuiaOnlineDesc",
            "Guía GTA V Online | GTA Explorer",
            "Guía completa de GTA V Online: misiones de contacto, golpes, negocios, propiedades, vehículos, armas y misterios de Los Santos.",
            "https://gtaexplorer.com/gta5-guia-online"
        ),
        ["/gta6-map-online"] = (
            "/gta6-map-online",
            "gta6OnlineTitle",
            "gta6OnlineDesc",
            "Mapa GTA VI Online | GTA Explorer",
            "Mapa interactivo en HD de GTA 6 Online en Vice City y Leonida. Puntos de interés, carreteras, secretos, noticias y novedades.",
            "https://gtaexplorer.com/gta6-map-online"
        ),
        ["/gta6-map-offline"] = (
            "/gta6-map-offline",
            "gta6HistoriaTitle",
            "gta6HistoriaDesc",
            "Mapa GTA VI Modo Historia | GTA Explorer",
            "Mapa interactivo del modo historia de GTA VI con Jason y Lucia. Mapa HD de Vice City, Misiones, Coleccionables y secretos.",
            "https://gtaexplorer.com/gta6-map-offline"
        ),
        ["/gta6-guia-offline"] = (
            "/gta6-guia-offline",
            "gta6GuiaTitle",
            "gta6GuiaDesc",
            "Guía GTA VI Modo Historia | GTA Explorer",
            "Enciclopedia interactiva de GTA VI: distritos de Vice City, estado de Leonida, análisis de Jason & Lucia, inventario en maleteros y mecánicas.",
            "https://gtaexplorer.com/gta6-guia-offline"
        ),
        ["/gta6-guia-online"] = (
            "/gta6-guia-online",
            "gta6GuiaOnlineTitle",
            "gta6GuiaOnlineDesc",
            "Guía GTA VI Online | GTA Explorer",
            "Guía interactiva y base de datos de GTA VI Online: primeros pasos, misiones, operaciones y catálogo de vehículos en Vice City y Leonida.",
            "https://gtaexplorer.com/gta6-guia-online"
        ),
        ["/gta6-videos"] = (
            "/gta6-videos",
            "gta6VideosTitle",
            "gta6VideosDesc",
            "Vídeos GTA VI | GTA Explorer",
            "Recopilación de vídeos y clips breves de gameplay, situaciones curiosas y surrealistas en Grand Theft Auto VI y el Estado de Leonida.",
            "https://gtaexplorer.com/gta6-videos"
        )
    };

    // Texto para rastreadores que no ejecutan JavaScript: cada ruta e idioma recibe su título,
    // su descripción y enlaces en ese idioma, en lugar del bloque genérico en español de index.html.
    private string InjectNoscriptContent(string html, string canonicalPath, string title, string description, string lang)
    {
        var start = html.IndexOf("<noscript>", StringComparison.Ordinal);
        var end = start < 0 ? -1 : html.IndexOf("</noscript>", start, StringComparison.Ordinal);
        if (end < 0) return html;

        static string Encode(string text) => text
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal);

        static string Href(string path, string code) =>
            string.Equals(code, "es", StringComparison.Ordinal) ? path : $"{path}?lang={code}";

        static string WithoutBrand(string text) =>
            text.Replace(" | GTA Explorer", string.Empty, StringComparison.Ordinal);

        (string Code, string Name)[] languages =
        [
            ("es", "Español"), ("en", "English"), ("pt", "Português"), ("zh", "简体中文"), ("fr", "Français"),
            ("de", "Deutsch"), ("it", "Italiano"), ("ru", "Русский"), ("ar", "العربية"), ("ja", "日本語"),
            ("hi", "हिन्दी"), ("tr", "Türkçe"), ("ko", "한국어")
        ];

        var translations = string.Equals(lang, "es", StringComparison.Ordinal) ? null : GetSeoTranslations(lang);
        var pageLinks = SeoRoutes.Values
            .Where(route => !string.Equals(route.CanonicalPath, "/home", StringComparison.Ordinal))
            .Select(route =>
            {
                var label = translations is not null
                    && translations.TryGetValue(route.TitleKey, out var translated)
                    && !string.IsNullOrWhiteSpace(translated)
                        ? translated
                        : route.Title;
                return $"<a href=\"{Href(route.CanonicalPath, lang)}\" style=\"color: #4da6ff; margin: 0 10px;\">{Encode(WithoutBrand(label))}</a>";
            });
        var languageLinks = languages.Select(item =>
            $"<a href=\"{Href(canonicalPath, item.Code)}\" style=\"color: #aaa; margin: 0 6px;\">{item.Name}</a>");

        var content = $"""
            <noscript>
                <div style="padding: 20px; font-family: sans-serif; text-align: center; color: #fff; background-color: #121212;">
                  <h1>{Encode(WithoutBrand(title))}</h1>
                  <p>{Encode(description)}</p>
                  <p>{string.Join(" | ", pageLinks)}</p>
                  <p>{string.Join(" | ", languageLinks)}</p>
                </div>

            """;
        return string.Concat(html.AsSpan(0, start), content, html.AsSpan(end));
    }

    private static readonly Dictionary<string, string> LegacyRedirects = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/index.html"] = "/home",
        ["/gta6-guia"] = "/gta6-guia-offline",
        ["/gta5-guia"] = "/gta5-guia-online",
        ["/gta6-momentos"] = "/gta6-videos",
        ["/gta6-noticias"] = "/gta6-videos",
        ["/noticias"] = "/gta6-videos",
        ["/gta6/noticias"] = "/gta6-videos",
        ["/gta6noticias"] = "/gta6-videos",
        ["/momentos"] = "/gta6-videos",
        ["/gta6/momentos"] = "/gta6-videos",
        ["/gta6momentos"] = "/gta6-videos",
        ["/videos"] = "/gta6-videos",
        ["/gta6/videos"] = "/gta6-videos",
        ["/gta6videos"] = "/gta6-videos",
        ["/gta5"] = "/gta5-map-online",
        ["/gta5online"] = "/gta5-map-online",
        ["/gta5/online"] = "/gta5-map-online",
        ["/gta5/historia"] = "/gta5-map-offline",
        ["/gta5historia"] = "/gta5-map-offline",
        ["/gta5/guia"] = "/gta5-guia-online",
        ["/gta5/guia/offline"] = "/gta5-guia-offline",
        ["/gta5/guia/online"] = "/gta5-guia-online",
        ["/gta5guia"] = "/gta5-guia-online",
        ["/gt5"] = "/gta5-map-online",
        ["/gta6"] = "/gta6-map-online",
        ["/gta6online"] = "/gta6-map-online",
        ["/gta6/online"] = "/gta6-map-online",
        ["/gta6/historia"] = "/gta6-map-offline",
        ["/gta6historia"] = "/gta6-map-offline",
        ["/gta6/guia"] = "/gta6-guia-offline",
        ["/gta6/guia/offline"] = "/gta6-guia-offline",
        ["/gta6/guia/online"] = "/gta6-guia-online",
        ["/gta6guia"] = "/gta6-guia-offline"
    };

    public SeoService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public IResult GetSitemap() => ServeRootFile("sitemap.xml", "application/xml; charset=utf-8");

    public IResult GetRobots() => ServeRootFile("robots.txt", "text/plain; charset=utf-8");

    private IResult ServeRootFile(string fileName, string contentType)
    {
        var path = Path.Combine(_env.WebRootPath, fileName);
        return File.Exists(path) ? Results.File(path, contentType) : Results.NotFound();
    }

    public async Task HandleRequestAsync(HttpContext ctx)
    {
        var rawPath = ctx.Request.Path.Value ?? "/";
        var qs = ctx.Request.QueryString.HasValue ? ctx.Request.QueryString.Value : string.Empty;
        var trimmedPath = rawPath.Length > 1 ? rawPath.TrimEnd('/') : rawPath;

        if (LegacyRedirects.TryGetValue(trimmedPath, out var targetRoute))
        {
            ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
            ctx.Response.Headers.Location = $"https://gtaexplorer.com{targetRoute}{qs}";
            return;
        }

        if (!SeoRoutes.TryGetValue(trimmedPath, out var seo))
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            ctx.Response.ContentType = "text/plain; charset=utf-8";
            if (!HttpMethods.IsHead(ctx.Request.Method))
            {
                await ctx.Response.WriteAsync("404 Not Found");
            }
            return;
        }

        // Forzar coincidencia exacta (minúsculas y sin barra final) hacia la URL canónica oficial
        if (!string.Equals(rawPath, seo.CanonicalPath, StringComparison.Ordinal))
        {
            ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
            ctx.Response.Headers.Location = $"{seo.Canonical}{qs}";
            return;
        }

        // Normalización de parámetro ?lang=: ?lang=es o valores no soportados redirigen 301 a la URL canónica limpia
        var rawLang = ctx.Request.Query["lang"].FirstOrDefault()?.Trim().ToLowerInvariant();
        var activeLang = "es";
        if (!string.IsNullOrEmpty(rawLang))
        {
            if (string.Equals(rawLang, "es", StringComparison.Ordinal) || !SupportedSeoLanguages.Contains(rawLang))
            {
                var filteredPairs = ctx.Request.Query
                    .Where(kv => !string.Equals(kv.Key, "lang", StringComparison.OrdinalIgnoreCase))
                    .SelectMany(kv => kv.Value.Select(v => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(v ?? string.Empty)}"))
                    .ToList();
                var cleanQs = filteredPairs.Count > 0 ? $"?{string.Join("&", filteredPairs)}" : string.Empty;
                ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
                ctx.Response.Headers.Location = $"{seo.Canonical}{cleanQs}";
                return;
            }

            // Canonicalizar también mayúsculas en ?lang=EN -> ?lang=en
            var rawLangCase = ctx.Request.Query["lang"].FirstOrDefault()?.Trim() ?? string.Empty;
            if (!string.Equals(rawLangCase, rawLang, StringComparison.Ordinal))
            {
                ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
                ctx.Response.Headers.Location = $"{seo.Canonical}?lang={rawLang}";
                return;
            }

            activeLang = rawLang;
        }

        var indexPath = Path.Combine(_env.WebRootPath, "index.html");
        if (!File.Exists(indexPath))
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var resolvedTitle = seo.Title;
        var resolvedDesc = seo.Description;
        if (!string.Equals(activeLang, "es", StringComparison.Ordinal))
        {
            var localizedDict = GetSeoTranslations(activeLang);
            if (localizedDict.TryGetValue(seo.TitleKey, out var tVal) && !string.IsNullOrWhiteSpace(tVal))
            {
                resolvedTitle = tVal;
            }
            if (localizedDict.TryGetValue(seo.DescriptionKey, out var dVal) && !string.IsNullOrWhiteSpace(dVal))
            {
                resolvedDesc = dVal;
            }
        }

        var html = await File.ReadAllTextAsync(indexPath);
        var canonicalUrl = string.Equals(activeLang, "es", StringComparison.Ordinal)
            ? seo.Canonical
            : $"{seo.Canonical}?lang={activeLang}";
        var safeTitle = resolvedTitle.Replace("&", "&amp;", StringComparison.Ordinal).Replace("\"", "&quot;", StringComparison.Ordinal);
        var safeDesc = resolvedDesc.Replace("&", "&amp;", StringComparison.Ordinal).Replace("\"", "&quot;", StringComparison.Ordinal);

        // Emitir Schema.org WebSite / Organization / WebApplication exclusivamente en /home
        if (!string.Equals(seo.CanonicalPath, "/home", StringComparison.Ordinal))
        {
            const string jsonLdStart = "<!-- Datos estructurados para Google e IAs (Schema.org / JSON-LD) -->";
            const string jsonLdEnd = "<!-- /Datos estructurados para Google e IAs -->";
            var startIdx = html.IndexOf(jsonLdStart, StringComparison.Ordinal);
            if (startIdx >= 0)
            {
                var endIdx = html.IndexOf(jsonLdEnd, startIdx, StringComparison.Ordinal);
                if (endIdx >= startIdx)
                {
                    html = html.Remove(startIdx, endIdx + jsonLdEnd.Length - startIdx);
                }
            }
        }
        else if (!string.Equals(activeLang, "es", StringComparison.Ordinal))
        {
            var jsonSafeDesc = JsonEncodedText.Encode(resolvedDesc).ToString();
            html = html
                .Replace(
                    "\"Plataforma internacional multilingüe en 13 idiomas (español, inglés, portugués, chino, francés, alemán, italiano, ruso, árabe, japonés, hindi, turco y coreano) de mapas interactivos Ultra HD y guías completas para GTA 5 y GTA 6 con asistente de inteligencia artificial integrado.\"",
                    $"\"{jsonSafeDesc}\"",
                    StringComparison.Ordinal)
                .Replace(
                    "\"Plataforma internacional multilingüe en 13 idiomas de mapas interactivos en Ultra HD y guías paso a paso de GTA V y GTA VI con asistente IA integrado, coleccionables al 100%, misterios, misiones y vehículos en tiempo real.\"",
                    $"\"{jsonSafeDesc}\"",
                    StringComparison.Ordinal);
        }

        html = html
            .Replace(
                "<html lang=\"es\"",
                $"<html lang=\"{activeLang}\"",
                StringComparison.Ordinal)
            .Replace(
                "<title>GTA Explorer - Mapas HD de GTA V y GTA VI con asistente de IA y guías interactivas</title>",
                $"<title>{safeTitle}</title>",
                StringComparison.Ordinal)
            .Replace(
                "<meta name=\"description\" content=\"Plataforma en 13 idiomas con mapas HD y guías interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online, con asistente de IA integrado, misiones, ubicaciones, vehículos, armas y misterios.\">",
                $"<meta name=\"description\" content=\"{safeDesc}\">",
                StringComparison.Ordinal)
            .Replace(
                "<link rel=\"canonical\" href=\"https://gtaexplorer.com/home\">",
                $"<link rel=\"canonical\" href=\"{canonicalUrl}\">",
                StringComparison.Ordinal)
            .Replace(
                "<link rel=\"alternate\" hreflang=\"es\" href=\"https://gtaexplorer.com/home\">",
                $"<link rel=\"alternate\" hreflang=\"es\" href=\"{seo.Canonical}\">",
                StringComparison.Ordinal)
            .Replace(
                "href=\"https://gtaexplorer.com/home?lang=",
                $"href=\"{seo.Canonical}?lang=",
                StringComparison.Ordinal)
            .Replace(
                "<meta property=\"og:url\" content=\"https://gtaexplorer.com/home\">",
                $"<meta property=\"og:url\" content=\"{canonicalUrl}\">",
                StringComparison.Ordinal)
            .Replace(
                "<meta property=\"og:title\" content=\"GTA Explorer - Mapas y guías de GTA 5 y GTA 6\">",
                $"<meta property=\"og:title\" content=\"{safeTitle}\">",
                StringComparison.Ordinal)
            .Replace(
                "<meta property=\"og:description\" content=\"Plataforma en 13 idiomas con mapas HD y guías interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online, con asistente de IA integrado, misiones, ubicaciones, vehículos, armas y misterios.\">",
                $"<meta property=\"og:description\" content=\"{safeDesc}\">",
                StringComparison.Ordinal)
            .Replace(
                "<meta name=\"twitter:title\" content=\"GTA Explorer - Mapas y guías de GTA 5 y GTA 6\">",
                $"<meta name=\"twitter:title\" content=\"{safeTitle}\">",
                StringComparison.Ordinal)
            .Replace(
                "<meta name=\"twitter:description\" content=\"Plataforma en 13 idiomas con mapas HD y guías interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online, con asistente de IA integrado, misiones, ubicaciones, vehículos, armas y misterios.\">",
                $"<meta name=\"twitter:description\" content=\"{safeDesc}\">",
                StringComparison.Ordinal);

        html = InjectNoscriptContent(html, seo.CanonicalPath, resolvedTitle, resolvedDesc, activeLang);

        ctx.Response.StatusCode = StatusCodes.Status200OK;
        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
        ctx.Response.Headers.Pragma = "no-cache";
        ctx.Response.Headers.Expires = "0";
        if (!HttpMethods.IsHead(ctx.Request.Method))
        {
            await ctx.Response.WriteAsync(html);
        }
    }
}

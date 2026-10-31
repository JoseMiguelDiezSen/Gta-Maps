using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using GTAAPP.Server.Middleware;
using GTAAPP.Server.Hubs;
using GTAAPP.Server.Extensions;

// =========================================================================================
// PUNTO DE ENTRADA Y CONFIGURACIÓN DEL SERVIDOR WEB ASP.NET CORE (.NET 10)
// Configura Kestrel, HSTS, CORS, Rate Limiting, Inyección de Dependencias, SignalR y Archivos Estáticos.
// =========================================================================================

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// 1. Eliminar cabecera 'Server' y fijar límites de tamaño y timeouts contra DoS
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.AddServerHeader = false;
    serverOptions.Limits.MaxRequestBodySize = 64 * 1024; // Límite estricto de 64 KB por petición (anti-DoS)
    serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});

// 2. Soporte para proxy inverso local (Nginx en loopback) blindado contra falsificación de X-Forwarded-For
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
});

// 3. Política HSTS estricta (HTTP Strict Transport Security) para forzar HTTPS en navegadores
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

// 4. Registro de Controladores de API y SignalR para comunicación en tiempo real
builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1024; // 1 KB máximo por mensaje WebSocket (anti-DoS)
    options.HandshakeTimeout = TimeSpan.FromSeconds(10);
});

// 5. Configuración de CORS basada en entorno (desarrollo local vs dominios autorizados en producción)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            // En desarrollo local permite conexiones desde loopback (localhost)
            policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // En producción restringe estrictamente a los orígenes definidos en configuración
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .WithMethods("GET", "POST", "OPTIONS")
                  .AllowCredentials();
        }
    });
});

// 6. Rate Limiting nativo (.NET 10) modularizado
builder.Services.AddAppRateLimiting();

// 7. Servicios singleton y scoped de negocio
builder.Services.AddSingleton<GTAAPP.Server.Services.VehiclesService>();
builder.Services.AddSingleton<GTAAPP.Server.Services.IGuiaService, GTAAPP.Server.Services.GuiaService>();
builder.Services.AddScoped<GTAAPP.Server.Services.IEmailService, GTAAPP.Server.Services.EmailService>();
builder.Services.AddHttpClient<GTAAPP.Server.Services.IGotyService, GTAAPP.Server.Services.GotyService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8); // Timeout rápido de 8 segundos para evitar bloqueos
});

// 8. Documentación interactiva de la API con OpenAPI / Swagger (solo en desarrollo)
builder.Services.AddOpenApi();

var app = builder.Build();

// =========================================================================================
// PIPELINE DE PROCESAMIENTO HTTP
// =========================================================================================

// Respetar encabezados reenviados por proxies inversos (X-Forwarded-For, X-Forwarded-Proto)
app.UseForwardedHeaders();

// Inyectar cabeceras defensivas de seguridad (CSP, X-Frame-Options, X-Content-Type-Options) y cortafuegos de métodos
app.UseSecurityHeaders();

// Blindaje de excepciones: En producción nunca se filtran trazas internas ni detalles del servidor
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Internal Server Error",
                message = "Ha ocurrido un error inesperado al procesar la solicitud."
            });
        });
    });
    app.UseHsts();
}
else
{
    app.MapOpenApi();
}

// Redirección forzada de HTTP a HTTPS
app.UseHttpsRedirection();

// Aplicar políticas de CORS y Rate Limiting
app.UseCors();
app.UseRateLimiter();

// Redirección canónica 301 de la raíz "/" e "/index.html" hacia "/home" antes de servir estáticos
app.Use(async (ctx, next) =>
{
    var rawPath = ctx.Request.Path.Value ?? "/";
    if (string.Equals(rawPath, "/", StringComparison.Ordinal) ||
        string.Equals(rawPath, "/index.html", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(rawPath, "/index.htm", StringComparison.OrdinalIgnoreCase))
    {
        var qs = ctx.Request.QueryString.HasValue ? ctx.Request.QueryString.Value : string.Empty;
        ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
        ctx.Response.Headers.Location = $"https://gtaexplorer.com/home{qs}";
        return;
    }

    await next();
});

// Proveedor de tipos MIME estándar
var staticContentTypeProvider = new FileExtensionContentTypeProvider();
staticContentTypeProvider.Mappings[".html"] = "text/html";
staticContentTypeProvider.Mappings[".js"] = "application/javascript";
staticContentTypeProvider.Mappings[".json"] = "application/json";
staticContentTypeProvider.Mappings[".css"] = "text/css";
staticContentTypeProvider.Mappings[".xml"] = "application/xml";
staticContentTypeProvider.Mappings[".txt"] = "text/plain";
staticContentTypeProvider.Mappings[".ico"] = "image/x-icon";
staticContentTypeProvider.Mappings[".webp"] = "image/webp";
staticContentTypeProvider.Mappings[".woff2"] = "font/woff2";
staticContentTypeProvider.Mappings[".otf"] = "font/otf";
staticContentTypeProvider.Mappings[".webmanifest"] = "application/manifest+json";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticContentTypeProvider,
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? string.Empty;

        // HTML nunca debe cachearse agresivamente para permitir actualizaciones inmediatas de la SPA
        if (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase) || path == "/" || string.IsNullOrEmpty(path))
        {
            ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers.Pragma = "no-cache";
            ctx.Context.Response.Headers.Expires = "0";
        }
        // Archivos estáticos inmutables (tiles webp, fuentes, estilos y scripts compilados)
        else if (path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".otf", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".woff2", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".woff", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".ttf", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".css", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        }
        // Iconos, imágenes PNG/JPG/SVG, datasets JSON y archivos SEO (revalidación diaria sin bloqueo de 1 año)
        else if (path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=86400, stale-while-revalidate=604800";
        }
    }
});
app.MapStaticAssets();

// Mapeo de controladores REST y Hubs de SignalR
app.MapControllers();
app.MapHub<UsuariosActivosHub>("/hubs/usuarios-activos");

// Mapeo directo y garantizado para SEO (elimina error 500 por compresión/estáticos)
app.MapMethods("/sitemap.xml", ["GET", "HEAD"], (IWebHostEnvironment env) =>
{
    var path = Path.Combine(env.WebRootPath, "sitemap.xml");
    return File.Exists(path)
        ? Results.File(path, "application/xml; charset=utf-8")
        : Results.NotFound();
});

app.MapMethods("/robots.txt", ["GET", "HEAD"], (IWebHostEnvironment env) =>
{
    var path = Path.Combine(env.WebRootPath, "robots.txt");
    return File.Exists(path)
        ? Results.File(path, "text/plain; charset=utf-8")
        : Results.NotFound();
});

// Enrutamiento SEO y fallback SPA estrictamente acotado a las 10 rutas públicas oficiales y 13 idiomas
var supportedSeoLanguages = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "es", "en", "pt", "zh", "fr", "de", "it", "ru", "ar", "ja", "hi", "tr", "ko"
};

var seoDictionaryCache = new ConcurrentDictionary<string, IReadOnlyDictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

IReadOnlyDictionary<string, string> GetSeoTranslations(string langCode, IWebHostEnvironment hostEnv)
{
    return seoDictionaryCache.GetOrAdd(langCode, code =>
    {
        var candidates = new[]
        {
            Path.Combine(hostEnv.WebRootPath ?? string.Empty, "assets", "i18n", $"{code}.json"),
            Path.Combine(hostEnv.ContentRootPath, "..", "gtaapp.client", "src", "assets", "i18n", $"{code}.json")
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

var seoRoutes = new Dictionary<string, (string CanonicalPath, string TitleKey, string DescriptionKey, string Title, string Description, string Canonical)>(StringComparer.OrdinalIgnoreCase)
{
    ["/home"] = (
        "/home",
        "homeTitle",
        "homeDesc",
        "GTA Explorer - Mapas GTA HD con asistente IA integrado y Guías Interactivas",
        "Plataforma multilingüe en 13 idiomas de Mapas HD y Guías Interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online con Asistente de IA integrado, Misiones, Ubicaciones, Vehículos, Armas y Misterios.",
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

var legacyRedirects = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
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

app.MapFallback(async (HttpContext ctx, IWebHostEnvironment env) =>
{
    var rawPath = ctx.Request.Path.Value ?? "/";
    var qs = ctx.Request.QueryString.HasValue ? ctx.Request.QueryString.Value : string.Empty;
    var trimmedPath = rawPath.Length > 1 ? rawPath.TrimEnd('/') : rawPath;

    if (legacyRedirects.TryGetValue(trimmedPath, out var targetRoute))
    {
        ctx.Response.StatusCode = StatusCodes.Status301MovedPermanently;
        ctx.Response.Headers.Location = $"https://gtaexplorer.com{targetRoute}{qs}";
        return;
    }

    if (!seoRoutes.TryGetValue(trimmedPath, out var seo))
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
        if (string.Equals(rawLang, "es", StringComparison.Ordinal) || !supportedSeoLanguages.Contains(rawLang))
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

    var indexPath = Path.Combine(env.WebRootPath, "index.html");
    if (!File.Exists(indexPath))
    {
        ctx.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var resolvedTitle = seo.Title;
    var resolvedDesc = seo.Description;
    if (!string.Equals(activeLang, "es", StringComparison.Ordinal))
    {
        var localizedDict = GetSeoTranslations(activeLang, env);
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
            "<title>GTA Explorer - Mapas GTA HD con asistente IA integrado y Guías Interactivas</title>",
            $"<title>{safeTitle}</title>",
            StringComparison.Ordinal)
        .Replace(
            "<meta name=\"description\" content=\"Plataforma multilingüe en 13 idiomas de Mapas HD y Guías Interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online con Asistente de IA integrado, Misiones, Ubicaciones, Vehículos, Armas y Misterios.\">",
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
            "<meta property=\"og:title\" content=\"GTA Explorer - Mapas y Guías de GTA 5 &amp; GTA 6\">",
            $"<meta property=\"og:title\" content=\"{safeTitle}\">",
            StringComparison.Ordinal)
        .Replace(
            "<meta property=\"og:description\" content=\"Plataforma multilingüe en 13 idiomas de Mapas HD y Guías Interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online con Asistente de IA integrado, Misiones, Ubicaciones, Vehículos, Armas y Misterios.\">",
            $"<meta property=\"og:description\" content=\"{safeDesc}\">",
            StringComparison.Ordinal)
        .Replace(
            "<meta name=\"twitter:title\" content=\"GTA Explorer - Mapas y Guías de GTA 5 &amp; GTA 6\">",
            $"<meta name=\"twitter:title\" content=\"{safeTitle}\">",
            StringComparison.Ordinal)
        .Replace(
            "<meta name=\"twitter:description\" content=\"Plataforma multilingüe en 13 idiomas de Mapas HD y Guías Interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6 y GTA 6 Online con Asistente de IA integrado, Misiones, Ubicaciones, Vehículos, Armas y Misterios.\">",
            $"<meta name=\"twitter:description\" content=\"{safeDesc}\">",
            StringComparison.Ordinal);

    ctx.Response.StatusCode = StatusCodes.Status200OK;
    ctx.Response.ContentType = "text/html; charset=utf-8";
    ctx.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
    ctx.Response.Headers.Pragma = "no-cache";
    ctx.Response.Headers.Expires = "0";
    if (!HttpMethods.IsHead(ctx.Request.Method))
    {
        await ctx.Response.WriteAsync(html);
    }
});

// Inicio del servidor
await app.RunAsync();

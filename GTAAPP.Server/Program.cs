using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using GTAAPP.Server.Middleware;
using GTAAPP.Server.Hubs;
using GTAAPP.Server.Extensions;
using GTAAPP.Server.Services;

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
builder.Services.AddSingleton<GTAAPP.Server.Services.ISeoService, GTAAPP.Server.Services.SeoService>();
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

// Sitemap, robots y fallback SPA acotado a las rutas públicas y sus 13 idiomas
app.MapMethods("/sitemap.xml", ["GET", "HEAD"], (ISeoService seo) => seo.GetSitemap());
app.MapMethods("/robots.txt", ["GET", "HEAD"], (ISeoService seo) => seo.GetRobots());
app.MapFallback((HttpContext ctx, ISeoService seo) => seo.HandleRequestAsync(ctx));

// Inicio del servidor
await app.RunAsync();

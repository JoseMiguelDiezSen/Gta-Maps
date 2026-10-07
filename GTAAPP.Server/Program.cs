using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using GTAAPP.Server.Middleware;
using GTAAPP.Server.Hubs;

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

// 2. Soporte para proxies inversos (Azure App Service TLS termination, Cloudflare o balanceadores de carga)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
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
builder.Services.AddSignalR();

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

// 6. Rate Limiting nativo (.NET 10) contra fuerza bruta y scraping masivo de datasets
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too Many Requests",
            message = "Has superado el límite de peticiones permitidas. Por favor, espera unos momentos antes de reintentar."
        }, cancellationToken: token);
    };

    // 6.1 Política Global por IP (los archivos estáticos como tiles de mapa, imágenes, css y js quedan 100% EXENTOS)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/assets", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".txt", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".woff2", StringComparison.OrdinalIgnoreCase))
        {
            return RateLimitPartition.GetNoLimiter("static-assets");
        }

        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // 6.2 Política específica 'data-policy' para endpoints de datasets (máximo 60 req/min)
    options.AddPolicy("data-policy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // 6.3 Política específica 'chat-policy' para el endpoint de IA GOTY Bot (máximo 15 req/min por IP)
    options.AddPolicy("chat-policy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 3,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // 6.4 Política específica 'feedback-policy' para sugerencias y mensajes de usuario (máximo 5 req/min por IP)
    options.AddPolicy("feedback-policy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 2,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

// 7. Servicios singleton y scoped de negocio
builder.Services.AddSingleton<GTAAPP.Server.Services.LocationsService>();
builder.Services.AddSingleton<GTAAPP.Server.Services.VehiclesService>();
builder.Services.AddScoped<GTAAPP.Server.Services.IEmailService, GTAAPP.Server.Services.EmailService>();
builder.Services.AddHttpClient<GTAAPP.Server.Services.IGeminiService, GTAAPP.Server.Services.GeminiService>(client =>
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

// Soporte para archivos por defecto (index.html)
app.UseDefaultFiles();

// Proveedor de tipos MIME estándar
var staticContentTypeProvider = new FileExtensionContentTypeProvider();
staticContentTypeProvider.Mappings[".html"] = "text/html";
staticContentTypeProvider.Mappings[".js"] = "application/javascript";
staticContentTypeProvider.Mappings[".json"] = "application/json";
staticContentTypeProvider.Mappings[".css"] = "text/css";
staticContentTypeProvider.Mappings[".xml"] = "application/xml";
staticContentTypeProvider.Mappings[".txt"] = "text/plain";
staticContentTypeProvider.Mappings[".ico"] = "image/x-icon";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticContentTypeProvider
});
app.MapStaticAssets();

// Mapeo de controladores REST y Hubs de SignalR
app.MapControllers();
app.MapHub<UsuariosActivosHub>("/hubs/usuarios-activos");

// Enrutamiento fallback SPA (Single Page Application) hacia index.html de Angular
app.MapFallbackToFile("/index.html");

// Inicio del servidor
app.Run();

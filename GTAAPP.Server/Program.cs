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

// 1. Eliminar cabecera 'Server' para no exponer detalles internos del servidor Kestrel a posibles atacantes
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.AddServerHeader = false;
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
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
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

    // 6.1 Política Global por IP (máximo 120 peticiones por minuto en ventana deslizante)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 120,
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
});

// 7. Servicios singleton de negocio (gestión de ubicaciones y vehículos con caché en memoria)
builder.Services.AddSingleton<GTAAPP.Server.Services.LocationsService>();
builder.Services.AddSingleton<GTAAPP.Server.Services.VehiclesService>();

// 8. Documentación interactiva de la API con OpenAPI / Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// =========================================================================================
// PIPELINE DE PROCESAMIENTO HTTP
// =========================================================================================

// Respetar encabezados reenviados por proxies inversos (X-Forwarded-For, X-Forwarded-Proto)
app.UseForwardedHeaders();

// Inyectar cabeceras defensivas de seguridad (CSP, X-Frame-Options, X-Content-Type-Options)
app.UseSecurityHeaders();

// Entorno de desarrollo: habilitar interfaz OpenAPI / Swagger
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
}

// Redirección forzada de HTTP a HTTPS
app.UseHttpsRedirection();

// Aplicar políticas de CORS y Rate Limiting
app.UseCors();
app.UseRateLimiter();

// Soporte para archivos por defecto (index.html)
app.UseDefaultFiles();

// Proveedor de tipos MIME que fuerza explícitamente charset=utf-8 para evitar caracteres corruptos (mojibake)
var staticContentTypeProvider = new FileExtensionContentTypeProvider();
staticContentTypeProvider.Mappings[".html"] = "text/html; charset=utf-8";
staticContentTypeProvider.Mappings[".js"] = "application/javascript; charset=utf-8";
staticContentTypeProvider.Mappings[".json"] = "application/json; charset=utf-8";
staticContentTypeProvider.Mappings[".css"] = "text/css; charset=utf-8";

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

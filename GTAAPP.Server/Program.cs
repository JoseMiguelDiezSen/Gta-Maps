using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using GTAAPP.Server.Middleware;
using GTAAPP.Server.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Eliminar cabecera Server para no exponer detalles de Kestrel
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.AddServerHeader = false;
});

// Soporte para proxies inversos (Azure App Service TLS termination y balanceadores)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// HSTS estricto para entornos productivos
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Configuración de CORS basada en entorno y orígenes permitidos
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .AllowCredentials();
        }
    });
});

// Rate Limiting nativo de ASP.NET Core (.NET 10) contra scraping masivo y fuerza bruta
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

    // 1. Política Global por IP (120 req/minuto)
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

    // 3. Política para endpoints de datos (60 req/minuto) -> Prevención de scraping abusivo
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
builder.Services.AddSingleton<GTAAPP.Server.Services.LocationsService>();
builder.Services.AddSingleton<GTAAPP.Server.Services.VehiclesService>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Respetar cabeceras de proxy inverso de Azure App Service
app.UseForwardedHeaders();

// Inyectar cabeceras HTTP de seguridad (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
app.UseSecurityHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseRateLimiter();

app.UseDefaultFiles();

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

app.MapControllers();
app.MapHub<UsuariosActivosHub>("/hubs/usuarios-activos");

app.MapFallbackToFile("/index.html");

app.Run();

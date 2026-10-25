using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace GTAAPP.Server.Extensions;

public static class RateLimiterExtensions
{
    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                var rejectedPath = context.HttpContext.Request.Path.Value ?? string.Empty;
                var isFeedback = rejectedPath.Equals("/api/feedback", StringComparison.OrdinalIgnoreCase);

                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    error = "Too Many Requests",
                    code = isFeedback ? "FEEDBACK_DAILY_LIMIT" : "RATE_LIMIT_EXCEEDED",
                    message = isFeedback
                        ? "Ya hemos recibido tus sugerencias de hoy. Por favor, espera a que se procesen antes de enviar otra."
                        : "Has superado el límite de peticiones permitidas. Por favor, espera unos momentos antes de reintentar."
                }, cancellationToken: token);
            };

            // Global por IP (archivos estáticos e imágenes quedan exentos)
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var path = httpContext.Request.Path.Value ?? string.Empty;
                var isJsonData = path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                                 path.StartsWith("/assets/data", StringComparison.OrdinalIgnoreCase) ||
                                 path.StartsWith("/data", StringComparison.OrdinalIgnoreCase);

                if (!isJsonData && (
                    path.StartsWith("/assets", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".txt", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) ||
                    path.EndsWith(".woff2", StringComparison.OrdinalIgnoreCase)))
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

            // data-policy (60 req/min)
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

            // chat-policy (15 req/min)
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

            // feedback-policy (2 cada 24h)
            options.AddPolicy("feedback-policy", httpContext =>
            {
                var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: clientIp,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 2,
                        Window = TimeSpan.FromHours(24),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });
        });

        return services;
    }
}

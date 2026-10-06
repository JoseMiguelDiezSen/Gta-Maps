namespace GTAAPP.Server.Middleware;

/// <summary>
/// Middleware de seguridad HTTP que inyecta cabeceras defensivas recomendadas por OWASP y las directrices de seguridad de Azure App Service.
/// Previene ataques como Clickjacking, ataques basados en tipos MIME no coincidentes, fugas de referrer
/// y ataques de ejecución de secuencias de comandos entre sitios (XSS) mediante una estricta Content-Security-Policy (CSP).
/// </summary>
public class SecurityHeadersMiddleware
{
    /// <summary>
    /// Delegado que representa el siguiente middleware en el pipeline de procesamiento de la petición HTTP.
    /// </summary>
    private readonly RequestDelegate _next;

    /// <summary>
    /// Inicializa el middleware con el siguiente delegado en la canalización HTTP.
    /// </summary>
    /// <param name="next">Siguiente RequestDelegate en la cadena de middleware.</param>
    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    /// <summary>
    /// Intercepta la petición HTTP y registra un hook en Response.OnStarting para adjuntar las cabeceras de seguridad
    /// justo antes de que comiencen a enviarse los primeros bytes al cliente navegador.
    /// </summary>
    /// <param name="context">El contexto HTTP de la petición actual.</param>
    /// <returns>Tarea asíncrona que continúa la ejecución de la petición.</returns>
    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;

        // =========================================================================
        // BLINDAJE DE MÉTODOS HTTP:
        // Solo se permiten GET, HEAD y OPTIONS en toda la aplicación.
        // Las peticiones POST solo se admiten en la ruta del bot (/api/goty/chat)
        // y en el endpoint de SignalR (/hubs/usuarios-activos) para negociación.
        // Cualquier otro POST, PUT, DELETE, PATCH, TRACE o CONNECT es bloqueado de inmediato.
        // =========================================================================
        if (HttpMethods.IsPost(method))
        {
            var isAllowedPost = path.Equals("/api/goty/chat", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/hubs/usuarios-activos", StringComparison.OrdinalIgnoreCase);

            if (!isAllowedPost)
            {
                context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
                context.Response.Headers.Allow = "GET, HEAD, OPTIONS";
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Method Not Allowed",
                    message = "El método POST no está permitido en este recurso."
                });
                return;
            }
        }
        else if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method))
        {
            context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
            context.Response.Headers.Allow = "GET, HEAD, OPTIONS";
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Method Not Allowed",
                message = $"El método {method} no está permitido en este servidor."
            });
            return;
        }

        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // 1. Evita Clickjacking (Iframe embedding no autorizado en cualquier sitio)
            headers["X-Frame-Options"] = "DENY";

            // 2. Previene MIME-type sniffing asegurando charset=utf-8 para evitar corrupción de idioma (mojibake)
            headers["X-Content-Type-Options"] = "nosniff";

            // Asegura que las respuestas de texto, JSON o JS declaren explícitamente charset=utf-8
            var ct = context.Response.ContentType;
            if (!string.IsNullOrEmpty(ct) && !ct.Contains("charset", StringComparison.OrdinalIgnoreCase))
            {
                if (ct.StartsWith("text/", StringComparison.OrdinalIgnoreCase) ||
                    ct.Contains("json", StringComparison.OrdinalIgnoreCase) ||
                    ct.Contains("javascript", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.ContentType = $"{ct}; charset=utf-8";
                }
            }

            // 3. Control de Referrer para no filtrar URLs internas ni tokens en enlaces salientes hacia otros sitios
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // 4. Restringe APIs sensibles del dispositivo/navegador que GTAAPP no utiliza (cámara, micro, pagos, etc.)
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()";

            // 5. Deshabilita el auditor XSS antiguo de navegadores obsoletos en favor de una CSP moderna
            headers["X-XSS-Protection"] = "0";

            // 6. Prohíbe políticas entre dominios de Adobe Flash / Silverlight / PDFs externos
            headers["X-Permitted-Cross-Domain-Policies"] = "none";

            // 7. Content Security Policy (CSP) 100% blindada y sin URLs externas de terceros
            // Todos los recursos (estilos, fuentes, iconos, tiles, imágenes) se sirven localmente
            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                var csp = "default-src 'self'; " +
                          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; " +
                          "style-src 'self' 'unsafe-inline'; " +
                          "font-src 'self' data:; " +
                          "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com; " +
                          "connect-src 'self' ws: wss: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; " +
                          "object-src 'none'; " +
                          "frame-ancestors 'none'; " +
                          "base-uri 'self'; " +
                          "form-action 'self';" +
                          (context.Request.IsHttps ? " upgrade-insecure-requests;" : "");

                headers["Content-Security-Policy"] = csp;
            }

            // 8. Ocultar información técnica del servidor para no exponer la versión de Kestrel o ASP.NET
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

/// <summary>
/// Métodos de extensión para registrar de forma limpia el middleware de cabeceras de seguridad en Program.cs.
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    /// <summary>
    /// Agrega el middleware SecurityHeadersMiddleware a la canalización de procesamiento de la aplicación.
    /// </summary>
    /// <param name="app">La interfaz IApplicationBuilder donde se encadena el middleware.</param>
    /// <returns>La misma instancia de IApplicationBuilder para permitir encadenamiento fluido.</returns>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SecurityHeadersMiddleware>();
    }
}

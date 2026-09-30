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
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // 1. Evita Clickjacking (Iframe embedding no autorizado) asegurando que solo nuestra propia app pueda incrustarse
            if (!headers.ContainsKey("X-Frame-Options"))
            {
                headers.Append("X-Frame-Options", "SAMEORIGIN");
            }

            // 2. Previene MIME-type sniffing asegurando charset=utf-8 para evitar corrupción de idioma (mojibake)
            if (!headers.ContainsKey("X-Content-Type-Options"))
            {
                headers.Append("X-Content-Type-Options", "nosniff");
            }

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
            if (!headers.ContainsKey("Referrer-Policy"))
            {
                headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
            }

            // 4. Restringe APIs sensibles del dispositivo/navegador que GTAAPP no utiliza (cámara, micro, pagos, etc.)
            if (!headers.ContainsKey("Permissions-Policy"))
            {
                headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
            }

            // 5. Deshabilita el auditor XSS antiguo de navegadores obsoletos en favor de una CSP moderna
            if (!headers.ContainsKey("X-XSS-Protection"))
            {
                headers.Append("X-XSS-Protection", "0");
            }

            // 6. Content Security Policy (CSP) adaptada a Angular, Leaflet y CDNs de imágenes/tiles de mapas
            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                var csp = "default-src 'self'; " +
                          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                          "font-src 'self' https://fonts.gstatic.com data:; " +
                          "img-src 'self' data: blob: https://tiles.mapgenie.io https://static.wikia.nocookie.net https://media.rockstargames.com https://*.wikia.nocookie.net; " +
                          "connect-src 'self' ws: wss: https://tiles.mapgenie.io; " +
                          "frame-ancestors 'self'; " +
                          "base-uri 'self'; " +
                          "form-action 'self';";

                headers.Append("Content-Security-Policy", csp);
            }

            // 7. Ocultar información técnica del servidor para no exponer la versión de Kestrel o ASP.NET
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

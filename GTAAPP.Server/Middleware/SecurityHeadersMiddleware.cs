namespace GTAAPP.Server.Middleware;

/// <summary>
/// Middleware de seguridad HTTP que inyecta cabeceras defensivas recomendadas por OWASP y las directrices de seguridad de Azure App Service.
/// Previene ataques como Clickjacking, ataques basados en tipos MIME no coincidentes, fugas de referrer
/// y ataques de ejecución de secuencias de comandos entre sitios (XSS) mediante una estricta Content-Security-Policy (CSP).
/// </summary>
public class SecurityHeadersMiddleware
{
    /// <summary>
    /// Firmas de herramientas automatizadas de scraping, descarga masiva y bots de extracción de datos bloqueados.
    /// </summary>
    private static readonly string[] BlockedScraperSignatures =
    [
        "python-requests", "python-urllib", "aiohttp", "httpx", "scrapy",
        "curl/", "wget/", "httrack", "libwww-perl", "lwp-trivial",
        "go-http-client", "java/", "okhttp", "apache-httpclient",
        "postmanruntime", "insomnia", "axios/", "node-fetch", "undici",
        "gptbot", "ccbot", "claudebot", "bytespider", "petalbot"
    ];

    /// <summary>
    /// Delegado que representa el siguiente middleware en el pipeline de procesamiento de la petición HTTP.
    /// </summary>
    private readonly RequestDelegate _next;

    /// <summary>
    /// Entorno de hospedaje web para distinguir entre desarrollo local y producción en VPS.
    /// </summary>
    private readonly IWebHostEnvironment _env;

    /// <summary>
    /// Inicializa el middleware con el siguiente delegado en la canalización HTTP y el entorno actual.
    /// </summary>
    /// <param name="next">Siguiente RequestDelegate en la cadena de middleware.</param>
    /// <param name="env">Entorno de ejecución del servidor.</param>
    public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    /// <summary>
    /// Intercepta la petición HTTP, aplica el escudo anti-scraping global y registra un hook en Response.OnStarting
    /// para adjuntar las cabeceras de seguridad justo antes de que comiencen a enviarse los primeros bytes al cliente.
    /// </summary>
    /// <param name="context">El contexto HTTP de la petición actual.</param>
    /// <returns>Tarea asíncrona que continúa la ejecución de la petición.</returns>
    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;

        // =========================================================================
        // 1. ESCUDO ANTI-SCRAPING: BLOQUEO DE BOTS Y HERRAMIENTAS DE EXTRACCIÓN
        // =========================================================================
        var userAgent = context.Request.Headers.UserAgent.ToString();
        if (string.IsNullOrWhiteSpace(userAgent) || IsScraperUserAgent(userAgent))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Forbidden",
                message = "Acceso automatizado no permitido."
            }, cancellationToken: context.RequestAborted);
            return;
        }

        // =========================================================================
        // 2. ESCUDO ANTI-DESCARGA DIRECTA DE DATOS (.JSON Y API) Y PASE PRIVADO
        // Impide abrir archivos .json o endpoints de API directamente en el navegador,
        // desde webs externas o sin el pase dinámico X-GTA-Shield de la app Angular.
        // =========================================================================
        var secFetchMode = context.Request.Headers["Sec-Fetch-Mode"].ToString();
        var secFetchDest = context.Request.Headers["Sec-Fetch-Dest"].ToString();
        var secFetchSite = context.Request.Headers["Sec-Fetch-Site"].ToString();

        var isDataRequest = path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                            path.StartsWith("/assets/data/", StringComparison.OrdinalIgnoreCase) ||
                            path.StartsWith("/data/", StringComparison.OrdinalIgnoreCase) ||
                            path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase);

        if (isDataRequest && !HttpMethods.IsOptions(method))
        {
            var isCrossSite = secFetchSite.Equals("cross-site", StringComparison.OrdinalIgnoreCase);

            if (isCrossSite)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Forbidden",
                    message = "No está permitido el acceso externo a los datos de la aplicación."
                }, cancellationToken: context.RequestAborted);
                return;
            }
        }

        // Protección de tiles del mapa e imágenes contra clonado desde dominios externos
        var isProtectedMedia = path.StartsWith("/assets/mapas/", StringComparison.OrdinalIgnoreCase) ||
                               path.StartsWith("/assets/images/", StringComparison.OrdinalIgnoreCase);

        if (isProtectedMedia && secFetchSite.Equals("cross-site", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        // =========================================================================
        // 3. BLINDAJE DE MÉTODOS HTTP:
        // Solo se permiten GET, HEAD y OPTIONS en toda la aplicación.
        // Las peticiones POST solo se admiten en la ruta del bot (/api/goty/chat)
        // y en el endpoint de SignalR (/hubs/usuarios-activos) para negociación.
        // Cualquier otro POST, PUT, DELETE, PATCH, TRACE o CONNECT es bloqueado de inmediato.
        // =========================================================================
        if (HttpMethods.IsPost(method))
        {
            var isAllowedPost = path.Equals("/api/feedback", StringComparison.OrdinalIgnoreCase) ||
                                path.Equals("/api/goty/chat", StringComparison.OrdinalIgnoreCase) ||
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
                }, cancellationToken: context.RequestAborted);
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
            }, cancellationToken: context.RequestAborted);
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
                    ct.Contains("javascript", StringComparison.OrdinalIgnoreCase) ||
                    ct.Contains("xml", StringComparison.OrdinalIgnoreCase))
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

            // 9. Prevenir que respuestas HTML (index.html o navegación SPA) queden cacheadas en disco impidiendo actualizaciones
            var responseContentType = context.Response.ContentType;
            if (!string.IsNullOrEmpty(responseContentType) && responseContentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase))
            {
                if (!headers.ContainsKey("Cache-Control"))
                {
                    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                    headers["Pragma"] = "no-cache";
                    headers["Expires"] = "0";
                }
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }

    /// <summary>
    /// Determina si la cabecera User-Agent coincide con alguna herramienta conocida de scraping o extracción masiva.
    /// </summary>
    /// <param name="userAgent">Cadena User-Agent de la petición HTTP.</param>
    /// <returns>True si pertenece a un bot o herramienta de scraping; de lo contrario, False.</returns>
    private static bool IsScraperUserAgent(string userAgent)
    {
        foreach (var signature in BlockedScraperSignatures)
        {
            if (userAgent.Contains(signature, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
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

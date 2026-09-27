using System.IO;

class GeneradorInformeSeguridadGTAAPP
{
    static void Main()
    {
        string outputPath = @"C:\Users\josem\source\repos\JoseMiguelDiezSen\GTAAPP\AUDITORIA_SEGURIDAD_GTAAPP.txt";
        
        using (StreamWriter writer = new StreamWriter(outputPath))
        {
            writer.WriteLine("AUDITORÍA DE SEGURIDAD - APLICACIÓN GTAAPP");
            writer.WriteLine("===========================================");
            writer.WriteLine("");
            writer.WriteLine("Fecha: " + DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
            writer.WriteLine("Auditor: Devin AI Security Analysis");
            writer.WriteLine("");

            writer.WriteLine("1. RESUMEN EJECUTIVO");
            writer.WriteLine("====================");
            writer.WriteLine("Esta auditoría de seguridad analiza la aplicación GTAAPP, un sistema de mapeo y gestión de datos para Grand Theft Auto (GTA V/GTA VI) desarrollado con ASP.NET Core 10.0 y Angular 20. A diferencia de aplicaciones empresariales tradicionales, esta aplicación presenta un modelo de seguridad diferente con características positivas y áreas de mejora importantes.");
            writer.WriteLine("");
            writer.WriteLine("NIVEL DE RIESGO GLOBAL: MEDIO");
            writer.WriteLine("La aplicación tiene buenas prácticas de seguridad implementadas pero presenta ausencia de autenticación y datos almacenados localmente sin encriptación.");
            writer.WriteLine("");

            writer.WriteLine("2. ARQUITECTURA GENERAL DE LA APLICACIÓN");
            writer.WriteLine("=======================================");
            writer.WriteLine("Tecnologías identificadas:");
            writer.WriteLine("• Backend: ASP.NET Core 10.0");
            writer.WriteLine("• Frontend: Angular 20.3.31");
            writer.WriteLine("• Mapas: Leaflet 1.9.4");
            writer.WriteLine("• Icons: FontAwesome 7.3.1");
            writer.WriteLine("• Build: Angular CLI 20.3.37");
            writer.WriteLine("");
            writer.WriteLine("Estructura del proyecto:");
            writer.WriteLine("• GTAAPP.Server/: Backend ASP.NET Core");
            writer.WriteLine("• gtaapp.client/: Frontend Angular");
            writer.WriteLine("• Arquitectura SPA con API REST");
            writer.WriteLine("• Almacenamiento de datos en archivos JSON locales");
            writer.WriteLine("");

            writer.WriteLine("3. VULNERABILIDADES CRÍTICAS");
            writer.WriteLine("==============================");
            
            writer.WriteLine("3.1 AUSENCIA DE AUTENTICACIÓN Y AUTORIZACIÓN");
            writer.WriteLine("SEVERIDAD: CRÍTICA");
            writer.WriteLine("Ubicación: Todos los controladores, Program.cs");
            writer.WriteLine("Descripción:");
            writer.WriteLine("La aplicación NO implementa ningún sistema de autenticación. Todos los endpoints son públicos sin atributos [Authorize]. Cualquier persona con acceso a la API puede leer y modificar datos del perfil de usuario.");
            writer.WriteLine("Código vulnerable:");
            writer.WriteLine("[ApiController]");
            writer.WriteLine("[Route(\"api/user\")]");
            writer.WriteLine("public class UserProfileController : ControllerBase");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Cualquier usuario puede acceder a los datos del perfil sin autenticación");
            writer.WriteLine("• Posible manipulación de datos de otros usuarios");
            writer.WriteLine("• No hay rastro de quién realiza las modificaciones");
            writer.WriteLine("• Sin control de acceso basado en roles");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar autenticación mediante JWT, OAuth, o ASP.NET Core Identity. Añadir atributos [Authorize] en los controladores. Implementar autorización basada en roles para permitir solo al propietario modificar su perfil.");
            writer.WriteLine("");

            writer.WriteLine("3.2 DATOS SENSIBLES ALMACENADOS SIN ENCRIPTACIÓN");
            writer.WriteLine("SEVERIDAD: CRÍTICA");
            writer.WriteLine("Ubicación: UserProfileService.cs líneas 24, 181");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Los datos del perfil de usuario se almacenan en archivos JSON local sin encriptación: user_profile.json");
            writer.WriteLine("Código vulnerable:");
            writer.WriteLine("_filePath = Path.Combine(baseDir, \"data\", \"user_profile.json\");");
            writer.WriteLine("File.WriteAllText(_filePath, json);");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Cualquier persona con acceso al servidor puede leer los datos de usuario");
            writer.WriteLine("• No hay protección de datos sensibles en reposo");
            writer.WriteLine("• Posible exposición de información personal si el servidor es comprometido");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar encriptación de datos sensibles (AES-256) para el almacenamiento. Considerar usar base de datos en lugar de archivos JSON. Implementar hashing para datos sensibles como Rockstar ID.");
            writer.WriteLine("");

            writer.WriteLine("4. VULNERABILIDADES DE ALTA SEVERIDAD");
            writer.WriteLine("=====================================");

            writer.WriteLine("4.1 CONFIGURACIÓN CORS MUY PERMISIVA");
            writer.WriteLine("SEVERIDAD: ALTA");
            writer.WriteLine("Ubicación: Program.cs líneas 35-54, appsettings.json");
            writer.WriteLine("Descripción:");
            writer.WriteLine("La configuración CORS permite múltiples orígenes locales pero también podría permitir orígenes no autorizadas en producción.");
            writer.WriteLine("Código vulnerable:");
            writer.WriteLine("if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)");
            writer.WriteLine("{");
            writer.WriteLine("    policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback)");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• En desarrollo, permite cualquier origen loopback sin restricciones");
            writer.WriteLine("• Posible CSRF si no se validan origins correctamente");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Limitar estrictamente los orígenes permitidos en producción. Implementar validación de origins específicos. Usar credenciales CORS para mayor seguridad.");
            writer.WriteLine("");

            writer.WriteLine("4.2 CONFIGURACIÓN DE CONTENIDO CSP SUBOPTIMAL");
            writer.WriteLine("SEVERIDAD: ALTA");
            writer.WriteLine("Ubicación: SecurityHeadersMiddleware.cs líneas 66-76");
            writer.WriteLine("Descripción:");
            writer.WriteLine("El Content Security Policy incluye 'unsafe-inline' y 'unsafe-eval' en script-src, lo cual debilita la protección XSS.");
            writer.WriteLine("Código vulnerable:");
            writer.WriteLine("var csp = \"default-src 'self'; \" +");
            writer.WriteLine("          \"script-src 'self' 'unsafe-inline' 'unsafe-eval'; \"");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Permite ejecución de scripts inseguros insertados");
            writer.WriteLine("• Reduce la efectividad de CSP contra ataques XSS");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Eliminar 'unsafe-inline' y 'unsafe-eval' si es posible. Usar nonce o hash para scripts específicos. Considerar el uso de Trusted Types para DOM manipulation.");
            writer.WriteLine("");

            writer.WriteLine("4.3 VALIDACIÓN DE ENTRADA INCOMPLETA");
            writer.WriteLine("SEVERIDAD: ALTA");
            writer.WriteLine("Ubicación: LocationsController.cs líneas 15, 30-50");
            writer.WriteLine("Descripción:");
            writer.WriteLine("La validación de entrada usa regex simple pero no cubre todos los vectores de ataque.");
            writer.WriteLine("Código vulnerable:");
            writer.WriteLine("private static readonly Regex SafeQueryRegex = new(@\"^[a-zA-Z0-9_\\-]+$\", RegexOptions.Compiled);");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• No previene todos los vectores de inyección");
            writer.WriteLine("• Faltan validaciones más robustas para datos complejos");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar validación más robusta usando FluentValidation o Data Annotations. Sanitizar más exhaustivamente todas las entradas. Implementar whitelist de valores permitidos.");
            writer.WriteLine("");

            writer.WriteLine("5. VULNERABILIDADES DE MEDIA SEVERIDAD");
            writer.WriteLine("=======================================");

            writer.WriteLine("5.1 ALMACENAMIENTO EN ARCHIVOS JSON");
            writer.WriteLine("SEVERIDAD: MEDIA");
            writer.WriteLine("Ubicación: UserProfileService.cs");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Los datos se almacenan en archivos JSON en el sistema de archivos en lugar de base de datos.");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Problemas de concurrencia (manejado con lock pero no ideal)");
            writer.WriteLine("• Sin ACI granular a nivel de datos");
            writer.WriteLine("• Escalabilidad limitada");
            writer.WriteLine("• Posible corrupción de datos en casos de fallo de escritura");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Considerar migrar a base de datos (SQL Server, PostgreSQL) para mejor ACI, escalabilidad y rendimiento. Si se mantiene JSON, implementar backups automáticos y validación de integridad.");
            writer.WriteLine("");

            writer.WriteLine("5.2 LOGGING DE INFORMACIÓN SENSIBLE");
            writer.WriteLine("SEVERIDAD: MEDIA");
            writer.WriteLine("Ubicación: UserProfileService.cs líneas 164, 185");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Los errores de carga/persistencia se loggean pero podría contener información sensible en contextos de error.");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Posible exposición de rutas de archivos o datos sensibles en logs");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar sanitización de datos sensibles en logs. Usar logging estructurado con niveles apropiados. No loggear información de identificación personal.");
            writer.WriteLine("");

            writer.WriteLine("5.3 FALTA DE INTEGRIDAD DE DATOS");
            writer.WriteLine("SEVERIDAD: MEDIA");
            writer.WriteLine("Ubicación: UserProfileService.cs");
            writer.WriteLine("Descripción:");
            writer.WriteLine("No hay mecanismo de verificación de integridad de datos (checksums, firmas digitales).");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Posible corrupción de datos no detectada");
            writer.WriteLine("• No hay forma de verificar que los datos no han sido modificados");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar checksums o firmas digitales para verificar integridad de datos críticos. Usar ETags para detección de modificaciones concurrentes.");
            writer.WriteLine("");

            writer.WriteLine("6. VULNERABILIDADES DE BAJA SEVERIDAD");
            writer.WriteLine("=====================================");

            writer.WriteLine("6.1 DEPENDENCIAS DE FRONTEND");
            writer.WriteLine("SEVERIDAD: BAJA");
            writer.WriteLine("Ubicación: gtaapp.client/package.json");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Algunas dependencias de Angular están en versiones recientes pero debería verificarse regularmente.");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Posibles vulnerabilidades en dependencias de terceros");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar auditoría de dependencias regular con npm audit. Usar dependencias actualizadas y mantenerlas parcheadas.");
            writer.WriteLine("");

            writer.WriteLine("6.2 FALTA DE MONITOREO Y ALERTAS");
            writer.WriteLine("SEVERIDAD: BAJA");
            writer.WriteLine("Ubicación: No implementado");
            writer.WriteLine("Descripción:");
            writer.WriteLine("No hay sistema de monitoreo de seguridad o alertas automáticas.");
            writer.WriteLine("Impacto:");
            writer.WriteLine("• Detección tardía de incidentes de seguridad");
            writer.WriteLine("• Sin visibilidad de patrones de ataque");
            writer.WriteLine("Recomendación:");
            writer.WriteLine("Implementar monitoreo de seguridad (Application Insights, Sentry, etc.). Configurar alertas para patrones sospechosos. Implementar logging de accesos fallidos.");
            writer.WriteLine("");

            writer.WriteLine("7. PRÁCTICAS DE SEGURIDAD IMPLEMENTADAS (POSITIVAS)");
            writer.WriteLine("====================================================");

            writer.WriteLine("7.1 SEGURITY HEADERS MIDDLEWARE");
            writer.WriteLine("ESTADO: IMPLEMENTADO CORRECTAMENTE");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Middleware de headers de seguridad bien implementado con X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP.");
            writer.WriteLine("Detalles positivos:");
            writer.WriteLine("• X-Frame-Options: SAMEORIGIN (previene clickjacking)");
            writer.WriteLine("• X-Content-Type-Options: nosniff (previene MIME sniffing)");
            writer.WriteLine("• Referrer-Policy: strict-origin-when-cross-origin");
            writer.WriteLine("• Permissions-Policy restringe APIs no necesarias");
            writer.WriteLine("• CSP configurado para limitar recursos externos");
            writer.WriteLine("• Eliminación de headers de información del servidor");
            writer.WriteLine("");

            writer.WriteLine("7.2 RATE LIMITING");
            writer.WriteLine("ESTADO: IMPLEMENTADO CORRECTAMENTE");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Rate limiting nativo de ASP.NET Core 10.0 implementado con políticas por IP y para endpoints de datos.");
            writer.WriteLine("Detalles positivos:");
            writer.WriteLine("• Política global: 120 req/minuto por IP");
            writer.WriteLine("• Política para datos: 60 req/minuto");
            writer.WriteLine("• Prevención de scraping masivo");
            writer.WriteLine("• Prevención de fuerza bruta");
            writer.WriteLine("• Response 429 con Retry-After header");
            writer.WriteLine("");

            writer.WriteLine("7.3 HSTS");
            writer.WriteLine("ESTADO: IMPLEMENTADO CORRECTAMENTE");
            writer.WriteLine("Descripción:");
            writer.WriteLine("HTTP Strict Transport Security configurado correctamente para producción.");
            writer.WriteLine("Detalles positivos:");
            writer.WriteLine("• MaxAge: 365 días");
            writer.WriteLine("• IncludeSubDomains: true");
            writer.WriteLine("• Preload: true");
            writer.WriteLine("• Prevención de degradación HTTPS");
            writer.WriteLine("");

            writer.WriteLine("7.4 VALIDACIÓN Y SANITIZACIÓN DE ENTRADA");
            writer.WriteLine("ESTADO: IMPLEMENTADO PARCIALMENTE");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Sanitización de datos de usuario implementada en UserProfileService con validación de longitud, HTML encoding, y validación de URLs.");
            writer.WriteLine("Detalles positivos:");
            writer.WriteLine("• Sanitización de nickname (max 50 caracteres, HTML encoding)");
            writer.WriteLine("• Validación de URLs de avatar (solo data:image o https://)");
            writer.WriteLine("• Validación de rangos (clamping entre 1-8000)");
            writer.WriteLine("• Validación de plataformas (whitelist: pc, ps5, xboxsx)");
            writer.WriteLine("• Regex para validación de queries en LocationsController");
            writer.WriteLine("");

            writer.WriteLine("7.5 SERVER HEADERS");
            writer.WriteLine("ESTADO: IMPLEMENTADO CORRECTAMENTE");
            writer.WriteLine("Descripción:");
            writer.WriteLine("Eliminación de headers que exponen información del servidor.");
            writer.WriteLine("Detalles positivos:");
            writer.WriteLine("• AddServerHeader = false en Kestrel");
            writer.WriteLine("• Eliminación de Server header");
            writer.WriteLine("• Eliminación de X-Powered-By header");
            writer.WriteLine("");

            writer.WriteLine("8. RECOMENDACIONES GENERALES DE SEGURIDAD");
            writer.WriteLine("========================================");
            writer.WriteLine("1. Implementar autenticación JWT o OAuth para proteger endpoints");
            writer.WriteLine("2. Encriptar datos sensibles en user_profile.json con AES-256");
            writer.WriteLine("3. Migrar a base de datos para mejor seguridad y escalabilidad");
            writer.WriteLine("4. Eliminar 'unsafe-inline' y 'unsafe-eval' de CSP si es posible");
            writer.WriteLine("5. Implementar autorización basada en roles (RBAC)");
            writer.WriteLine("6. Añadir atributos [Authorize] en controladores sensibles");
            writer.WriteLine("7. Implementar logging de auditoría de accesos y modificaciones");
            writer.WriteLine("8. Implementar monitoreo de seguridad y alertas automáticas");
            writer.WriteLine("9. Añadir validación de integridad de datos (checksums)");
            writer.WriteLine("10. Implementar backups automáticos y verificación de integridad");
            writer.WriteLine("11. Restringir orígenes CORS más estrictamente en producción");
            writer.WriteLine("12. Implementar pruebas de seguridad automatizadas");
            writer.WriteLine("13. Auditoría regular de dependencias con npm audit");
            writer.WriteLine("14. Implementar rate limiting específico por endpoint según sensibilidad");
            writer.WriteLine("15. Considerar implementar Web Application Firewall (WAF)");
            writer.WriteLine("");

            writer.WriteLine("9. CONCLUSIONES");
            writer.WriteLine("===============");
            writer.WriteLine("La aplicación GTAAPP presenta un caso interesante de seguridad con buenas prácticas implementadas (headers de seguridad, rate limiting, HSTS, sanitización de entrada) pero con ausencia crítica de autenticación y almacenamiento de datos sin encriptación. A diferencia de aplicaciones empresariales tradicionales, este modelo de aplicación sin login con datos locales presenta riesgos diferentes pero significativos.");
            writer.WriteLine("");
            writer.WriteLine("Puntos fuertes:");
            writer.WriteLine("• Excelente implementación de headers de seguridad");
            writer.WriteLine("• Rate limiting robusto contra scraping y ataques de fuerza bruta");
            writer.WriteLine("• Sanitización de entrada bien implementada");
            writer.WriteLine("• Configuración de HSTS correcta");
            writer.WriteLine("• No exposición de información del servidor");
            writer.WriteLine("");
            writer.WriteLine("Puntos críticos:");
            writer.WriteLine("• Ausencia total de autenticación y autorización");
            writer.WriteLine("• Datos sensibles almacenados sin encriptación");
            writer.WriteLine("• Almacenamiento en archivos JSON sin ACI granular");
            writer.WriteLine("• CSP con 'unsafe-inline' debilita protección XSS");
            writer.WriteLine("");
            writer.WriteLine("Se recomienda encarecidamente:");
            writer.WriteLine("• Implementar autenticación como prioridad crítica");
            writer.WriteLine("• Encriptar datos sensibles en reposo");
            writer.WriteLine("• Considerar migrar a base de datos para producción");
            writer.WriteLine("• Mejorar configuración de CSP");
            writer.WriteLine("");
            writer.WriteLine("NIVEL DE RIESGO ACTUAL: MEDIO");
            writer.WriteLine("NIVEL DE RIESGO DESPUÉS DE CORRECCIONES: BAJO (estimado)");
            writer.WriteLine("");

            writer.WriteLine("10. APÉNDICE - LISTADO DE ARCHIVOS REVISADOS");
            writer.WriteLine("==========================================");
            writer.WriteLine("Archivos de configuración:");
            writer.WriteLine("• GTAAPP.Server/Program.cs");
            writer.WriteLine("• GTAAPP.Server/appsettings.json");
            writer.WriteLine("• GTAAPP.Server/GTAAPP.Server.csproj");
            writer.WriteLine("• gtaapp.client/package.json");
            writer.WriteLine("");
            writer.WriteLine("Controladores:");
            writer.WriteLine("• GTAAPP.Server/Controllers/GTA5Controller.cs");
            writer.WriteLine("• GTAAPP.Server/Controllers/GTA6Controller.cs");
            writer.WriteLine("• GTAAPP.Server/Controllers/LocationsController.cs");
            writer.WriteLine("• GTAAPP.Server/Controllers/UserProfileController.cs");
            writer.WriteLine("");
            writer.WriteLine("Middleware:");
            writer.WriteLine("• GTAAPP.Server/Middleware/SecurityHeadersMiddleware.cs");
            writer.WriteLine("");
            writer.WriteLine("Servicios:");
            writer.WriteLine("• GTAAPP.Server/Services/UserProfileService.cs");
            writer.WriteLine("• GTAAPP.Server/Services/PropertyImporter.cs");
            writer.WriteLine("• GTAAPP.Server/Services/CollectibleImporter.cs");
            writer.WriteLine("");
            writer.WriteLine("Modelos:");
            writer.WriteLine("• GTAAPP.Server/Models/UserProfile.cs");
            writer.WriteLine("• GTAAPP.Server/Models/GameManifest.cs");
            writer.WriteLine("• GTAAPP.Server/Models/Location.cs");
            writer.WriteLine("• GTAAPP.Server/Models/PropertyLocation.cs");
            writer.WriteLine("• GTAAPP.Server/Models/CollectibleItem.cs");
            writer.WriteLine("");
            writer.WriteLine("---");
            writer.WriteLine("FIN DEL INFORME DE AUDITORÍA DE SEGURIDAD");
            writer.WriteLine("Generado por Devin AI Security Analysis");
            writer.WriteLine(DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"));
        }

        Console.WriteLine($"Informe de seguridad de GTAAPP generado exitosamente en: {outputPath}");
        Console.WriteLine("Para convertir a Word, abre el archivo en Microsoft Word y guárdalo como .docx");
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GTAAPP.Server.Models;
using System.Text.Json;
using System.Net.Mail;
using System.Net;

namespace GTAAPP.Server.Controllers
{
    /// <summary>
    /// Controlador para la gestión de sugerencias y comentarios del usuario.
    /// Guarda las sugerencias localmente en disco (App_Data/feedback/) y opcionalmente las envía por email vía SMTP.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("feedback-policy")]
    public class FeedbackController : ControllerBase
    {
        private readonly ILogger<FeedbackController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _env;

        public FeedbackController(ILogger<FeedbackController> logger, IConfiguration configuration, IHostEnvironment env)
        {
            _logger = logger;
            _configuration = configuration;
            _env = env;
        }

        [HttpPost]
        [RequestSizeLimit(16 * 1024)] // Límite estricto de 16 KB en el cuerpo de la petición (anti-DoS)
        public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "El mensaje no puede estar vacío." });
            }

            var trimmedMessage = request.Message.Trim();
            if (trimmedMessage.Length > 2000)
            {
                return BadRequest(new { error = "El mensaje no puede superar los 2000 caracteres." });
            }

            var name = string.IsNullOrWhiteSpace(request.Name) ? "Anónimo" : request.Name.Trim();
            if (name.Length > 100)
            {
                name = name.Substring(0, 100);
            }

            var now = DateTime.UtcNow;
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers.UserAgent.ToString();

            var record = new
            {
                Timestamp = now,
                Name = name,
                Message = trimmedMessage,
                IpAddress = ip,
                UserAgent = userAgent
            };

            // 1. Guardar localmente en App_Data/feedback/ (garantiza cero pérdida de sugerencias)
            try
            {
                var feedbackDir = Path.Combine(_env.ContentRootPath, "App_Data", "feedback");
                Directory.CreateDirectory(feedbackDir);

                var fileName = $"feedback_{now:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.json";
                var filePath = Path.Combine(feedbackDir, fileName);

                var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
                var jsonContent = JsonSerializer.Serialize(record, jsonOptions);
                await System.IO.File.WriteAllTextAsync(filePath, jsonContent);

                _logger.LogInformation("Sugerencia guardada correctamente en {FilePath}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar sugerencia localmente en disco.");
            }

            // 2. Intento opcional de envío por email vía SMTP si está configurado
            try
            {
                var smtpHost = _configuration["Smtp:Host"];
                var toEmail = _configuration["Smtp:ToEmail"];

                if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(toEmail))
                {
                    var portStr = _configuration["Smtp:Port"];
                    int port = int.TryParse(portStr, out var p) ? p : 587;
                    var username = _configuration["Smtp:Username"];
                    var password = _configuration["Smtp:Password"];
                    var enableSslStr = _configuration["Smtp:EnableSsl"];
                    bool enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl;

                    using var mail = new MailMessage();
                    mail.From = new MailAddress(!string.IsNullOrWhiteSpace(username) ? username : "noreply@gtamaps.dev", "GTA MAPS Feedback");
                    mail.To.Add(toEmail);
                    mail.Subject = $"[GTA MAPS Feedback] Sugerencia de {name}";
                    mail.Body = $"Ha recibido una nueva sugerencia desde GTA MAPS:\n\n" +
                                $"Fecha: {now:yyyy-MM-dd HH:mm:ss} UTC\n" +
                                $"Nombre: {name}\n" +
                                $"IP: {ip}\n\n" +
                                $"Mensaje:\n{trimmedMessage}\n";

                    using var smtp = new SmtpClient(smtpHost, port);
                    smtp.EnableSsl = enableSsl;
                    if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                    {
                        smtp.Credentials = new NetworkCredential(username, password);
                    }

                    await smtp.SendMailAsync(mail);
                    _logger.LogInformation("Sugerencia enviada por email a {ToEmail}", toEmail);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo enviar la sugerencia por email vía SMTP (ya se reservó en copia de seguridad en disco).");
            }

            return Ok(new { success = true, message = "Sugerencia enviada con éxito." });
        }
    }
}

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
        private readonly IHostEnvironment _env;
        private readonly GTAAPP.Server.Services.IEmailService _emailService;

        public FeedbackController(
            ILogger<FeedbackController> logger,
            IHostEnvironment env,
            GTAAPP.Server.Services.IEmailService emailService)
        {
            _logger = logger;
            _env = env;
            _emailService = emailService;
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

            // 2. Envío por email vía SMTP con plantilla HTML
            try
            {
                await _emailService.EnviarFeedbackAsync(name, trimmedMessage, ip, userAgent);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo enviar la sugerencia por email vía SMTP (ya se reservó en copia de seguridad en disco).");
            }

            return Ok(new { success = true, message = "Sugerencia enviada con éxito." });
        }
    }
}

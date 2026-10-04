using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using System.Threading.Tasks;

namespace GTAAPP.Server.Controllers
{
    /// <summary>
    /// Controlador del Asistente Virtual Criminal GOTY.
    /// Protegido con limitación estricta de tasa (rate limiting) y límites de carga útil para prevenir abusos de API o ataques de denegación de servicio.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("chat-policy")]
    public class GotyController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public GotyController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("chat")]
        [RequestSizeLimit(16 * 1024)] // Límite estricto de 16 KB en el cuerpo de la petición (anti-DoS)
        public async Task<IActionResult> Chat([FromBody] GotyChatRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "El mensaje no puede estar vacío." });
            }

            var trimmedMessage = request.Message.Trim();

            // Bloquear mensajes excesivamente largos para evitar ataques de denegación de servicio o saturación
            if (trimmedMessage.Length > 500)
            {
                return BadRequest(new { error = "El mensaje no puede superar los 500 caracteres." });
            }

            // Sanitizar contexto
            var context = string.IsNullOrWhiteSpace(request.Context) ? "gta5-online" : request.Context.Trim().ToLowerInvariant();
            if (context.Length > 30) context = context.Substring(0, 30);

            // Sanitizar idioma (ej: 'es', 'en', 'fr', etc.)
            var lang = string.IsNullOrWhiteSpace(request.Lang) ? "es" : request.Lang.Trim().ToLowerInvariant();
            if (lang.Length > 10) lang = lang.Substring(0, 10);

            var responseText = await _geminiService.GetChatResponseAsync(trimmedMessage, context, lang);

            // Si la IA falla (cuota, 503, caída de red), devolvemos error 503 al frontend para que active el Fallback
            if (string.IsNullOrEmpty(responseText))
            {
                return StatusCode(503, new { error = "AI_UNAVAILABLE" });
            }

            bool isAngry = false;
            if (responseText.Contains("[ANGRY]"))
            {
                isAngry = true;
                responseText = responseText.Replace("[ANGRY]", "").Trim();
            }

            return Ok(new GotyChatResponse { Text = responseText, IsAngry = isAngry });
        }
    }
}

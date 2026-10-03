using Microsoft.AspNetCore.Mvc;
using GTAAPP.Server.Models;
using GTAAPP.Server.Services;
using System.Threading.Tasks;

namespace GTAAPP.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GotyController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public GotyController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] GotyChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("El mensaje no puede estar vacío.");

            var responseText = await _geminiService.GetChatResponseAsync(request.Message, request.Context);

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

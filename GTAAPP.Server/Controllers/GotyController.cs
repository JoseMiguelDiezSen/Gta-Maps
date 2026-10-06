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

            // Modo capado para producción / subida a la red
            string botNum = context.StartsWith("gta6") ? "6" : "5";
            string responseText = lang switch
            {
                "en" => $"Hello, I'm GOTY {botNum}, I'm still being adjusted. Sorry for the inconvenience.",
                "pt" => $"Olá, sou o GOTY {botNum}, ainda estão ajustando alguns detalhes em mim. Desculpe o transtorno.",
                "zh" => $"你好，我是 GOTY {botNum}，目前仍在进行细节调试与优化。给您带来的不便敬请谅解。",
                "fr" => $"Bonjour, je suis GOTY {botNum}, on est encore en train d'ajuster quelques détails. Veuillez nous excuser pour la gêne occasionnée.",
                "de" => $"Hallo, ich bin GOTY {botNum}, an mir werden noch einige Details angepasst. Entschuldigen Sie die Unannehmlichkeiten.",
                "it" => $"Ciao, sono GOTY {botNum}, stiamo ancora perfezionando alcuni dettagli. Ci scusiamo per l'inconveniente.",
                "ru" => $"Привет, я GOTY {botNum}, во мне еще настраивают некоторые детали. Приносим извинения за неудобства.",
                "ar" => $"مرحبًا، أنا GOTY {botNum}، لا يزال يتم ضبط بعض التفاصيل الخاصة بي. نعتذر عن أي إزعاج.",
                "ja" => $"こんにちは、GOTY {botNum}です。現在一部の詳細を調整中です。ご不便をおかけして申し訳ありません。",
                "hi" => $"नमस्ते, मैं GOTY {botNum} हूँ, अभी भी मुझमें कुछ विवरण समायोजित किए जा रहे हैं। असुविधा के लिए खेद है।",
                "tr" => $"Merhaba, ben GOTY {botNum}, ayrıntılarım üzerinde hâlâ ayarlamalar yapılıyor. Verdiğimiz rahatsızlıktan dolayı özür dileriz.",
                "ko" => $"안녕하세요, 저는 GOTY {botNum}입니다. 현재 세부 사항을 조율 중입니다. 불편을 끼쳐 드려 죄송합니다.",
                _ => $"Hola, soy GOTY {botNum}, aún me están ajustando algunos detalles. Disculpa las molestias."
            };

            return Ok(new GotyChatResponse { Text = responseText, IsAngry = false });
        }
    }
}

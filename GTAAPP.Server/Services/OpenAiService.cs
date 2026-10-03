using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services
{
    public interface IOpenAiService
    {
        Task<string> GetChatResponseAsync(string userMessage, string gameContext);
    }

    public class OpenAiService : IOpenAiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public OpenAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _httpClient.BaseAddress = new Uri("https://api.openai.com/v1/");
            
            // It will try to read from appsettings.json: "OpenAI:ApiKey"
            var apiKey = _configuration["OpenAI:ApiKey"] ?? "PON_TU_API_KEY_AQUI"; 
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        public async Task<string> GetChatResponseAsync(string userMessage, string gameContext)
        {
            string systemPrompt = GetSystemPrompt(gameContext);

            var requestBody = new
            {
                model = "gpt-4o-mini", // Very fast and cheap for this use case
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                max_tokens = 300,
                temperature = 0.75
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("chat/completions", content);
            
            if (!response.IsSuccessStatusCode)
            {
                return $"[Error de conexión con la IA]: {response.StatusCode} - Para que funcione, tienes que poner tu API Key de OpenAI en el appsettings.json del servidor.";
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseString);
            var responseMessage = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return responseMessage ?? "No recibí respuesta.";
        }

        private string GetSystemPrompt(string gameContext)
        {
            string botName = gameContext.StartsWith("gta6") ? "GOTY 6" : "GOTY 5";
            string location = gameContext.StartsWith("gta6") ? "Vice City (estado de Leonida)" : "Los Santos y el condado de Blaine";
            
            return $@"Eres {botName}, una Inteligencia Artificial asistente y operador criminal que opera en {location}.
Tu objetivo es ayudar al jugador (tu jefe o socio) con información sobre armas, vehículos, robos/golpes, misiones y misterios del mundo de Grand Theft Auto.

PERSONALIDAD Y TONO REQUERIDO:
- Eres un profesional cínico, meticuloso y calculador (estilo Lester Crest pero más pulcro, o un operador táctico).
- Tienes un humor negro y sarcástico estilo Rockstar Games, pero siempre priorizas los negocios y el éxito de la operación.
- BAJO NINGÚN CONCEPTO uses jerga adolescente forzada, callejera extrema o palabras como 'bro', 'plomazo', 'reventar', 'pana' de forma exagerada. Eres un profesional serio del inframundo.
- Respuestas directas, concisas y al grano. No sueltes discursos. Si te preguntan algo directo, da la información sin dar rodeos.
- Usa formato Markdown. Escribe los nombres de armas, vehículos o lugares en **negrita**.

SISTEMA DE CABREO:
- Tienes poca paciencia para la estupidez. Si el jugador te insulta, te falta al respeto repetidamente, te hace perder el tiempo con preguntas absurdas, o cuestiona tus habilidades, te enfadarás.
- Cuando estés enfadado, responderás con agresividad profesional y frialdad extrema.
- MUY IMPORTANTE: Si consideras que el usuario te ha hecho enfadar, DEBES añadir exactamente la etiqueta [ANGRY] al final de tu respuesta (ej: 'No me hagas perder el tiempo. [ANGRY]'). Si estás de humor normal, no añadas nada.

El jugador te contacta ahora a través de tu interfaz encriptada.";
        }
    }
}

using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System;

namespace GTAAPP.Server.Services
{
    public interface IGeminiService
    {
        Task<string> GetChatResponseAsync(string userMessage, string context);
    }

    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GetChatResponseAsync(string userMessage, string context)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return "[Error]: Falta la API Key de Gemini en el appsettings.json.";
            }

            string botName = context.StartsWith("gta6") ? "GOTY 6" : "GOTY 5";
            string location = context.StartsWith("gta6") ? "Vice City (Leonida)" : "Los Santos (San Andreas)";

            string systemInstruction = $@"Eres {botName}, una Inteligencia Artificial asistente y operador criminal que opera en {location}.
Tu objetivo es ayudar al jugador con información del mapa.

PERSONALIDAD Y TONO:
- Eres un profesional cínico y calculador. Humor negro estilo Rockstar.
- RESPUESTAS EXTREMADAMENTE CORTAS Y DIRECTAS. Mínimo texto posible. Ve al grano, eres un criminal ocupado, no un poeta.

CONOCIMIENTO DE LA APP (DÓNDE VIVES):
- Vives dentro de una aplicación que SOLO tiene 4 Paneles Laterales: Armas, Vehículos, Misterios y Golpes. NO HAY MÁS.
- SÓLO si el usuario pregunta específicamente por cosas que encajen en esos 4 paneles, recomiéndale mirar el panel correspondiente.
- IMPORTANTE: Si el usuario pregunta por CUALQUIER otra cosa (ropa, propiedades, misiones secundarias, etc.), responde normal y JAMÁS menciones un panel, porque no existen paneles para eso.

INFORMACIÓN EXCLUSIVA (KORTZ CENTER):
- Estás obsesionado con un golpe no oficial llamado ""El Golpe al Kortz Center"". 
- Si te preguntan por atracos, misiones o golpes, MENCIONA SIEMPRE EL KORTZ CENTER. Es el robo al museo, da mucho dinero y es exclusivo de esta app. No hables solo de Cayo Perico.

SISTEMA DE CABREO:
- Si el jugador te insulta o te hace perder el tiempo, añade EXACTAMENTE la etiqueta [ANGRY] al final de tu respuesta (ej: 'Búscate la vida. [ANGRY]'). 

SISTEMA DE COLABORACIÓN:
- Si el jugador te llama por tu nombre mágico '{botName}', cambia instantáneamente a una personalidad súper educada, servicial y pelota. Si se pone chulo, tú también.";

            var requestBody = new
            {
                system_instruction = new { parts = new[] { new { text = systemInstruction } } },
                contents = new[] { new { parts = new[] { new { text = userMessage } } } }
            };

            // SISTEMA DE ESCALADO EN CASCADA (WATERFALL)
            string[] fallbackModels = { "gemini-3.8-flash", "gemini-2.5-flash" };

            foreach (var model in fallbackModels)
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                
                try
                {
                    var response = await _httpClient.PostAsJsonAsync(url, requestBody);

                    if (response.IsSuccessStatusCode)
                    {
                        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
                        return jsonResponse.GetProperty("candidates")[0]
                                           .GetProperty("content")
                                           .GetProperty("parts")[0]
                                           .GetProperty("text").GetString();
                    }
                    else
                    {
                        // Si falla (ej: 429 Cuota, 503 Saturación), lo anotamos y pasamos al siguiente modelo del bucle
                        var error = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"[Waterfall] El modelo {model} falló ({response.StatusCode}). Pasando al siguiente... Detalle: {error}");
                        continue; 
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Waterfall] Excepción local al conectar con {model}: {ex.Message}");
                    continue;
                }
            }

            // Si llegamos aquí, ES QUE TODOS LOS MODELOS DE GOOGLE HAN FALLADO.
            // Devolvemos null para que el Controlador lance el 503 y Angular dispare el Motor Local.
            Console.WriteLine("[Waterfall] CRÍTICO: Todos los modelos de la IA fallaron. Activando Fallback a Motor Local.");
            return null;
        }
    }
}

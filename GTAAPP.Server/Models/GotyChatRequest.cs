namespace GTAAPP.Server.Models
{
    public class GotyChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;

        /// <summary>
        /// Código ISO del idioma solicitado ('es', 'en', 'fr', 'de', etc.). Por defecto 'es'.
        /// </summary>
        public string Lang { get; set; } = "es";
    }

    public class GotyChatResponse
    {
        public string Text { get; set; } = string.Empty;
        public bool IsAngry { get; set; }
    }
}

namespace GTAAPP.Server.Models
{
    public class GotyChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
    }

    public class GotyChatResponse
    {
        public string Text { get; set; } = string.Empty;
        public bool IsAngry { get; set; }
    }
}

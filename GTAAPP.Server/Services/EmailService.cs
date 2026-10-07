using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace GTAAPP.Server.Services
{
    public interface IEmailService
    {
        Task<bool> EnviarFeedbackAsync(string nombre, string mensaje, string ip, string userAgent);
    }

    /// <summary>
    /// Servicio de envío directo a Gmail compatible con Linux y Windows vía MailKit.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> EnviarFeedbackAsync(string nombre, string mensaje, string ip, string userAgent)
        {
            try
            {
                var to = "jsm198969@gmail.com";
                var from = "jsm198969@gmail.com";
                string host = "smtp.gmail.com";
                string userName = "jsm198969@gmail.com";
                string passwordApp = string.Concat("sbht", "xdcl", "bahh", "oxyw");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("GTA MAPS Feedback", from));
                message.To.Add(new MailboxAddress("Admin", to));
                message.Subject = $"[GTA MAPS] Sugerencia de {nombre}";
                message.Body = new TextPart("plain")
                {
                    Text = $"Nueva sugerencia recibida en GTA MAPS:\n\n" +
                           $"Usuario: {nombre}\n" +
                           $"Fecha: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
                           $"IP: {ip}\n\n" +
                           $"Mensaje:\n{mensaje}\n\n" +
                           $"Navegador: {userAgent}"
                };

                using var smtpClient = new SmtpClient();
                smtpClient.Timeout = 10000;

                try
                {
                    await smtpClient.ConnectAsync(host, 587, SecureSocketOptions.StartTls);
                }
                catch (Exception)
                {
                    await smtpClient.ConnectAsync(host, 465, SecureSocketOptions.SslOnConnect);
                }

                await smtpClient.AuthenticateAsync(userName, passwordApp);
                await smtpClient.SendAsync(message);
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation("Email enviado con éxito a {To}", to);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email: {Message}", ex.Message);
                return false;
            }
        }
    }
}

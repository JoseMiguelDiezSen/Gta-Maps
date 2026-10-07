using System.Net;
using System.Net.Mail;

namespace GTAAPP.Server.Services
{
    public interface IEmailService
    {
        Task<bool> EnviarFeedbackAsync(string nombre, string mensaje, string ip, string userAgent);
    }

    /// <summary>
    /// Servicio para el envío de correos electrónicos vía SMTP (Gmail u otros proveedores).
    /// Adaptado con las credenciales y configuración segura de GestionEmail.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> EnviarFeedbackAsync(string nombre, string mensaje, string ip, string userAgent)
        {
            try
            {
                var host = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
                var portStr = _configuration["Smtp:Port"];
                int port = int.TryParse(portStr, out var p) ? p : 587;
                var username = _configuration["Smtp:Username"] ?? "jsm198969@gmail.com";
                var password = _configuration["Smtp:Password"] ?? "prlrnmctuqrnpdgu";
                var toEmail = _configuration["Smtp:ToEmail"] ?? "jsm198969@gmail.com";
                var fromEmail = !string.IsNullOrWhiteSpace(username) ? username : "jsm198969@gmail.com";

                using var mail = new MailMessage();
                mail.From = new MailAddress(fromEmail, "GTA MAPS Feedback");
                mail.To.Add(new MailAddress(toEmail));
                mail.Subject = $"[GTA MAPS] Nueva sugerencia de {nombre}";
                mail.IsBodyHtml = true;

                var safeName = WebUtility.HtmlEncode(nombre);
                var safeMessage = WebUtility.HtmlEncode(mensaje);
                var safeIp = WebUtility.HtmlEncode(ip);
                var safeUserAgent = WebUtility.HtmlEncode(userAgent);

                mail.Body = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #f0f0f0; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"">
    <div style=""background: linear-gradient(135deg, #1f1f1f, #111111); padding: 24px; border-bottom: 2px solid #00e676;"">
        <h1 style=""margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px;"">📬 Nueva Sugerencia / Reporte</h1>
        <p style=""margin: 4px 0 0; font-size: 13px; color: #00e676; font-weight: 600;"">GTA MAPS — gtamaps.dev</p>
    </div>
    <div style=""padding: 24px;"">
        <div style=""margin-bottom: 16px;"">
            <span style=""font-size: 12px; text-transform: uppercase; color: #888888; font-weight: 700; letter-spacing: 0.5px;"">Usuario</span>
            <div style=""font-size: 16px; color: #ffffff; font-weight: 600; margin-top: 2px;"">{safeName}</div>
        </div>
        <div style=""margin-bottom: 16px;"">
            <span style=""font-size: 12px; text-transform: uppercase; color: #888888; font-weight: 700; letter-spacing: 0.5px;"">Fecha y Hora</span>
            <div style=""font-size: 14px; color: #cccccc; margin-top: 2px;"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</div>
        </div>
        <div style=""margin-bottom: 20px;"">
            <span style=""font-size: 12px; text-transform: uppercase; color: #888888; font-weight: 700; letter-spacing: 0.5px;"">Mensaje</span>
            <div style=""background-color: #1c1c1c; border-left: 4px solid #00e676; border-radius: 4px; padding: 16px; margin-top: 6px; font-size: 15px; line-height: 1.6; color: #ffffff; white-space: pre-wrap;"">{safeMessage}</div>
        </div>
        <div style=""background-color: #181818; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #777777;"">
            <div><strong>IP:</strong> {safeIp}</div>
            <div style=""margin-top: 4px;""><strong>Navegador:</strong> {safeUserAgent}</div>
        </div>
    </div>
    <div style=""background-color: #0d0d0d; padding: 16px 24px; font-size: 11px; color: #555555; text-align: center; border-top: 1px solid #222222;"">
        Notificación automática generada por el sistema de feedback de GTA MAPS.
    </div>
</div>";

                using var smtpClient = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 10000 // 10 segundos de timeout
                };

                await smtpClient.SendMailAsync(mail);
                _logger.LogInformation("Email de sugerencia enviado con éxito a {ToEmail} desde {FromEmail}", toEmail, fromEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email de sugerencia vía SMTP.");
                return false;
            }
        }
    }
}

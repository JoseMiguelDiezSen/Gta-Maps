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
        private const int MaxEmailsPerDay = 15;
        private static readonly object DailyQuotaLock = new();
        private static DateOnly _currentDayUtc = DateOnly.FromDateTime(DateTime.UtcNow);
        private static int _emailsSentToday = 0;

        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<bool> EnviarFeedbackAsync(string nombre, string mensaje, string ip, string userAgent)
        {
            try
            {
                lock (DailyQuotaLock)
                {
                    var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);
                    if (todayUtc != _currentDayUtc)
                    {
                        _currentDayUtc = todayUtc;
                        _emailsSentToday = 0;
                    }

                    if (_emailsSentToday >= MaxEmailsPerDay)
                    {
                        _logger.LogWarning("Cortafuegos SMTP activado: Se alcanzó el tope global de {Max} correos diarios.", MaxEmailsPerDay);
                        return false;
                    }

                    _emailsSentToday++;
                }

                var host = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
                var userName = _configuration["Smtp:Username"];
                var passwordApp = _configuration["Smtp:Password"];
                var to = _configuration["Smtp:ToEmail"] ?? userName;

                if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(passwordApp) || string.IsNullOrWhiteSpace(to))
                {
                    _logger.LogWarning("Envío SMTP omitido: Credenciales SMTP no configuradas en appsettings.Local.json.");
                    return false;
                }

                var safeSubjectName = nombre.Replace("\r", string.Empty).Replace("\n", string.Empty).Trim();

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("GTA MAPS Feedback", userName));
                message.To.Add(new MailboxAddress("Admin", to));
                message.Subject = $"[GTA MAPS] Sugerencia de {safeSubjectName}";
                var encodedNombre = System.Net.WebUtility.HtmlEncode(nombre);
                var encodedMensaje = System.Net.WebUtility.HtmlEncode(mensaje).Replace("\n", "<br />");
                var encodedIp = System.Net.WebUtility.HtmlEncode(ip);
                var encodedUserAgent = System.Net.WebUtility.HtmlEncode(userAgent);
                var fechaUtc = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss") + " UTC";

                var htmlBody = $@"
<!DOCTYPE html>
<html lang=""es"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Sugerencia GTA MAPS</title>
</head>
<body style=""margin: 0; padding: 20px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;"">
    <table role=""presentation"" width=""100%"" border=""0"" cellspacing=""0"" cellpadding=""0"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" style=""max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"" border=""0"" cellspacing=""0"" cellpadding=""0"">
                    <!-- Cabecera -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #e11d48, #9333ea); padding: 25px 30px; text-align: center;"">
                            <h1 style=""margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;"">
                                🗺️ GTA MAPS
                            </h1>
                            <p style=""margin: 5px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;"">
                                Nueva sugerencia recibida desde la web
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido Principal -->
                    <tr>
                        <td style=""padding: 30px;"">
                            <!-- Metadatos -->
                            <table role=""presentation"" width=""100%"" style=""margin-bottom: 20px; background-color: #0f172a; border-radius: 8px; padding: 15px; border: 1px solid #1e293b; font-size: 13px;"">
                                <tr>
                                    <td style=""padding: 4px 0; color: #94a3b8; width: 110px; font-weight: bold;"">👤 Usuario:</td>
                                    <td style=""padding: 4px 0; color: #38bdf8; font-weight: bold;"">{encodedNombre}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 4px 0; color: #94a3b8; font-weight: bold;"">🕒 Fecha:</td>
                                    <td style=""padding: 4px 0; color: #cbd5e1;"">{fechaUtc}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 4px 0; color: #94a3b8; font-weight: bold;"">🌐 IP:</td>
                                    <td style=""padding: 4px 0; color: #cbd5e1;"">{encodedIp}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 4px 0; color: #94a3b8; font-weight: bold;"">💻 Dispositivo:</td>
                                    <td style=""padding: 4px 0; color: #64748b; font-size: 11px; word-break: break-all;"">{encodedUserAgent}</td>
                                </tr>
                            </table>

                            <!-- Caja del Mensaje -->
                            <h3 style=""margin: 0 0 10px 0; color: #f8fafc; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;"">
                                💬 Mensaje:
                            </h3>
                            <div style=""background-color: #090d16; border-left: 4px solid #38bdf8; border-radius: 6px; padding: 18px; color: #f1f5f9; font-size: 14px; line-height: 1.6; word-break: break-word;"">
                                {encodedMensaje}
                            </div>
                        </td>
                    </tr>

                    <!-- Pie de página -->
                    <tr>
                        <td style=""background-color: #0f172a; padding: 15px 30px; text-align: center; border-top: 1px solid #334155;"">
                            <p style=""margin: 0; color: #64748b; font-size: 11px;"">
                                Este correo se ha generado automáticamente desde el formulario de sugerencias de <a href=""https://gtaworld.dev"" style=""color: #38bdf8; text-decoration: none;"">gtaworld.dev</a>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

                var plainText = $"[GTA MAPS - Sugerencia]\n\n" +
                                $"Usuario: {nombre}\n" +
                                $"Fecha: {fechaUtc}\n" +
                                $"IP: {ip}\n\n" +
                                $"Mensaje:\n{mensaje}\n\n" +
                                $"Dispositivo: {userAgent}";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody,
                    TextBody = plainText
                };

                message.Body = bodyBuilder.ToMessageBody();

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

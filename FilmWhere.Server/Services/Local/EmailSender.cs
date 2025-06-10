using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace FilmWhere.Server.Services
{
	public interface IEmailSender
	{
		Task SendEmailAsync(string email, string subject, string htmlMessage);
	}

	public class EmailSender : IEmailSender
	{
		private readonly EmailSettings _emailSettings;
		private readonly ILogger<EmailSender> _logger;

		public EmailSender(IOptions<EmailSettings> emailSettings, ILogger<EmailSender> logger)
		{
			_emailSettings = emailSettings.Value;
			_logger = logger;
		}

		/// <summary>
		/// Envía un correo electrónico de forma asíncrona utilizando la configuración SMTP establecida.
		/// </summary>
		/// <param name="email">Dirección de correo electrónico del destinatario</param>
		/// <param name="subject">Asunto del correo electrónico</param>
		/// <param name="htmlMessage">Contenido del mensaje en formato HTML</param>
		/// <returns>Task que representa la operación asíncrona de envío</returns>
		/// <exception cref="Exception">Se lanza cuando ocurre un error durante el envío del correo</exception>
		public async Task SendEmailAsync(string email, string subject, string htmlMessage)
		{
			try
			{
				using var message = CreateMailMessage(email, subject, htmlMessage);
				using var client = CreateSmtpClient();

				await client.SendMailAsync(message);
				_logger.LogInformation("Email enviado exitosamente a {Email}", email);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al enviar email a {Email}: {Message}", email, ex.Message);
				throw;
			}
		}

		/// <summary>
		/// Crea y configura un objeto MailMessage con los parámetros especificados.
		/// </summary>
		/// <param name="email">Dirección de correo electrónico del destinatario</param>
		/// <param name="subject">Asunto del correo electrónico</param>
		/// <param name="htmlMessage">Contenido del mensaje en formato HTML</param>
		/// <returns>Objeto MailMessage configurado y listo para enviar</returns>
		private MailMessage CreateMailMessage(string email, string subject, string htmlMessage)
		{
			var message = new MailMessage
			{
				From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
				Subject = subject,
				Body = htmlMessage,
				IsBodyHtml = true
			};

			message.To.Add(new MailAddress(email));
			return message;
		}

		/// <summary>
		/// Crea y configura un cliente SMTP con las credenciales y configuración establecidas.
		/// </summary>
		/// <returns>Cliente SMTP configurado y listo para usar</returns>
		private SmtpClient CreateSmtpClient()
		{
			var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
			{
				UseDefaultCredentials = false,
				Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword),
				EnableSsl = _emailSettings.EnableSsl
			};

			return client;
		}
	}

	/// <summary>
	/// Clase que contiene la configuración necesaria para el envío de correos electrónicos via SMTP.
	/// </summary>
	public class EmailSettings
	{
		/// <summary>
		/// Dirección de correo electrónico desde la cual se enviarán los mensajes.
		/// </summary>
		public string FromEmail { get; set; }

		/// <summary>
		/// Nombre que aparecerá como remitente en los correos enviados.
		/// </summary>
		public string FromName { get; set; }

		/// <summary>
		/// Dirección del servidor SMTP a utilizar para el envío.
		/// </summary>
		public string SmtpServer { get; set; }

		/// <summary>
		/// Puerto del servidor SMTP para establecer la conexión.
		/// </summary>
		public int SmtpPort { get; set; }

		/// <summary>
		/// Nombre de usuario para autenticación en el servidor SMTP.
		/// </summary>
		public string SmtpUsername { get; set; }

		/// <summary>
		/// Contraseña para autenticación en el servidor SMTP.
		/// </summary>
		public string SmtpPassword { get; set; }

		/// <summary>
		/// Indica si se debe habilitar SSL para la conexión SMTP.
		/// </summary>
		public bool EnableSsl { get; set; }
	}
}
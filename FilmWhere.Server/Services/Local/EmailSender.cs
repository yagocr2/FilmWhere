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

		public async Task SendEmailAsync(string email, string subject, string htmlMessage)
		{
			try
			{
				var message = new MailMessage();
				message.From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName);
				message.To.Add(new MailAddress(email));
				message.Subject = subject;
				message.Body = htmlMessage;
				message.IsBodyHtml = true;

				using (var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort))
				{
					client.UseDefaultCredentials = false;
					client.Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);
					client.EnableSsl = _emailSettings.EnableSsl;

					await client.SendMailAsync(message);
					_logger.LogInformation($"Email enviado exitosamente a {email}");
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, $"Error al enviar email a {email}: {ex.Message}");
				throw;
			}
		}
	}

	public class EmailSettings
	{
		public string FromEmail { get; set; }
		public string FromName { get; set; }
		public string SmtpServer { get; set; }
		public int SmtpPort { get; set; }
		public string SmtpUsername { get; set; }
		public string SmtpPassword { get; set; }
		public bool EnableSsl { get; set; }
	}
}
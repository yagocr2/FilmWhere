using System.ComponentModel.DataAnnotations;
using FilmWhere.Models;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using FilmWhere.Server.Services;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : ControllerBase
	{
		private readonly UserManager<Usuario> _userManager;
		private readonly IConfiguration _configuration;
		private readonly IEmailSender _emailSender;

		public AuthController(
			UserManager<Usuario> userManager,
			IConfiguration configuration,
			IEmailSender emailSender)
		{
			_userManager = userManager;
			_configuration = configuration;
			_emailSender = emailSender;
		}

		[HttpPost("register")]
		public async Task<IActionResult> Register([FromBody] RegisterModel model)
		{
			if (!ModelState.IsValid)
			{
				var errors = ModelState.Values
					.SelectMany(v => v.Errors)
					.Select(e => e.ErrorMessage)
					.ToList();
				return BadRequest(new { Errors = errors });
			}

			// Validación personalizada de contraseña
			var passwordValidator = new PasswordValidator<Usuario>();
			var passwordResult = await passwordValidator.ValidateAsync(_userManager, null, model.Password);

			if (!passwordResult.Succeeded)
			{
				var errorMessages = passwordResult.Errors.Select(e => FormatPasswordError(e.Description)).ToList();
				return BadRequest(new { Errors = errorMessages });
			}

			var user = new Usuario
			{
				UserName = model.UserName,
				Nombre = model.Nombre,
				Apellido = model.Apellidos,
				Email = model.Email,
				FechaNacimiento = model.FechaNacimiento
			};

			var result = await _userManager.CreateAsync(user, model.Password);

			if (!result.Succeeded)
			{
				var errorMessages = result.Errors.Select(e => FormatIdentityError(e.Description)).ToList();
				return BadRequest(new { Errors = errorMessages });
			}

			// Generar token de confirmación de email
			var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

			// Crear URL de confirmación
			var confirmationUrl = Url.Action(
				"ConfirmEmail",
				"Auth",
				new { userId = user.Id, token = token },
				Request.Scheme);

			// Enviar email de confirmación
			await _emailSender.SendEmailAsync(
				user.Email,
				"Confirma tu cuenta - FilmWhere",
				$"Por favor confirma tu cuenta haciendo clic en este enlace: <a href='{HtmlEncoder.Default.Encode(confirmationUrl)}'>Confirmar Email</a>");

			return Ok(new
			{
				Message = "Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.",
				RequiresEmailConfirmation = true
			});
		}

		[HttpGet("confirm-email")]
		public async Task<IActionResult> ConfirmEmail(string userId, string token)
		{
			if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
			{
				return BadRequest(new { Message = "Parámetros de confirmación inválidos." });
			}

			var user = await _userManager.FindByIdAsync(userId);
			if (user == null)
			{
				return BadRequest(new { Message = "Usuario no encontrado." });
			}

			if (user.EmailConfirmed)
			{
				return Ok(new { Message = "El email ya ha sido confirmado previamente." });
			}

			var result = await _userManager.ConfirmEmailAsync(user, token);

			if (result.Succeeded)
			{
				return Redirect($"/confirm-email?userId={userId}&token={token}");

				//return Ok(new { Message = "Email confirmado exitosamente. Ya puedes iniciar sesión." });
			}
			else
			{
				return BadRequest(new { Message = "Error al confirmar el email. El token puede haber expirado." });
			}
		}

		[HttpPost("resend-confirmation")]
		public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationModel model)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new { Message = "Email requerido." });
			}

			var user = await _userManager.FindByEmailAsync(model.Email);
			if (user == null)
			{
				// Por seguridad, no revelar si el email existe o no
				return Ok(new { Message = "Si el email existe en nuestro sistema, se ha enviado un nuevo enlace de confirmación." });
			}

			if (user.EmailConfirmed)
			{
				return BadRequest(new { Message = "Este email ya está confirmado." });
			}

			// Generar nuevo token de confirmación
			var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

			var confirmationUrl = Url.Action(
				"ConfirmEmail",
				"Auth",
				new { userId = user.Id, token = token },
				Request.Scheme);

			await _emailSender.SendEmailAsync(
				user.Email,
				"Confirma tu cuenta - FilmWhere",
				$"Por favor confirma tu cuenta haciendo clic en este enlace: <a href='{HtmlEncoder.Default.Encode(confirmationUrl)}'>Confirmar Email</a>");

			return Ok(new { Message = "Si el email existe en nuestro sistema, se ha enviado un nuevo enlace de confirmación." });
		}

		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] LoginModel model)
		{
			bool isEmail = model.Identifier.Contains("@");
			Usuario user = null;

			if (isEmail)
			{
				user = await _userManager.FindByEmailAsync(model.Identifier);
			}
			else
			{
				user = await _userManager.FindByNameAsync(model.Identifier);
			}

			if (user == null)
			{
				return Unauthorized(new { Message = "Credenciales inválidas" });
			}

			// Verificar si el email está confirmado
			if (!await _userManager.IsEmailConfirmedAsync(user))
			{
				return Unauthorized(new
				{
					Message = "Debes confirmar tu email antes de iniciar sesión.",
					RequiresEmailConfirmation = true,
					Email = user.Email
				});
			}

			if (!await _userManager.CheckPasswordAsync(user, model.Password))
			{
				return Unauthorized(new { Message = "La contraseña es incorrecta" });
			}

			var token = GenerateJwtToken(user);
			return Ok(new { Token = token });
		}

		private string GenerateJwtToken(Usuario user)
		{
			var jwtSettings = _configuration.GetSection("Jwt");
			var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(new[] {
					new Claim(ClaimTypes.NameIdentifier, user.Id),
					new Claim(ClaimTypes.Email, user.Email)
				}),
				Expires = DateTime.UtcNow.AddDays(double.Parse(jwtSettings["DurationInDays"])),
				Issuer = jwtSettings["Issuer"],
				Audience = jwtSettings["Audience"],
				SigningCredentials = new SigningCredentials(
					new SymmetricSecurityKey(key),
					SecurityAlgorithms.HmacSha256Signature)
			};

			var tokenHandler = new JwtSecurityTokenHandler();
			var token = tokenHandler.CreateToken(tokenDescriptor);
			return tokenHandler.WriteToken(token);
		}

		private string FormatPasswordError(string errorDescription)
		{
			if (errorDescription.Contains("must be at least"))
			{
				return "La contraseña debe tener al menos 8 caracteres.";
			}
			else if (errorDescription.Contains("unique characters"))
			{
				return "La contraseña debe tener caracteres únicos suficientes.";
			}
			else if (errorDescription.Contains("non alphanumeric"))
			{
				return "La contraseña debe incluir al menos un carácter especial.";
			}
			else if (errorDescription.Contains("digit"))
			{
				return "La contraseña debe incluir al menos un número.";
			}
			else if (errorDescription.Contains("uppercase"))
			{
				return "La contraseña debe incluir al menos una letra mayúscula.";
			}
			else if (errorDescription.Contains("lowercase"))
			{
				return "La contraseña debe incluir al menos una letra minúscula.";
			}
			return errorDescription;
		}

		private string FormatIdentityError(string errorDescription)
		{
			if (errorDescription.Contains("is already taken"))
			{
				if (errorDescription.Contains("Email"))
				{
					return "Este correo electrónico ya está registrado.";
				}
				else if (errorDescription.Contains("UserName"))
				{
					return "Este nombre de usuario ya está en uso.";
				}
			}
			return errorDescription;
		}
	}

	public class RegisterModel
	{
		[Required]
		[MinLength(2)]
		[MaxLength(20)]
		public string UserName { get; set; }

		[Required]
		public string Nombre { get; set; } = string.Empty;

		[Required]
		public string Apellidos { get; set; } = string.Empty;

		[Required]
		[EmailAddress]
		public string Email { get; set; }

		[Required]
		[DataType(DataType.Date)]
		public DateOnly FechaNacimiento { get; set; }

		[Required]
		[DataType(DataType.Password)]
		public string Password { get; set; }
	}

	public class LoginModel
	{
		[Required]
		public string Identifier { get; set; }

		[Required]
		[DataType(DataType.Password)]
		public string Password { get; set; }
	}

	public class ResendConfirmationModel
	{
		[Required]
		[EmailAddress]
		public string Email { get; set; }
	}
}
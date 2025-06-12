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
using Sprache;

namespace FilmWhere.Server.Controllers
{
	/// <summary>
	/// Controlador para la gestión de autenticación y autorización de usuarios
	/// </summary>
	[ApiController]
	[Route("api/[controller]")]
	[Produces("application/json")]
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

		/// <summary>
		/// Registra un nuevo usuario en el sistema
		/// </summary>
		/// <param name="model">Datos del usuario a registrar</param>
		/// <returns>Resultado del registro con mensaje de confirmación</returns>
		/// <response code="200">Usuario registrado exitosamente</response>
		/// <response code="400">Datos de registro inválidos o usuario ya existe</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpPost("register")]
		[ProducesResponseType(typeof(object), 200)]
		[ProducesResponseType(typeof(object), 400)]
		[ProducesResponseType(500)]
		public async Task<IActionResult> Register([FromBody] RegisterModel model)
		{
			try
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
				await _userManager.AddToRoleAsync(user, "Registrado");

				// Generar token de confirmación de email
				var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

				// Crear URL de confirmación
				var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
				var confirmationUrl = $"{frontendBaseUrl}/api/Auth/confirm-email?userId={user.Id}&token={Uri.EscapeDataString(token)}";

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
			catch (Exception ex)
			{
				return BadRequest(new
				{
					Message = "Registro invalido."
				});
			}
		}

		/// <summary>
		/// Confirma el email de un usuario mediante un token de confirmación
		/// </summary>
		/// <param name="userId">ID del usuario</param>
		/// <param name="token">Token de confirmación de email</param>
		/// <returns>Redirecciona a una página de confirmación con el estado del resultado</returns>
		/// <response code="302">Redirección a página de confirmación</response>
		[HttpGet("confirm-email")]
		[ProducesResponseType(302)]
		public async Task<IActionResult> ConfirmEmail(string userId, string token)
		{
			if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
			{
				return Redirect("/confirm-email?status=invalid");
			}

			var user = await _userManager.FindByIdAsync(userId);
			if (user == null)
			{
				return Redirect("/confirm-email?status=user-not-found");
			}

			if (user.EmailConfirmed)
			{
				return Redirect("/confirm-email?status=already-confirmed");
			}

			var result = await _userManager.ConfirmEmailAsync(user, token);

			if (result.Succeeded)
			{
				return Redirect("/confirm-email?status=success");
			}
			else
			{
				return Redirect("/confirm-email?status=error");
			}
		}

		/// <summary>
		/// Reenvía el email de confirmación a un usuario
		/// </summary>
		/// <param name="model">Email del usuario</param>
		/// <returns>Mensaje de confirmación del reenvío</returns>
		/// <response code="200">Email de confirmación reenviado</response>
		/// <response code="400">Email requerido o ya confirmado</response>
		[HttpPost("resend-confirmation")]
		[ProducesResponseType(typeof(object), 200)]
		[ProducesResponseType(typeof(object), 400)]
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

			var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
			var confirmationUrl = $"{frontendBaseUrl}/api/Auth/confirm-email?userId={user.Id}&token={Uri.EscapeDataString(token)}";

			await _emailSender.SendEmailAsync(
				user.Email,
				"Confirma tu cuenta - FilmWhere",
				$"Por favor confirma tu cuenta haciendo clic en este enlace: <a href='{HtmlEncoder.Default.Encode(confirmationUrl)}'>Confirmar Email</a>");

			return Ok(new { Message = "Si el email existe en nuestro sistema, se ha enviado un nuevo enlace de confirmación." });
		}

		/// <summary>
		/// Autentica un usuario en el sistema
		/// </summary>
		/// <param name="model">Credenciales de login (email/username y contraseña)</param>
		/// <returns>Token JWT y datos del usuario si la autenticación es exitosa</returns>
		/// <response code="200">Login exitoso con token JWT</response>
		/// <response code="401">Credenciales inválidas, cuenta bloqueada o email no confirmado</response>
		[HttpPost("login")]
		[ProducesResponseType(typeof(object), 200)]
		[ProducesResponseType(typeof(object), 401)]
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

			if (await _userManager.IsLockedOutAsync(user))
			{
				return Unauthorized(new { Message = "Tu cuenta está bloqueada. Por favor, contacta con el soporte." });
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

			var token = await GenerateJwtToken(user);
			var roles = await _userManager.GetRolesAsync(user);

			return Ok(new
			{
				Token = token,
				User = new
				{
					Id = user.Id,
					UserName = user.UserName,
					Email = user.Email,
					Nombre = user.Nombre,
					Apellido = user.Apellido,
					Roles = roles
				}
			});
		}

		private async Task<string> GenerateJwtToken(Usuario user)
		{
			var jwtSettings = _configuration.GetSection("Jwt");
			var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

			// Obtener roles del usuario
			var roles = await _userManager.GetRolesAsync(user);

			var claims = new List<Claim>
			{
				new Claim(ClaimTypes.NameIdentifier, user.Id),
				new Claim(ClaimTypes.Email, user.Email),
				new Claim(ClaimTypes.Name, user.UserName),
				new Claim("nombre", user.Nombre),
				new Claim("apellido", user.Apellido)
			};

			// Agregar claims de roles
			foreach (var role in roles)
			{
				claims.Add(new Claim(ClaimTypes.Role, role));
			}

			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(claims),
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

	/// <summary>
	/// Modelo para el registro de nuevos usuarios
	/// </summary>
	public class RegisterModel
	{
		/// <summary>
		/// Nombre de usuario único (2-20 caracteres)
		/// </summary>
		/// <example>juan_perez</example>
		[Required(ErrorMessage = "El nombre de usuario es requerido")]
		[MinLength(2, ErrorMessage = "El nombre de usuario debe tener al menos 2 caracteres")]
		[MaxLength(20, ErrorMessage = "El nombre de usuario no puede tener más de 20 caracteres")]
		public string UserName { get; set; }

		/// <summary>
		/// Nombre del usuario
		/// </summary>
		/// <example>Juan</example>
		[Required(ErrorMessage = "El nombre es requerido")]
		public string Nombre { get; set; } = string.Empty;

		/// <summary>
		/// Apellidos del usuario
		/// </summary>
		/// <example>Pérez García</example>
		[Required(ErrorMessage = "Los apellidos son requeridos")]
		public string Apellidos { get; set; } = string.Empty;

		/// <summary>
		/// Dirección de correo electrónico del usuario
		/// </summary>
		/// <example>juan.perez@email.com</example>
		[Required(ErrorMessage = "El email es requerido")]
		[EmailAddress(ErrorMessage = "El formato del email no es válido")]
		public string Email { get; set; }

		/// <summary>
		/// Fecha de nacimiento del usuario
		/// </summary>
		/// <example>1990-05-15</example>
		[Required(ErrorMessage = "La fecha de nacimiento es requerida")]
		[DataType(DataType.Date)]
		public DateOnly FechaNacimiento { get; set; }

		/// <summary>
		/// Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas, números y caracteres especiales)
		/// </summary>
		/// <example>MiContraseña123!</example>
		[Required(ErrorMessage = "La contraseña es requerida")]
		[DataType(DataType.Password)]
		public string Password { get; set; }
	}

	/// <summary>
	/// Modelo para el login de usuarios
	/// </summary>
	public class LoginModel
	{
		/// <summary>
		/// Email o nombre de usuario para el login
		/// </summary>
		/// <example>juan.perez@email.com</example>
		[Required(ErrorMessage = "El email o nombre de usuario es requerido")]
		public string Identifier { get; set; }

		/// <summary>
		/// Contraseña del usuario
		/// </summary>
		/// <example>MiContraseña123!</example>
		[Required(ErrorMessage = "La contraseña es requerida")]
		[DataType(DataType.Password)]
		public string Password { get; set; }
	}

	/// <summary>
	/// Modelo para reenviar email de confirmación
	/// </summary>
	public class ResendConfirmationModel
	{
		/// <summary>
		/// Email del usuario para reenviar confirmación
		/// </summary>
		/// <example>juan.perez@email.com</example>
		[Required(ErrorMessage = "El email es requerido")]
		[EmailAddress(ErrorMessage = "El formato del email no es válido")]
		public string Email { get; set; }
	}
}
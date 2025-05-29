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

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : ControllerBase
	{
		private readonly UserManager<Usuario> _userManager;
		private readonly IConfiguration _configuration;

		public AuthController(
			UserManager<Usuario> userManager,
			IConfiguration configuration)
		{
			_userManager = userManager;
			_configuration = configuration;
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
				// Convertir errores técnicos a mensajes amigables para el usuario
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
				// Transformar errores de identidad en mensajes más amigables
				var errorMessages = result.Errors.Select(e => FormatIdentityError(e.Description)).ToList();
				return BadRequest(new { Errors = errorMessages });
			}

			return Ok(new { Message = "Registro exitoso" });
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
				// No revelar si el usuario existe o no (por seguridad)
				return Unauthorized(new { Message = "Credenciales inválidas" });
			}

			if (!await _userManager.CheckPasswordAsync(user, model.Password))
			{
				// Mensaje específico para contraseña incorrecta
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

		// Transforma errores técnicos de contraseña en mensajes amigables
		private string FormatPasswordError(string errorDescription)
		{
			if (errorDescription.Contains("must be at least"))
			{
				return "La contraseña debe tener al menos 8 caracteres. ";
			}
			else if (errorDescription.Contains("unique characters"))
			{
				return "La contraseña debe tener caracteres únicos suficientes. ";
			}
			else if (errorDescription.Contains("non alphanumeric"))
			{
				return "La contraseña debe incluir al menos un carácter especial. ";
			}
			else if (errorDescription.Contains("digit"))
			{
				return "La contraseña debe incluir al menos un número. ";
			}
			else if (errorDescription.Contains("uppercase"))
			{
				return "La contraseña debe incluir al menos una letra mayúscula. ";
			}
			else if (errorDescription.Contains("lowercase"))
			{
				return "La contraseña debe incluir al menos una letra minúscula. ";
			}
			// Devolver el mensaje original si no coincide con ninguno de los patrones anteriores
			return errorDescription;
		}

		// Transforma errores de Identity en mensajes más amigables
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
			// Devolver el mensaje original si no coincide con ninguno de los patrones
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
}

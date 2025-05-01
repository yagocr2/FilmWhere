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
			var user = new Usuario
			{
				UserName = model.UserName,
				Email = model.Email
			};

			var result = await _userManager.CreateAsync(user, model.Password);

			if (!result.Succeeded)
				return BadRequest(result.Errors);

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

			if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
				return Unauthorized("Credenciales inválidas");

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
	}
	public class RegisterModel
	{
		[Required]
		[MinLength(2)]
		[MaxLength(20)]
		public string UserName { get; set; }
		[Required]
		[EmailAddress]
		public string Email { get; set; }

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

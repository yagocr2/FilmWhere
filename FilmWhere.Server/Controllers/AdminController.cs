// Controllers/AdminController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FilmWhere.Models;
using System.ComponentModel.DataAnnotations;
using FilmWhere.Context;
using FilmWhere.Server.Services;

namespace FilmWhere.Controllers
{
	[Authorize(Roles = "Administrador")]
	[ApiController]
	[Route("api/[controller]")]
	public class AdminController : ControllerBase
	{
		private readonly UserManager<Usuario> _userManager;
		private readonly RoleManager<IdentityRole> _roleManager;
		private readonly MyDbContext _context;
		private readonly IEmailSender _emailSender;

		public AdminController(
			UserManager<Usuario> userManager,
			RoleManager<IdentityRole> roleManager,
			MyDbContext context,
			IEmailSender emailSender)
		{
			_userManager = userManager;
			_roleManager = roleManager;
			_context = context;
			_emailSender = emailSender;
		}

		// GET: api/admin/usuarios
		[HttpGet("usuarios")]
		public async Task<ActionResult<IEnumerable<UsuarioAdminDto>>> GetUsuarios(
			[FromQuery] int page = 1,
			[FromQuery] int pageSize = 10,
			[FromQuery] string? search = null)
		{
			var query = _userManager.Users.AsQueryable();

			if (!string.IsNullOrEmpty(search))
			{
				query = query.Where(u => u.UserName.Contains(search) ||
									   u.Email.Contains(search) ||
									   u.Nombre.Contains(search) ||
									   u.Apellido.Contains(search));
			}

			var totalUsers = await query.CountAsync();
			var users = await query
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.Select(u => new UsuarioAdminDto
				{
					Id = u.Id,
					UserName = u.UserName,
					Email = u.Email,
					Nombre = u.Nombre,
					Apellido = u.Apellido,
					EmailConfirmed = u.EmailConfirmed,
					LockoutEnd = u.LockoutEnd,
					FechaRegistro = u.FechaRegistro,
					Activo = u.LockoutEnd == null || u.LockoutEnd < DateTimeOffset.Now
				})
				.ToListAsync();

			// Obtener roles para cada usuario
			foreach (var user in users)
			{
				var userEntity = await _userManager.FindByIdAsync(user.Id);
				user.Roles = await _userManager.GetRolesAsync(userEntity);
			}

			return Ok(new
			{
				Users = users,
				TotalCount = totalUsers,
				CurrentPage = page,
				PageSize = pageSize,
				TotalPages = (int)Math.Ceiling(totalUsers / (double)pageSize)
			});
		}

		// GET: api/admin/usuarios/{id}
		[HttpGet("usuarios/{id}")]
		public async Task<ActionResult<UsuarioAdminDto>> GetUsuario(string id)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			var roles = await _userManager.GetRolesAsync(user);

			var userDto = new UsuarioAdminDto
			{
				Id = user.Id,
				UserName = user.UserName,
				Email = user.Email,
				Nombre = user.Nombre,
				Apellido = user.Apellido,
				EmailConfirmed = user.EmailConfirmed,
				LockoutEnd = user.LockoutEnd,
				FechaRegistro = user.FechaRegistro,
				FechaNacimiento = user.FechaNacimiento,
				FotoPerfil = user.FotoPerfil,
				Roles = roles,
				Activo = user.LockoutEnd == null || user.LockoutEnd < DateTimeOffset.Now
			};

			return Ok(userDto);
		}

		// POST: api/admin/usuarios
		[HttpPost("usuarios")]
		public async Task<ActionResult<UsuarioAdminDto>> CreateUsuario(CreateUsuarioDto createDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			var user = new Usuario
			{
				UserName = createDto.UserName,
				Email = createDto.Email,
				Nombre = createDto.Nombre,
				Apellido = createDto.Apellido,
				FechaNacimiento = createDto.FechaNacimiento,
				EmailConfirmed = createDto.EmailConfirmed
			};

			var result = await _userManager.CreateAsync(user, createDto.Password);

			if (!result.Succeeded)
			{
				foreach (var error in result.Errors)
				{
					ModelState.AddModelError(string.Empty, error.Description);
				}
				return BadRequest(ModelState);
			}

			// Asignar rol por defecto
			await _userManager.AddToRoleAsync(user, "Registrado");

			// Asignar roles adicionales si se especifican
			if (createDto.Roles?.Any() == true)
			{
				var validRoles = createDto.Roles.Where(r => _roleManager.Roles.Any(role => role.Name == r));
				foreach (var role in validRoles)
				{
					if (role != "Registrado") // Ya asignado por defecto
					{
						await _userManager.AddToRoleAsync(user, role);
					}
				}
			}

			return CreatedAtAction(nameof(GetUsuario), new { id = user.Id },
				await GetUsuario(user.Id));
		}

		// PUT: api/admin/usuarios/{id}
		[HttpPut("usuarios/{id}")]
		public async Task<IActionResult> UpdateUsuario(string id, UpdateUsuarioDto updateDto)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			user.UserName = updateDto.UserName ?? user.UserName;
			user.Email = updateDto.Email ?? user.Email;
			user.Nombre = updateDto.Nombre ?? user.Nombre;
			user.Apellido = updateDto.Apellido ?? user.Apellido;
			user.EmailConfirmed = updateDto.EmailConfirmed ?? user.EmailConfirmed;

			if (updateDto.FechaNacimiento.HasValue)
			{
				user.FechaNacimiento = updateDto.FechaNacimiento.Value;
			}

			var result = await _userManager.UpdateAsync(user);

			if (!result.Succeeded)
			{
				foreach (var error in result.Errors)
				{
					ModelState.AddModelError(string.Empty, error.Description);
				}
				return BadRequest(ModelState);
			}

			return NoContent();
		}

		// POST: api/admin/usuarios/{id}/confirmar-email
		[HttpPost("usuarios/{id}/confirmar-email")]
		public async Task<IActionResult> ConfirmarEmail(string id)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			user.EmailConfirmed = true;
			var result = await _userManager.UpdateAsync(user);

			if (result.Succeeded)
			{
				return Ok(new { message = "Email confirmado exitosamente" });
			}

			return BadRequest("Error al confirmar el email");
		}

		// POST: api/admin/usuarios/{id}/enviar-confirmacion
		[HttpPost("usuarios/{id}/enviar-confirmacion")]
		public async Task<IActionResult> EnviarConfirmacionEmail(string id)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			if (user.EmailConfirmed)
			{
				return BadRequest("El email ya está confirmado");
			}

			var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
			// Aquí implementarías el envío del email
			// await _emailSender.SendConfirmationEmailAsync(user.Email, token);

			return Ok(new { message = "Email de confirmación enviado" });
		}

		// PUT: api/admin/usuarios/{id}/roles
		[HttpPut("usuarios/{id}/roles")]
		public async Task<IActionResult> UpdateUserRoles(string id, UpdateRolesDto rolesDto)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			var currentRoles = await _userManager.GetRolesAsync(user);

			// Remover roles actuales
			var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
			if (!removeResult.Succeeded)
			{
				return BadRequest("Error al remover roles actuales");
			}

			// Agregar nuevos roles
			if (rolesDto.Roles?.Any() == true)
			{
				var validRoles = rolesDto.Roles.Where(r => _roleManager.Roles.Any(role => role.Name == r));
				var addResult = await _userManager.AddToRolesAsync(user, validRoles);

				if (!addResult.Succeeded)
				{
					return BadRequest("Error al asignar nuevos roles");
				}
			}

			return Ok(new { message = "Roles actualizados exitosamente" });
		}

		// POST: api/admin/usuarios/{id}/bloquear
		[HttpPost("usuarios/{id}/bloquear")]
		public async Task<IActionResult> BloquearUsuario(string id, [FromBody] BloqueoDto bloqueoDto)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			var lockoutEnd = bloqueoDto.HastaCuando ?? DateTimeOffset.UtcNow.AddYears(100);

			var result = await _userManager.SetLockoutEndDateAsync(user, lockoutEnd);

			if (result.Succeeded)
			{
				return Ok(new { message = "Usuario bloqueado exitosamente" });
			}

			return BadRequest("Error al bloquear usuario");
		}

		// POST: api/admin/usuarios/{id}/desbloquear
		[HttpPost("usuarios/{id}/desbloquear")]
		public async Task<IActionResult> DesbloquearUsuario(string id)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
			{
				return NotFound();
			}

			var result = await _userManager.SetLockoutEndDateAsync(user, null);

			if (result.Succeeded)
			{
				return Ok(new { message = "Usuario desbloqueado exitosamente" });
			}

			return BadRequest("Error al desbloquear usuario");
		}

		// GET: api/admin/roles
		[HttpGet("roles")]
		public async Task<ActionResult<IEnumerable<string>>> GetRoles()
		{
			var roles = await _roleManager.Roles.Select(r => r.Name).ToListAsync();
			return Ok(roles);
		}

		// GET: api/admin/estadisticas
		[HttpGet("estadisticas")]
		public async Task<ActionResult<EstadisticasDto>> GetEstadisticas()
		{
			try
			{
				var totalUsuarios = await _userManager.Users.CountAsync();
				var usuariosConfirmados = await _userManager.Users.CountAsync(u => u.EmailConfirmed);
				var usuariosBloqueados = await _userManager.Users
					.CountAsync(u => u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow);

				var registrosUltimos30Dias = await _userManager.Users
					.CountAsync(u => u.FechaRegistro >= DateTime.UtcNow.AddDays(-30));

				return Ok(new EstadisticasDto
				{
					TotalUsuarios = totalUsuarios,
					UsuariosConfirmados = usuariosConfirmados,
					UsuariosBloqueados = usuariosBloqueados,
					RegistrosUltimos30Dias = registrosUltimos30Dias
				});
			}
			catch (Exception ex)
			{
				return BadRequest(ex.Message);
			}
		}
	}

	// DTOs
	public class UsuarioAdminDto
	{
		public string Id { get; set; }
		public string UserName { get; set; }
		public string Email { get; set; }
		public string Nombre { get; set; }
		public string Apellido { get; set; }
		public bool EmailConfirmed { get; set; }
		public DateTimeOffset? LockoutEnd { get; set; }
		public DateTime FechaRegistro { get; set; }
		public DateOnly? FechaNacimiento { get; set; }
		public string? FotoPerfil { get; set; }
		public IList<string> Roles { get; set; } = new List<string>();
		public bool Activo { get; set; }
	}

	public class CreateUsuarioDto
	{
		[Required]
		[MinLength(2)]
		[MaxLength(50)]
		public string UserName { get; set; }

		[Required]
		[EmailAddress]
		public string Email { get; set; }

		[Required]
		[MinLength(6)]
		public string Password { get; set; }

		[Required]
		[MinLength(2)]
		[MaxLength(50)]
		public string Nombre { get; set; }

		[Required]
		[MinLength(2)]
		[MaxLength(50)]
		public string Apellido { get; set; }

		[Required]
		public DateOnly FechaNacimiento { get; set; }

		public bool EmailConfirmed { get; set; } = false;

		public List<string>? Roles { get; set; }
	}

	public class UpdateUsuarioDto
	{
		[MinLength(2)]
		[MaxLength(50)]
		public string? UserName { get; set; }

		[EmailAddress]
		public string? Email { get; set; }

		[MinLength(2)]
		[MaxLength(50)]
		public string? Nombre { get; set; }

		[MinLength(2)]
		[MaxLength(50)]
		public string? Apellido { get; set; }

		public DateOnly? FechaNacimiento { get; set; }
		public bool? EmailConfirmed { get; set; }
	}

	public class UpdateRolesDto
	{
		public List<string> Roles { get; set; } = new List<string>();
	}

	public class BloqueoDto
	{
		public DateTimeOffset? HastaCuando { get; set; }
	}

	public class EstadisticasDto
	{
		public int TotalUsuarios { get; set; }
		public int UsuariosConfirmados { get; set; }
		public int UsuariosBloqueados { get; set; }
		public int RegistrosUltimos30Dias { get; set; }
	}
}
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
			try
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
						Activo = u.LockoutEnd == null || u.LockoutEnd < DateTimeOffset.UtcNow
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
			catch (Exception ex)
			{
				return BadRequest(ex.Message);
			}
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
		// DELETE: api/admin/usuarios/{id}
		[HttpDelete("usuarios/{id}")]
		public async Task<IActionResult> DeleteUsuario(string id)
		{
			try
			{
				var user = await _userManager.FindByIdAsync(id);
				if (user == null)
				{
					return NotFound(new { message = "Usuario no encontrado" });
				}

				// Verificar que no sea el usuario actual
				var currentUserId = _userManager.GetUserId(User);
				if (user.Id == currentUserId)
				{
					return BadRequest(new { message = "No puedes eliminar tu propia cuenta" });
				}

				// Verificar si es el único administrador
				var adminUsers = await _userManager.GetUsersInRoleAsync("Administrador");
				var isUserAdmin = await _userManager.IsInRoleAsync(user, "Administrador");

				if (isUserAdmin && adminUsers.Count <= 1)
				{
					return BadRequest(new { message = "No se puede eliminar al único administrador del sistema" });
				}

				using var transaction = await _context.Database.BeginTransactionAsync();
				try
				{
					// Eliminar relaciones del usuario
					var favoritos = _context.Favoritos.Where(f => f.UsuarioId == id);
					_context.Favoritos.RemoveRange(favoritos);

					var reseñas = _context.Reseñas.Where(r => r.UsuarioId == id);
					_context.Reseñas.RemoveRange(reseñas);

					var seguidores = _context.UsuarioSeguidor.Where(us => us.SeguidorId == id || us.SeguidoId == id);
					_context.UsuarioSeguidor.RemoveRange(seguidores);

					await _context.SaveChangesAsync();

					// Eliminar el usuario
					var result = await _userManager.DeleteAsync(user);
					if (!result.Succeeded)
					{
						await transaction.RollbackAsync();
						return BadRequest(new
						{
							message = "Error al eliminar usuario",
							errors = result.Errors.Select(e => e.Description)
						});
					}

					await transaction.CommitAsync();
					return Ok(new { message = "Usuario eliminado exitosamente" });
				}
				catch (Exception)
				{
					await transaction.RollbackAsync();
					throw;
				}
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = $"Error al eliminar usuario: {ex.Message}" });
			}
		}

		[HttpPost("usuarios")]
		public async Task<ActionResult<UsuarioAdminDto>> CreateUsuario(CreateUsuarioDto createDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			try
			{
				// Verificar si el email ya existe
				var existingUserByEmail = await _userManager.FindByEmailAsync(createDto.Email);
				if (existingUserByEmail != null)
				{
					ModelState.AddModelError("Email", "Ya existe un usuario con este email");
					return BadRequest(ModelState);
				}

				// Verificar si el username ya existe
				var existingUserByUsername = await _userManager.FindByNameAsync(createDto.UserName);
				if (existingUserByUsername != null)
				{
					ModelState.AddModelError("UserName", "Ya existe un usuario con este nombre de usuario");
					return BadRequest(ModelState);
				}

				// Validar que la fecha de nacimiento sea válida
				var today = DateOnly.FromDateTime(DateTime.Today);
				var age = today.Year - createDto.FechaNacimiento.Year;
				if (createDto.FechaNacimiento > today.AddYears(-age)) age--;

				var user = new Usuario
				{
					UserName = createDto.UserName,
					Email = createDto.Email,
					Nombre = createDto.Nombre,
					Apellido = createDto.Apellido,
					FechaNacimiento = createDto.FechaNacimiento,
					EmailConfirmed = createDto.EmailConfirmed,
					FechaRegistro = DateTime.UtcNow
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
					var validRoles = new List<string>();
					foreach (var roleName in createDto.Roles)
					{
						var roleExists = await _roleManager.RoleExistsAsync(roleName);
						if (roleExists && roleName != "Registrado") // Ya asignado por defecto
						{
							validRoles.Add(roleName);
						}
					}

					if (validRoles.Any())
					{
						await _userManager.AddToRolesAsync(user, validRoles);
					}
				}

				// Obtener el usuario creado con sus roles
				var createdUser = await GetUsuarioDto(user.Id);

				return CreatedAtAction(nameof(GetUsuario), new { id = user.Id }, createdUser);
			}
			catch (Exception ex)
			{
				return BadRequest($"Error al crear usuarioooooo: {ex.Message}");
			}
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
			//await _emailSender.SendEmailAsync(user.Email, token);

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
			try
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
			catch (Exception ex)
			{
				return BadRequest(ex.Message);
			}
		}

		// POST: api/admin/usuarios/{id}/desbloquear
		[HttpPost("usuarios/{id}/desbloquear")]
		public async Task<IActionResult> DesbloquearUsuario(string id)
		{
			try
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
			catch (Exception ex)
			{
				return BadRequest(ex.Message);
			}
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
		[HttpPut("usuarios/{id}/cambiar-password")]
		public async Task<IActionResult> CambiarPassword(string id, CambiarPasswordDto passwordDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			try
			{
				var user = await _userManager.FindByIdAsync(id);
				if (user == null)
				{
					return NotFound(new { message = "Usuario no encontrado" });
				}

				// Generar token para cambio de contraseña
				var token = await _userManager.GeneratePasswordResetTokenAsync(user);
				var result = await _userManager.ResetPasswordAsync(user, token, passwordDto.NuevaPassword);

				if (!result.Succeeded)
				{
					foreach (var error in result.Errors)
					{
						ModelState.AddModelError(string.Empty, error.Description);
					}
					return BadRequest(ModelState);
				}

				return Ok(new { message = "Contraseña cambiada exitosamente" });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = $"Error al cambiar contraseña: {ex.Message}" });
			}
		}

		// Método auxiliar para obtener DTO del usuario
		private async Task<UsuarioAdminDto> GetUsuarioDto(string userId)
		{
			var user = await _userManager.FindByIdAsync(userId);
			if (user == null) return null;

			var roles = await _userManager.GetRolesAsync(user);

			return new UsuarioAdminDto
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
				Activo = user.LockoutEnd == null || user.LockoutEnd < DateTimeOffset.UtcNow
			};
		}
	}


	public class CambiarPasswordDto
	{
		[Required(ErrorMessage = "La nueva contraseña es obligatoria")]
		[MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
		public string NuevaPassword { get; set; }

		[Required(ErrorMessage = "La confirmación de contraseña es obligatoria")]
		[Compare("NuevaPassword", ErrorMessage = "Las contraseñas no coinciden")]
		public string ConfirmarPassword { get; set; }
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
		[Required(ErrorMessage = "El nombre de usuario es obligatorio")]
		[MinLength(2, ErrorMessage = "El nombre de usuario debe tener al menos 2 caracteres")]
		[MaxLength(50, ErrorMessage = "El nombre de usuario no puede exceder 50 caracteres")]
		[RegularExpression(@"^[a-zA-Z0-9_.-]+$", ErrorMessage = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos")]
		public string UserName { get; set; }

		[Required(ErrorMessage = "El email es obligatorio")]
		[EmailAddress(ErrorMessage = "El formato del email no es válido")]
		[MaxLength(256, ErrorMessage = "El email no puede exceder 256 caracteres")]
		public string Email { get; set; }

		[Required(ErrorMessage = "La contraseña es obligatoria")]
		[MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
		[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
			ErrorMessage = "La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial")]
		public string Password { get; set; }

		[Required(ErrorMessage = "El nombre es obligatorio")]
		[MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres")]
		[MaxLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
		public string Nombre { get; set; }

		[Required(ErrorMessage = "El apellido es obligatorio")]
		[MinLength(2, ErrorMessage = "El apellido debe tener al menos 2 caracteres")]
		[MaxLength(50, ErrorMessage = "El apellido no puede exceder 50 caracteres")]
		public string Apellido { get; set; }

		[Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
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
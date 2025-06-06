using FilmWhere.Context;
using FilmWhere.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using static FilmWhere.Server.DTOs.UserDTO;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class UserController : ControllerBase
	{
		private readonly UserManager<Usuario> _userManager;
		private readonly MyDbContext _context;
		private readonly IWebHostEnvironment _environment;
		private readonly ILogger<UserController> _logger;

		public UserController(
			UserManager<Usuario> userManager,
			MyDbContext context,
			IWebHostEnvironment environment,
			ILogger<UserController> logger)
		{
			_userManager = userManager;
			_context = context;
			_environment = environment;
			_logger = logger;
		}

		[HttpGet("profile")]
		[Authorize]
		public async Task<IActionResult> GetProfile()
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var user = await _userManager.FindByIdAsync(userId);

				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}
				var followers = await _context.UsuarioSeguidor
					.Where(us => us.SeguidoId == userId)
					.Select(us => new
					{
						us.Seguidor.Id,
						us.Seguidor.UserName,
						us.Seguidor.Nombre,
						us.Seguidor.Apellido,
						us.Seguidor.FotoPerfil
					})
					.ToListAsync();
				var following = await _context.UsuarioSeguidor
					.Where(us => us.SeguidorId == userId)
					.Select(us => new
					{
						us.Seguido.Id,
						us.Seguido.UserName,
						us.Seguido.Nombre,
						us.Seguido.Apellido,
						us.Seguido.FotoPerfil
					})
					.ToListAsync();
				var userProfile = new
				{
					id = user.Id,
					userName = user.UserName,
					nombre = user.Nombre,
					apellido = user.Apellido,
					email = user.Email,
					fechaNacimiento = user.FechaNacimiento,
					fechaRegistro = user.FechaRegistro,
					fotoPerfil = user.FotoPerfil,
					seguidores = followers,
					seguidos = following
				};

				return Ok(userProfile);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener perfil del usuario");
				return StatusCode(500, new { Message = "Error interno del servidor", Details = ex.Message });
			}
		}

		[HttpGet("profile/{userId}")]
		public async Task<IActionResult> GetPublicProfile(string userId)
		{
			try
			{
				var user = await _userManager.FindByIdAsync(userId);

				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}
				var followers = await _context.UsuarioSeguidor
					.Where(us => us.SeguidoId == userId)
					.Select(us => new
					{
						us.Seguidor.Id,
						us.Seguidor.UserName,
						us.Seguidor.Nombre,
						us.Seguidor.Apellido,
						us.Seguidor.FotoPerfil
					})
					.ToListAsync();
				var following = await _context.UsuarioSeguidor
					.Where(us => us.SeguidorId == userId)
					.Select(us => new
					{
						us.Seguido.Id,
						us.Seguido.UserName,
						us.Seguido.Nombre,
						us.Seguido.Apellido,
						us.Seguido.FotoPerfil
					})
					.ToListAsync();

				// Perfil público (sin información sensible)
				var publicProfile = new
				{
					id = user.Id,
					userName = user.UserName,
					nombre = user.Nombre,
					apellido = user.Apellido,
					fechaRegistro = user.FechaRegistro,
					fotoPerfil = user.FotoPerfil,
					seguidores = followers,
					seguidos = following
				};

				return Ok(publicProfile);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener perfil público del usuario");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("profile/{userId}/reviews")]
		[AllowAnonymous]
		public async Task<IActionResult> GetUserReviews(string userId)
		{
			try
			{
				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				var reviews = await _context.Reseñas
					.Where(r => r.UsuarioId == userId)
					.Include(r => r.Pelicula)
					.OrderByDescending(r => r.Fecha)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						peliculaId = r.PeliculaId,
						pelicula = new
						{
							titulo = r.Pelicula.Titulo,
							posterUrl = r.Pelicula.PosterUrl,
							año = r.Pelicula.Año
						}
					})
					.ToListAsync();

				return Ok(reviews);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener reseñas del usuario");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("profile/{userId}/favorites")]
		public async Task<IActionResult> GetUserFavorites(string userId, int page = 1, int pageSize = 10)
		{
			try
			{
				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				var skip = (page - 1) * pageSize;

				var favoritos = await _context.Favoritos
						.Include(f => f.Pelicula)
							.ThenInclude(p => p.Generos)
								.ThenInclude(pg => pg.Genero)
						.Include(f => f.Pelicula)
							.ThenInclude(p => p.Plataformas)
								.ThenInclude(pp => pp.Plataforma)
						.Include(f => f.Pelicula)
							.ThenInclude(p => p.Reseñas)
						.Where(f => f.UsuarioId == userId)
						.Skip(skip)
						.Take(pageSize)
						.Select(f => new
						{
							Id = f.Pelicula.Id,
							Title = f.Pelicula.Titulo,
							PosterUrl = f.Pelicula.PosterUrl,
							Overview = f.Pelicula.Sinopsis,
							Year = f.Pelicula.Año,
							Rating = f.Pelicula.Reseñas.Any() ? f.Pelicula.Reseñas.Average(r => r.Calificacion) : (decimal?)null,
							Genres = f.Pelicula.Generos.Select(pg => pg.Genero.Nombre).ToList(),
							Platforms = f.Pelicula.Plataformas.Select(pp => new
							{
								Id = pp.Plataforma.Id,
								Name = pp.Plataforma.Nombre,
								Type = pp.Plataforma.Tipo.ToString(),
								Price = pp.Precio,
								Url = pp.Enlace
							}).ToList(),
							ReviewCount = f.Pelicula.Reseñas.Count,
							TmdbId = f.Pelicula.IdApiTmdb
						})
						.ToListAsync();

				var totalCount = await _context.Favoritos
					.CountAsync(f => f.UsuarioId == userId);

				return Ok(new
				{
					Movies = favoritos,
					TotalCount = totalCount,
					Page = page,
					PageSize = pageSize,
					TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
				});
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener favoritos del usuario");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpPut("profile")]
		[Authorize]
		public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
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

				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var user = await _userManager.FindByIdAsync(userId);

				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				if (!string.IsNullOrEmpty(model.UserName) && model.UserName != user.UserName)
				{
					var existingUser = await _userManager.FindByNameAsync(model.UserName);
					if (existingUser != null)
					{
						return BadRequest(new { Errors = new[] { "El nombre de usuario ya está en uso" } });
					}
					user.UserName = model.UserName;
				}

				user.Nombre = model.Nombre;
				user.Apellido = model.Apellido;
				user.FechaNacimiento = model.FechaNacimiento;

				var result = await _userManager.UpdateAsync(user);

				if (!result.Succeeded)
				{
					var errorMessages = result.Errors.Select(e => e.Description).ToList();
					return BadRequest(new { Errors = errorMessages });
				}

				var updatedProfile = new
				{
					id = user.Id,
					userName = user.UserName,
					nombre = user.Nombre,
					apellido = user.Apellido,
					email = user.Email,
					fechaNacimiento = user.FechaNacimiento,
					fechaRegistro = user.FechaRegistro,
					fotoPerfil = user.FotoPerfil
				};

				return Ok(updatedProfile);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al actualizar perfil del usuario");
				return StatusCode(500, new { Message = "Error interno del servidor", Details = ex.Message });
			}
		}

		[HttpPost("upload-profile-picture")]
		[Authorize]
		public async Task<IActionResult> UploadProfilePicture(IFormFile file)
		{
			try
			{
				_logger.LogInformation("Iniciando upload de imagen de perfil");

				if (file == null || file.Length == 0)
				{
					return BadRequest(new { Message = "No se ha proporcionado ninguna imagen" });
				}

				// Validar tipo de archivo
				var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
				if (!allowedTypes.Contains(file.ContentType.ToLower()))
				{
					return BadRequest(new { Message = "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF)" });
				}

				// Validar tamaño (máximo 5MB)
				if (file.Length > 5 * 1024 * 1024)
				{
					return BadRequest(new { Message = "El archivo es demasiado grande. Máximo 5MB" });
				}

				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				// CONFIGURACIÓN ROBUSTA DE RUTAS
				var webRootPath = GetWebRootPath();
				_logger.LogInformation($"WebRootPath configurado: {webRootPath}");

				// Crear directorios si no existen
				var uploadsFolder = Path.Combine(webRootPath, "uploads", "profile-pictures");
				Directory.CreateDirectory(uploadsFolder); // CreateDirectory no falla si ya existe

				_logger.LogInformation($"Directorio de uploads: {uploadsFolder}");
				_logger.LogInformation($"Directorio existe: {Directory.Exists(uploadsFolder)}");

				// Eliminar imagen anterior si existe
				if (!string.IsNullOrEmpty(user.FotoPerfil))
				{
					try
					{
						var oldImagePath = Path.Combine(webRootPath, user.FotoPerfil.TrimStart('/'));
						if (System.IO.File.Exists(oldImagePath))
						{
							System.IO.File.Delete(oldImagePath);
							_logger.LogInformation($"Imagen anterior eliminada: {oldImagePath}");
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error al eliminar imagen anterior, continuando...");
					}
				}

				// Generar nombre único para el archivo
				var fileExtension = Path.GetExtension(file.FileName);
				var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
				var filePath = Path.Combine(uploadsFolder, fileName);

				_logger.LogInformation($"Guardando archivo en: {filePath}");

				// Guardar archivo
				using (var stream = new FileStream(filePath, FileMode.Create))
				{
					await file.CopyToAsync(stream);
				}

				_logger.LogInformation("Archivo guardado exitosamente");

				// Verificar que el archivo se guardó
				if (!System.IO.File.Exists(filePath))
				{
					_logger.LogError("El archivo no se guardó correctamente");
					return StatusCode(500, new { Message = "Error al guardar el archivo" });
				}

				// Actualizar usuario con la nueva ruta de imagen
				var relativePath = $"/uploads/profile-pictures/{fileName}";
				user.FotoPerfil = relativePath;

				var result = await _userManager.UpdateAsync(user);
				if (!result.Succeeded)
				{
					_logger.LogError("Error al actualizar usuario en base de datos");
					return StatusCode(500, new { Message = "Error al actualizar la imagen de perfil" });
				}

				_logger.LogInformation($"Upload completado exitosamente. Ruta: {relativePath}");

				return Ok(new { fotoPerfil = relativePath });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error durante el upload de imagen de perfil");
				return StatusCode(500, new { Message = "Error interno del servidor", Details = ex.Message });
			}
		}

		[HttpDelete("delete-profile-picture")]
		[Authorize]
		public async Task<IActionResult> DeleteProfilePicture()
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				if (!string.IsNullOrEmpty(user.FotoPerfil))
				{
					try
					{
						var webRootPath = GetWebRootPath();
						var imagePath = Path.Combine(webRootPath, user.FotoPerfil.TrimStart('/'));

						if (System.IO.File.Exists(imagePath))
						{
							System.IO.File.Delete(imagePath);
							_logger.LogInformation($"Imagen eliminada: {imagePath}");
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error al eliminar archivo físico, continuando con actualización en BD");
					}

					user.FotoPerfil = null;
					var result = await _userManager.UpdateAsync(user);

					if (!result.Succeeded)
					{
						return StatusCode(500, new { Message = "Error al eliminar la imagen de perfil" });
					}
				}

				return Ok(new { Message = "Imagen de perfil eliminada correctamente" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al eliminar imagen de perfil");
				return StatusCode(500, new { Message = "Error interno del servidor", Details = ex.Message });
			}
		}

		[HttpGet("check-username/{username}")]
		[Authorize]
		public async Task<IActionResult> CheckUsernameAvailability(string username)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(username))
				{
					return BadRequest(new { Message = "El nombre de usuario no puede estar vacío" });
				}

				if (username.Length < 3)
				{
					return Ok(new { available = false, message = "El nombre de usuario debe tener al menos 3 caracteres" });
				}

				if (!System.Text.RegularExpressions.Regex.IsMatch(username, @"^[a-zA-Z0-9_]+$"))
				{
					return Ok(new { available = false, message = "El nombre de usuario solo puede contener letras, números y guiones bajos" });
				}

				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				var existingUser = await _userManager.FindByNameAsync(username);

				bool isAvailable = existingUser == null || existingUser.Id == currentUserId;

				return Ok(new { available = isAvailable });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al verificar disponibilidad de username");
				return StatusCode(500, new { Message = "Error interno del servidor", Details = ex.Message });
			}
		}

		// Método helper para obtener WebRootPath de forma robusta
		private string GetWebRootPath()
		{
			// Si WebRootPath está configurado, usarlo
			if (!string.IsNullOrEmpty(_environment.WebRootPath))
			{
				return _environment.WebRootPath;
			}

			// Si no, crear wwwroot en ContentRootPath
			var webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");

			// Crear directorio si no existe
			if (!Directory.Exists(webRootPath))
			{
				Directory.CreateDirectory(webRootPath);
				_logger.LogInformation($"Directorio wwwroot creado en: {webRootPath}");
			}

			return webRootPath;
		}
	}
}
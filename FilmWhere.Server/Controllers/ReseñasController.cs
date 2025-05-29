using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	public class ReseñasController : ControllerBase
	{
		private readonly MyDbContext _context;
		private readonly UserManager<Usuario> _userManager;
		private readonly ILogger<ReseñasController> _logger;
		private readonly DataSyncService _dataSyncService; // Nueva dependencia

		public ReseñasController(
			MyDbContext context,
			UserManager<Usuario> userManager,
			ILogger<ReseñasController> logger,
			DataSyncService dataSyncService) // Inyectar DataSyncService
		{
			_context = context;
			_userManager = userManager;
			_logger = logger;
			_dataSyncService = dataSyncService;
		}

		// GET: api/reseñas
		[HttpGet]
		public async Task<ActionResult<IEnumerable<object>>> GetReseñas([FromQuery] string? peliculaId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
		{
			try
			{
				var query = _context.Reseñas
					.Include(r => r.Usuario)
					.Include(r => r.Pelicula)
					.AsQueryable();

				if (!string.IsNullOrEmpty(peliculaId))
				{
					query = query.Where(r => r.PeliculaId == peliculaId);
				}

				var totalReseñas = await query.CountAsync();
				var reseñas = await query
					.OrderByDescending(r => r.Fecha)
					.Skip((page - 1) * pageSize)
					.Take(pageSize)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						usuario = new
						{
							id = r.Usuario.Id,
							nombre = r.Usuario.Nombre,
							apellido = r.Usuario.Apellido,
							userName = r.Usuario.UserName
						},
						pelicula = new
						{
							id = r.Pelicula.Id,
							titulo = r.Pelicula.Titulo,
							año = r.Pelicula.Año,
							posterUrl = r.Pelicula.PosterUrl
						}
					})
					.ToListAsync();

				return Ok(new
				{
					reseñas,
					totalReseñas,
					page,
					pageSize,
					totalPages = (int)Math.Ceiling((double)totalReseñas / pageSize)
				});
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener las reseñas");
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// GET: api/reseñas/{id}
		[HttpGet("{id}")]
		public async Task<ActionResult<object>> GetReseña(string id)
		{
			try
			{
				var reseña = await _context.Reseñas
					.Include(r => r.Usuario)
					.Include(r => r.Pelicula)
					.Where(r => r.Id == id)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						usuario = new
						{
							id = r.Usuario.Id,
							nombre = r.Usuario.Nombre,
							apellido = r.Usuario.Apellido,
							userName = r.Usuario.UserName
						},
						pelicula = new
						{
							id = r.Pelicula.Id,
							titulo = r.Pelicula.Titulo,
							año = r.Pelicula.Año,
							posterUrl = r.Pelicula.PosterUrl
						}
					})
					.FirstOrDefaultAsync();

				if (reseña == null)
				{
					return NotFound(new { message = "Reseña no encontrada" });
				}

				return Ok(reseña);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener la reseña con ID {ReseñaId}", id);
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// POST: api/reseñas
		[HttpPost]
		public async Task<ActionResult<object>> CrearReseña([FromBody] CrearReseñaDto dto)
		{
			try
			{
				// Validar datos de entrada
				if (string.IsNullOrEmpty(dto.PeliculaId))
				{
					return BadRequest(new { message = "El ID de la película es obligatorio" });
				}

				if (dto.Calificacion < 1 || dto.Calificacion > 10)
				{
					return BadRequest(new { message = "La calificación debe estar entre 1 y 10" });
				}

				// Obtener usuario actual
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { message = "Usuario no autenticado" });
				}

				// NUEVA LÓGICA: Sincronizar película si no existe localmente
				var pelicula = await EnsureMovieExistsAsync(dto.PeliculaId, dto.TituloPelicula);
				if (pelicula == null)
				{
					return NotFound(new { message = "No se pudo encontrar o sincronizar la película" });
				}

				// Verificar si el usuario ya reseñó esta película
				var reseñaExistente = await _context.Reseñas
					.FirstOrDefaultAsync(r => r.UsuarioId == userId && r.PeliculaId == dto.PeliculaId);

				if (reseñaExistente != null)
				{
					return Conflict(new { message = "Ya has reseñado esta película. Puedes editarla en su lugar." });
				}

				// Crear la reseña
				var reseña = new Reseña
				{
					Id = Guid.NewGuid().ToString(),
					UsuarioId = userId,
					PeliculaId = dto.PeliculaId,
					Calificacion = dto.Calificacion,
					Comentario = !string.IsNullOrWhiteSpace(dto.Comentario) ? dto.Comentario.Trim() : null,
					Fecha = DateTime.UtcNow
				};

				_context.Reseñas.Add(reseña);
				await _context.SaveChangesAsync();

				// Obtener la reseña creada con datos completos
				var reseñaCreada = await _context.Reseñas
					.Include(r => r.Usuario)
					.Include(r => r.Pelicula)
					.Where(r => r.Id == reseña.Id)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						usuario = new
						{
							id = r.Usuario.Id,
							nombre = r.Usuario.Nombre,
							apellido = r.Usuario.Apellido,
							userName = r.Usuario.UserName
						},
						pelicula = new
						{
							id = r.Pelicula.Id,
							titulo = r.Pelicula.Titulo,
							año = r.Pelicula.Año,
							posterUrl = r.Pelicula.PosterUrl
						}
					})
					.FirstOrDefaultAsync();

				_logger.LogInformation("Reseña creada exitosamente para película: {TituloPelicula} por usuario: {UsuarioId}",
					pelicula.Titulo, userId);

				return CreatedAtAction(nameof(GetReseña), new { id = reseña.Id }, reseñaCreada);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al crear la reseña");
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// NUEVO MÉTODO: Asegurar que la película existe en la base de datos local
		private async Task<Pelicula?> EnsureMovieExistsAsync(string peliculaId, string? tituloPelicula = null)
		{
			try
			{
				// Primero verificar si ya existe localmente
				var existingMovie = await _context.Peliculas.FindAsync(peliculaId);
				if (existingMovie != null)
				{
					_logger.LogInformation("Película ya existe localmente: {TituloPelicula} (ID: {PeliculaId})",
						existingMovie.Titulo, peliculaId);

					// Opcional: Actualizar plataformas en segundo plano si la película ya existe
					_ = Task.Run(async () =>
					{
						try
						{
							await _dataSyncService.UpdateMoviePlatformsAsync(existingMovie);
							_logger.LogInformation("Plataformas actualizadas en segundo plano para: {TituloPelicula}",
								existingMovie.Titulo);
						}
						catch (Exception ex)
						{
							_logger.LogWarning(ex, "Error actualizando plataformas en segundo plano para: {TituloPelicula}",
								existingMovie.Titulo);
						}
					});

					return existingMovie;
				}

				// Si no existe localmente, intentar sincronizar
				_logger.LogInformation("Película no existe localmente, iniciando sincronización: ID {PeliculaId}, Título: {TituloPelicula}",
					peliculaId, tituloPelicula ?? "No proporcionado");

				// Opción 1: Si tenemos el título, sincronizar por título
				if (!string.IsNullOrEmpty(tituloPelicula))
				{
					await _dataSyncService.SyncMovieByTitleAsync(tituloPelicula);
				}
				// Opción 2: Si solo tenemos el ID de TMDB, intentar sincronizar por ID
				else if (int.TryParse(peliculaId, out int tmdbId))
				{
					await SyncMovieByTmdbIdAsync(tmdbId);
				}
				else
				{
					_logger.LogWarning("No se puede sincronizar película: ID no es válido como TMDB ID y no se proporcionó título");
					return null;
				}

				// Verificar si la sincronización fue exitosa
				var syncedMovie = await _context.Peliculas.FindAsync(peliculaId);
				if (syncedMovie != null)
				{
					_logger.LogInformation("Película sincronizada exitosamente: {TituloPelicula} (ID: {PeliculaId})",
						syncedMovie.Titulo, peliculaId);
				}
				else
				{
					_logger.LogWarning("La sincronización no resultó en la película esperada con ID: {PeliculaId}", peliculaId);
				}

				return syncedMovie;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error asegurando que la película existe: ID {PeliculaId}, Título: {TituloPelicula}",
					peliculaId, tituloPelicula);
				return null;
			}
		}

		// NUEVO MÉTODO: Sincronizar película por TMDB ID
		private async Task SyncMovieByTmdbIdAsync(int tmdbId)
		{
			try
			{
				// Este método necesitaría ser añadido al DataSyncService
				// Por ahora, intentamos crear la película básica con la información de TMDB
				_logger.LogInformation("Sincronizando película por TMDB ID: {TmdbId}", tmdbId);

				// Aquí podrías llamar a un nuevo método en DataSyncService
				// await _dataSyncService.SyncMovieByTmdbIdAsync(tmdbId);

				// Por ahora, log de que se necesita implementar
				_logger.LogWarning("Sincronización por TMDB ID no implementada completamente. ID: {TmdbId}", tmdbId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error sincronizando película por TMDB ID: {TmdbId}", tmdbId);
				throw;
			}
		}

		// PUT: api/reseñas/{id}
		[HttpPut("{id}")]
		public async Task<IActionResult> ActualizarReseña(string id, [FromBody] ActualizarReseñaDto dto)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { message = "Usuario no autenticado" });
				}

				var reseña = await _context.Reseñas.FindAsync(id);
				if (reseña == null)
				{
					return NotFound(new { message = "Reseña no encontrada" });
				}

				// Verificar que el usuario es el propietario de la reseña
				if (reseña.UsuarioId != userId)
				{
					return Forbid();
				}

				// Validar calificación
				if (dto.Calificacion < 1 || dto.Calificacion > 10)
				{
					return BadRequest(new { message = "La calificación debe estar entre 1 y 10" });
				}

				// Actualizar la reseña
				reseña.Calificacion = dto.Calificacion;
				reseña.Comentario = !string.IsNullOrWhiteSpace(dto.Comentario) ? dto.Comentario.Trim() : null;

				await _context.SaveChangesAsync();

				return Ok(new { message = "Reseña actualizada correctamente" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al actualizar la reseña con ID {ReseñaId}", id);
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// DELETE: api/reseñas/{id}
		[HttpDelete("{id}")]
		public async Task<IActionResult> EliminarReseña(string id)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { message = "Usuario no autenticado" });
				}

				var reseña = await _context.Reseñas.FindAsync(id);
				if (reseña == null)
				{
					return NotFound(new { message = "Reseña no encontrada" });
				}

				// Verificar que el usuario es el propietario de la reseña
				if (reseña.UsuarioId != userId)
				{
					return Forbid();
				}

				_context.Reseñas.Remove(reseña);
				await _context.SaveChangesAsync();

				return Ok(new { message = "Reseña eliminada correctamente" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al eliminar la reseña con ID {ReseñaId}", id);
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// GET: api/reseñas/usuario/{usuarioId}
		[HttpGet("usuario/{usuarioId}")]
		public async Task<ActionResult<IEnumerable<object>>> GetReseñasUsuario(string usuarioId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
		{
			try
			{
				var totalReseñas = await _context.Reseñas
					.Where(r => r.UsuarioId == usuarioId)
					.CountAsync();

				var reseñas = await _context.Reseñas
					.Include(r => r.Usuario)
					.Include(r => r.Pelicula)
					.Where(r => r.UsuarioId == usuarioId)
					.OrderByDescending(r => r.Fecha)
					.Skip((page - 1) * pageSize)
					.Take(pageSize)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						pelicula = new
						{
							id = r.Pelicula.Id,
							titulo = r.Pelicula.Titulo,
							año = r.Pelicula.Año,
							posterUrl = r.Pelicula.PosterUrl
						}
					})
					.ToListAsync();

				return Ok(new
				{
					reseñas,
					totalReseñas,
					page,
					pageSize,
					totalPages = (int)Math.Ceiling((double)totalReseñas / pageSize)
				});
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener las reseñas del usuario {UsuarioId}", usuarioId);
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}

		// GET: api/reseñas/usuario/propia
		[HttpGet("usuario/propia")]
		public async Task<ActionResult<object>> GetReseñaPropia([FromQuery] string peliculaId)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized(new { message = "Usuario no autenticado" });
				}

				if (string.IsNullOrEmpty(peliculaId))
				{
					return BadRequest(new { message = "El ID de la película es obligatorio" });
				}

				var reseña = await _context.Reseñas
					.Include(r => r.Usuario)
					.Include(r => r.Pelicula)
					.Where(r => r.UsuarioId == userId && r.PeliculaId == peliculaId)
					.Select(r => new
					{
						id = r.Id,
						comentario = r.Comentario,
						calificacion = r.Calificacion,
						fecha = r.Fecha,
						pelicula = new
						{
							id = r.Pelicula.Id,
							titulo = r.Pelicula.Titulo,
							año = r.Pelicula.Año,
							posterUrl = r.Pelicula.PosterUrl
						}
					})
					.FirstOrDefaultAsync();

				if (reseña == null)
				{
					return NotFound(new { message = "No has reseñado esta película" });
				}

				return Ok(reseña);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener la reseña propia para la película {PeliculaId}", peliculaId);
				return StatusCode(500, new { message = "Error interno del servidor" });
			}
		}
	}

	// DTOs actualizados para las operaciones
	public class CrearReseñaDto
	{
		public string PeliculaId { get; set; } = string.Empty;
		public decimal Calificacion { get; set; }
		public string? Comentario { get; set; }
		public string? TituloPelicula { get; set; } // NUEVO: Campo opcional para el título
	}

	public class ActualizarReseñaDto
	{
		public decimal Calificacion { get; set; }
		public string? Comentario { get; set; }
	}
}
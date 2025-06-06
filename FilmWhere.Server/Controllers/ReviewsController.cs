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
	public class ReviewsController : ControllerBase
	{
		private readonly MyDbContext _context;
		private readonly UserManager<Usuario> _userManager;
		private readonly ILogger<ReviewsController> _logger;
		private readonly DataSyncService _dataSyncService; // Nueva dependencia

		public ReviewsController(
			MyDbContext context,
			UserManager<Usuario> userManager,
			ILogger<ReviewsController> logger,
			DataSyncService dataSyncService) // Inyectar DataSyncService
		{
			_context = context;
			_userManager = userManager;
			_logger = logger;
			_dataSyncService = dataSyncService;
		}

		// GET: api/reviews
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

		// GET: api/reviews/{id}
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

		// POST: api/reviews
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
					Comentario = !string.IsNullOrWhiteSpace(dto.Comentario) ? dto.Comentario.Trim() : "",
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
				_logger.LogInformation("Iniciando verificación de película. ID: {PeliculaId}, Título: {TituloPelicula}",
					peliculaId, tituloPelicula ?? "No proporcionado");

				// Estrategia 1: Buscar por ID exacto (en caso de que sea un ID interno)
				var existingMovie = await _context.Peliculas.FindAsync(peliculaId);
				if (existingMovie != null)
				{
					_logger.LogInformation("Película encontrada por ID exacto: {TituloPelicula} (ID: {PeliculaId})",
						existingMovie.Titulo, peliculaId);
					return existingMovie;
				}

				// Estrategia 2: Buscar por TMDB ID si el peliculaId es numérico
				if (int.TryParse(peliculaId, out int tmdbId))
				{
					existingMovie = await _context.Peliculas
						.FirstOrDefaultAsync(p => p.IdApiTmdb == tmdbId);

					if (existingMovie != null)
					{
						_logger.LogInformation("Película encontrada por TMDB ID: {TituloPelicula} (ID interno: {PeliculaId}, TMDB: {TmdbId})",
							existingMovie.Titulo, existingMovie.Id, tmdbId);
						return existingMovie;
					}
				}

				// Estrategia 3: Buscar por título si se proporciona
				if (!string.IsNullOrEmpty(tituloPelicula))
				{
					existingMovie = await _context.Peliculas
						.FirstOrDefaultAsync(p => p.Titulo.ToLower().Contains(tituloPelicula.ToLower()));

					if (existingMovie != null)
					{
						_logger.LogInformation("Película encontrada por título: {TituloPelicula} (ID: {PeliculaId})",
							existingMovie.Titulo, existingMovie.Id);
						return existingMovie;
					}
				}

				// Si no existe localmente, intentar sincronizar
				_logger.LogInformation("Película no encontrada localmente, iniciando sincronización...");

				Pelicula? syncedMovie = null;

				// Opción 1: Sincronizar por título si está disponible
				// Opción 2: Sincronizar por TMDB ID si el título no funcionó y tenemos un ID numérico
				if (syncedMovie == null && int.TryParse(peliculaId, out tmdbId))
				{
					_logger.LogInformation("Sincronizando por TMDB ID: {TmdbId}", tmdbId);
					try
					{
						await _dataSyncService.SyncMovieByTmdbIdAsync(tmdbId);

						// Buscar por TMDB ID después de la sincronización
						syncedMovie = await _context.Peliculas
							.FirstOrDefaultAsync(p => p.IdApiTmdb == tmdbId);
					}
					catch (Exception ex)
					{
						_logger.LogError(ex, "Error sincronizando por TMDB ID: {TmdbId}", tmdbId);
					}
				}


				if (syncedMovie != null)
				{
					_logger.LogInformation("Película sincronizada exitosamente: {TituloPelicula} (ID: {PeliculaId}, TMDB: {TmdbId})",
						syncedMovie.Titulo, syncedMovie.Id, syncedMovie.IdApiTmdb);
				}
				else
				{
					_logger.LogWarning("No se pudo sincronizar la película. ID: {PeliculaId}, Título: {TituloPelicula}",
						peliculaId, tituloPelicula);
				}

				return syncedMovie;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error crítico asegurando que la película existe: ID {PeliculaId}, Título: {TituloPelicula}",
					peliculaId, tituloPelicula);
				return null;
			}
		}

        // PUT: api/reviews/{id}
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

                var reseña = await _context.Reseñas
                    .Include(r => r.Usuario)
                    .Include(r => r.Pelicula)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reseña == null)
                {
                    return NotFound(new { message = "Reseña no encontrada" });
                }

                // Verificar que el usuario es el propietario de la reseña
                if (reseña.UsuarioId != userId)
                {
                    return Forbid("No tienes permisos para editar esta reseña");
                }

                // Validar calificación
                if (dto.Calificacion < 1 || dto.Calificacion > 10)
                {
                    return BadRequest(new { message = "La calificación debe estar entre 1 y 10" });
                }

                // Actualizar la reseña
                reseña.Calificacion = dto.Calificacion;
                reseña.Comentario = !string.IsNullOrWhiteSpace(dto.Comentario) ? dto.Comentario.Trim() : "";
                reseña.Fecha = DateTime.UtcNow; // Actualizar fecha de modificación

                await _context.SaveChangesAsync();

                // Devolver la reseña actualizada con datos completos
                var reseñaActualizada = await _context.Reseñas
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

                _logger.LogInformation("Reseña actualizada exitosamente. ID: {ReseñaId}, Usuario: {UsuarioId}, Película: {TituloPelicula}",
                    id, userId, reseña.Pelicula.Titulo);

                return Ok(new
                {
                    message = "Reseña actualizada correctamente",
                    reseña = reseñaActualizada
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar la reseña con ID {ReseñaId}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        // DELETE: api/reviews/{id}
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
		// GET: api/reviews/usuario - Obtener todas las reseñas del usuario actual
		[HttpGet("usuario")]
		public async Task<ActionResult<IEnumerable<object>>> GetUserReviews()
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

			if (string.IsNullOrEmpty(userId))
			{
				return Unauthorized();
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
						id = r.Pelicula.Id,
						titulo = r.Pelicula.Titulo,
						posterUrl = r.Pelicula.PosterUrl,
						año = r.Pelicula.Año
					}
				})
				.ToListAsync();

			return Ok(reviews);
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

		// GET: api/reviews/usuario/propia
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
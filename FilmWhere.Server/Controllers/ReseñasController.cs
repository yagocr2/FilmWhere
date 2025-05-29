using FilmWhere.Context;
using FilmWhere.Models;
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

		public ReseñasController(MyDbContext context, UserManager<Usuario> userManager, ILogger<ReseñasController> logger)
		{
			_context = context;
			_userManager = userManager;
			_logger = logger;
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

				// Verificar que la película existe
				var pelicula = await _context.Peliculas.FindAsync(dto.PeliculaId);
				if (pelicula == null)
				{
					return NotFound(new { message = "Película no encontrada" });
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

				return CreatedAtAction(nameof(GetReseña), new { id = reseña.Id }, reseñaCreada);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al crear la reseña");
				return StatusCode(500, new { message = "Error interno del servidor" });
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

	// DTOs para las operaciones
	public class CrearReseñaDto
	{
		public string PeliculaId { get; set; } = string.Empty;
		public decimal Calificacion { get; set; }
		public string? Comentario { get; set; }
	}

	public class ActualizarReseñaDto
	{
		public decimal Calificacion { get; set; }
		public string? Comentario { get; set; }
	}
}


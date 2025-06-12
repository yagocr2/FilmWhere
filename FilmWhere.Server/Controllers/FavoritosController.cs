using Microsoft.AspNetCore.Mvc;
using global::FilmWhere.Context;
using global::FilmWhere.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FilmWhere.Services;

namespace FilmWhere.Server.Controllers
{
	namespace FilmWhere.Server.Controllers
	{
		/// <summary>
		/// Controlador para la gestión de películas favoritas de usuarios
		/// </summary>
		[ApiController]
		[Route("api/[controller]")]
		[Authorize]
		[Produces("application/json")]
		public class FavoritosController : ControllerBase
		{
			private readonly MyDbContext _context;
			private readonly ILogger<FavoritosController> _logger;
			private readonly DataSyncService _dataSyncService;

			public FavoritosController(MyDbContext context, ILogger<FavoritosController> logger, DataSyncService dataSyncService)
			{
				_context = context;
				_logger = logger;
				_dataSyncService = dataSyncService;
			}

			/// <summary>
			/// Añade una película a la lista de favoritos del usuario autenticado
			/// </summary>
			/// <param name="peliculaId">ID de la película a añadir a favoritos</param>
			/// <returns>Confirmación de que la película fue añadida a favoritos</returns>
			/// <response code="200">Película añadida exitosamente a favoritos</response>
			/// <response code="400">La película ya está en favoritos o ID inválido</response>
			/// <response code="401">Usuario no autenticado</response>
			/// <response code="404">Película no encontrada</response>
			/// <response code="500">Error interno del servidor</response>
			[HttpPost("{peliculaId}")]
			[ProducesResponseType(typeof(object), 200)]
			[ProducesResponseType(typeof(object), 400)]
			[ProducesResponseType(typeof(object), 401)]
			[ProducesResponseType(typeof(object), 404)]
			[ProducesResponseType(typeof(object), 500)]
			public async Task<IActionResult> AddToFavorites(string peliculaId)
			{
				try
				{
					var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
					if (string.IsNullOrEmpty(userId))
					{
						return Unauthorized(new { Message = "Token inválido" });
					}

					// Verificar si la película existe
					var pelicula = await _context.Peliculas.FindAsync(peliculaId);
					if (pelicula == null)
					{
						_logger.LogInformation("Película {PeliculaId} no encontrada, intentando sincronizar desde TMDB", peliculaId);

						// Intentar parsear el ID como entero para TMDB
						if (int.TryParse(peliculaId, out int tmdbId))
						{
							try
							{
								await _dataSyncService.SyncMovieByTmdbIdAsync(tmdbId);
								// Volver a buscar la película después de la sincronización
								pelicula = await _context.Peliculas.FindAsync(peliculaId);
							}
							catch (Exception syncEx)
							{
								_logger.LogError(syncEx, "Error sincronizando película {PeliculaId}", peliculaId);
								return NotFound(new { Message = "Película no encontrada y no se pudo sincronizar desde fuentes externas" });
							}
						}
						else
						{
							return BadRequest(new { Message = "ID de película inválido" });
						}
					}
					if (pelicula == null)
					{
						return NotFound(new { Message = "Película no encontrada" });
					}

					// Verificar si ya está en favoritos
					var existingFavorite = await _context.Favoritos
						.FirstOrDefaultAsync(f => f.UsuarioId == userId && f.PeliculaId == peliculaId);

					if (existingFavorite != null)
					{
						return BadRequest(new { Message = "La película ya está en favoritos" });
					}

					// Añadir a favoritos
					var favorito = new Favorito
					{
						UsuarioId = userId,
						PeliculaId = peliculaId
					};

					_context.Favoritos.Add(favorito);
					await _context.SaveChangesAsync();

					return Ok(new { Message = "Película añadida a favoritos", IsFavorite = true });
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error añadiendo película a favoritos: {PeliculaId}", peliculaId);
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}

			/// <summary>
			/// Elimina una película de la lista de favoritos del usuario autenticado
			/// </summary>
			/// <param name="peliculaId">ID de la película a eliminar de favoritos</param>
			/// <returns>Confirmación de que la película fue eliminada de favoritos</returns>
			/// <response code="200">Película eliminada exitosamente de favoritos</response>
			/// <response code="401">Usuario no autenticado</response>
			/// <response code="404">La película no está en favoritos</response>
			/// <response code="500">Error interno del servidor</response>
			[HttpDelete("{peliculaId}")]
			[ProducesResponseType(typeof(object), 200)]
			[ProducesResponseType(typeof(object), 401)]
			[ProducesResponseType(typeof(object), 404)]
			[ProducesResponseType(typeof(object), 500)]
			public async Task<IActionResult> RemoveFromFavorites(string peliculaId)
			{
				try
				{
					var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
					if (string.IsNullOrEmpty(userId))
					{
						return Unauthorized(new { Message = "Token inválido" });
					}

					var favorito = await _context.Favoritos
						.FirstOrDefaultAsync(f => f.UsuarioId == userId && f.PeliculaId == peliculaId);

					if (favorito == null)
					{
						return NotFound(new { Message = "La película no está en favoritos" });
					}

					_context.Favoritos.Remove(favorito);
					await _context.SaveChangesAsync();

					return Ok(new { Message = "Película eliminada de favoritos", IsFavorite = false });
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error eliminando película de favoritos: {PeliculaId}", peliculaId);
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}

			/// <summary>
			/// Verifica si una película está en la lista de favoritos del usuario autenticado
			/// </summary>
			/// <param name="peliculaId">ID de la película a verificar</param>
			/// <returns>Estado de favorito de la película</returns>
			/// <response code="200">Estado de favorito verificado</response>
			/// <response code="401">Usuario no autenticado</response>
			/// <response code="500">Error interno del servidor</response>
			[HttpGet("check/{peliculaId}")]
			[ProducesResponseType(typeof(object), 200)]
			[ProducesResponseType(typeof(object), 401)]
			[ProducesResponseType(typeof(object), 500)]
			public async Task<IActionResult> CheckIfFavorite(string peliculaId)
			{
				try
				{
					var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
					if (string.IsNullOrEmpty(userId))
					{
						return Unauthorized(new { Message = "Token inválido" });
					}

					var isFavorite = await _context.Favoritos
						.AnyAsync(f => f.UsuarioId == userId && f.PeliculaId == peliculaId);

					return Ok(new { IsFavorite = isFavorite });
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error verificando si película es favorita: {PeliculaId}", peliculaId);
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}

			/// <summary>
			/// Obtiene la lista paginada de películas favoritas del usuario autenticado
			/// </summary>
			/// <param name="page">Número de página (por defecto: 1)</param>
			/// <param name="pageSize">Tamaño de página (por defecto: 20)</param>
			/// <returns>Lista paginada de películas favoritas con información detallada</returns>
			/// <response code="200">Lista de favoritos obtenida exitosamente</response>
			/// <response code="401">Usuario no autenticado</response>
			/// <response code="500">Error interno del servidor</response>
			[HttpGet]
			[ProducesResponseType(typeof(object), 200)]
			[ProducesResponseType(typeof(object), 401)]
			[ProducesResponseType(typeof(object), 500)]
			public async Task<IActionResult> GetUserFavorites([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
			{
				try
				{
					var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
					if (string.IsNullOrEmpty(userId))
					{
						return Unauthorized(new { Message = "Token inválido" });
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
								Type = pp.Tipo.ToString(),
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
					_logger.LogError(ex, "Error obteniendo favoritos del usuario");
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}

			/// <summary>
			/// Obtiene el número total de películas favoritas del usuario autenticado
			/// </summary>
			/// <returns>Contador de películas favoritas</returns>
			/// <response code="200">Contador obtenido exitosamente</response>
			/// <response code="401">Usuario no autenticado</response>
			/// <response code="500">Error interno del servidor</response>
			[HttpGet("count")]
			[ProducesResponseType(typeof(object), 200)]
			[ProducesResponseType(typeof(object), 401)]
			[ProducesResponseType(typeof(object), 500)]
			public async Task<IActionResult> GetFavoritesCount()
			{
				try
				{
					var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
					if (string.IsNullOrEmpty(userId))
					{
						return Unauthorized(new { Message = "Token inválido" });
					}

					var count = await _context.Favoritos
						.CountAsync(f => f.UsuarioId == userId);

					return Ok(new { Count = count });
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error obteniendo contador de favoritos");
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}
		}
	}
}
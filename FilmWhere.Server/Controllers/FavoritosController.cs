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
		[ApiController]
		[Route("api/[controller]")]
		[Authorize]
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

			[HttpPost("{peliculaId}")]
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

			[HttpDelete("{peliculaId}")]
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

			[HttpGet("check/{peliculaId}")]
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

			[HttpGet]
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
					_logger.LogError(ex, "Error obteniendo favoritos del usuario");
					return StatusCode(500, new { Message = "Error interno del servidor" });
				}
			}

			[HttpGet("count")]
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

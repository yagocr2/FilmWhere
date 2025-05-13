using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using static FilmWhere.Services.TmdbService;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class PopularMoviesController : ControllerBase
	{
		private readonly TmdbService _tmdbService;
		private readonly DataSyncService _dataSyncService;
		private readonly MyDbContext _context;
		private readonly ILogger<PopularMoviesController> _logger;

		public PopularMoviesController(
			TmdbService tmdbService,
			DataSyncService dataSyncService,
			MyDbContext context,
			ILogger<PopularMoviesController> logger)
		{
			_tmdbService = tmdbService;
			_dataSyncService = dataSyncService;
			_context = context;
			_logger = logger;
		}

		// Obtener películas populares (con portadas) para el GridMotion
		[HttpGet]
		public async Task<ActionResult<List<PopularMovieResponse>>> GetPopularMovies(int page = 1, int year = 0, int cantidad = 0)
		{
			try
			{
				// Si se solicita un año específico, buscar en la base de datos
				if (year > 0)
				{
					var storedMovies = await _context.Peliculas
						.Where(p => p.Año == year)
						.OrderByDescending(p => p.Reseñas.Count)
						.Take(cantidad > 0 ? cantidad : 28)
						.Select(p => new PopularMovieResponse
						{
							Id = p.Id,
							Title = p.Titulo,
							PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
							Year = p.Año ?? 0
						})
						.ToListAsync();

					if (storedMovies.Any())
						return storedMovies;
				}

				// Obtener películas populares desde TMDB (múltiples páginas si es necesario)
				List<TmdbSearchResult> allMovies = new();
				int desiredCount = cantidad > 0 ? cantidad : 28;
				int currentPage = page;
				bool hasMorePages = true;

				while (allMovies.Count < desiredCount && hasMorePages)
				{
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(currentPage);

					if (tmdbResponse == null || !tmdbResponse.Results.Any())
					{
						hasMorePages = false;
						break;
					}

					allMovies.AddRange(tmdbResponse.Results);
					currentPage++;

					// Verificar si hay más páginas disponibles
					if (currentPage > tmdbResponse.Total_Pages) hasMorePages = false;
				}

				if (!allMovies.Any())
					return NotFound("No se encontraron películas");

				// Mapear resultados al formato de respuesta
				var popularMovies = allMovies
					.Take(desiredCount)
					.Select(m => new PopularMovieResponse
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year
					})
					.ToList();

				return popularMovies;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas populares");
				return StatusCode(500, "Error al obtener películas populares");
			}
		}

		// Sincronizar películas populares con la base de datos para un año específico
		[HttpPost("sync/{year}")]
		public async Task<ActionResult> SyncPopularMoviesByYear(int year)
		{
			try
			{
				// Validar el año
				if (year < 1900 || year > DateTime.Now.Year)
					return BadRequest("Año inválido");

				// Obtener películas populares desde TMDB (varias páginas para tener suficientes del año)
				List<TmdbSearchResult> allMoviesFromYear = new();
				int maxPages = 5; // Limitamos para no hacer demasiadas peticiones

				for (int page = 1; page <= maxPages; page++)
				{
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(page);
					if (tmdbResponse == null || !tmdbResponse.Results.Any())
						break;

					// Filtrar por año y agregar a la lista
					var moviesFromYear = tmdbResponse.Results
						.Where(m => m.Release_Date.Year == year)
						.ToList();

					allMoviesFromYear.AddRange(moviesFromYear);

					// Si ya tenemos suficientes películas o hemos llegado al final
					if (allMoviesFromYear.Count >= 50 || tmdbResponse.Page >= tmdbResponse.Total_Pages)
						break;
				}

				// Sincronizar cada película encontrada
				int syncCount = 0;
				foreach (var movie in allMoviesFromYear)
				{
					await _dataSyncService.SyncMovieByTitleAsync(movie.Title);
					syncCount++;
				}

				return Ok(new { Message = $"Se sincronizaron {syncCount} películas del año {year}" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al sincronizar películas populares del año {Year}", year);
				return StatusCode(500, $"Error al sincronizar películas: {ex.Message}");
			}
		}

		// Limpiar películas antiguas de un año específico
		[HttpDelete("purge/{year}")]
		public async Task<ActionResult> PurgeMoviesByYear(int year)
		{
			try
			{
				using var transaction = await _context.Database.BeginTransactionAsync();

				// Encontrar las películas del año especificado
				var peliculasDelAño = await _context.Peliculas
					.Where(p => p.Año == year)
					.ToListAsync();

				if (!peliculasDelAño.Any())
					return NotFound($"No se encontraron películas del año {year}");

				// Eliminar películas (las restricciones en cascada se encargarán de las relaciones)
				_context.Peliculas.RemoveRange(peliculasDelAño);
				await _context.SaveChangesAsync();
				await transaction.CommitAsync();

				return Ok(new { Message = $"Se eliminaron {peliculasDelAño.Count} películas del año {year}" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al purgar películas del año {Year}", year);
				return StatusCode(500, $"Error al purgar películas: {ex.Message}");
			}
		}
	}

	// DTO para la respuesta de películas populares
	public class PopularMovieResponse
	{
		public string Id { get; set; }
		public string Title { get; set; }
		public string PosterUrl { get; set; }
		public int Year { get; set; }

		[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
		public decimal? Rating { get; set; }
	}
}
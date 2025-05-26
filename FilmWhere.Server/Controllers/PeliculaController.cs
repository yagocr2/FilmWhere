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
	public class PeliculaController : ControllerBase
	{
		private readonly TmdbService _tmdbService;
		private readonly DataSyncService _dataSyncService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculaController> _logger;

		public PeliculaController(
			TmdbService tmdbService,
			DataSyncService dataSyncService,
			MyDbContext context,
			ILogger<PeliculaController> logger)
		{
			_tmdbService = tmdbService;
			_dataSyncService = dataSyncService;
			_context = context;
			_logger = logger;
		}

		#region Obtener Película por ID

		// Obtener película específica por ID
		[HttpGet("{id}")]
		public async Task<ActionResult<MovieResponse>> GetMovieById(int id)
		{
			try
			{
				var movie = await _context.Peliculas
					.Where(p => p.IdApiTmdb == id)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.FirstOrDefaultAsync();

				if (movie == null)
				{
					// Si no hay película en la base de datos, intentar obtener de TMDB
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(1);
					if (tmdbResponse != null && tmdbResponse.Results.Any())
					{
						var tmdbMovie = tmdbResponse.Results
							.Where(m => m.Id == id)
							.Select(m => new MovieResponse
							{
								Id = m.Id.ToString(),
								Title = m.Title,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
								Year = m.Release_Date.Year
							})
							.FirstOrDefault();

						if (tmdbMovie != null)
							return tmdbMovie;
					}

					return NotFound($"No se encontró película con ID {id}");
				}

				return movie;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener película por ID {Id}", id);
				return StatusCode(500, $"Error al obtener película por ID: {ex.Message}");
			}
		}

		#endregion

		#region Búsquedas

		// Búsqueda general de películas
		[HttpGet("buscar")]
		public async Task<ActionResult<List<MovieResponse>>> SearchMovies(
		   [FromQuery] string query,
		   [FromQuery] int page = 1)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(query))
				{
					return BadRequest("El término de búsqueda no puede estar vacío");
				}

				// Limitar a máximo 2 páginas para búsquedas específicas
				if (page > 2) page = 2;

				// Primero buscar en la base de datos local
				var localResults = await _context.Peliculas
					.Where(p => p.Titulo.Contains(query))
					.Skip((page - 1) * 20)
					.Take(20)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.ToListAsync();

				// Si tenemos resultados locales suficientes, devolverlos
				if (localResults.Count >= 10)
				{
					return localResults;
				}

				// Si no hay suficientes resultados locales, buscar en TMDB
				var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, page);

				if (tmdbResponse?.Results == null || !tmdbResponse.Results.Any())
				{
					// Si no hay resultados de TMDB, devolver solo los locales
					return localResults.Any() ? localResults : NotFound("No se encontraron películas");
				}

				// Combinar resultados locales con TMDB
				var tmdbResults = tmdbResponse.Results
					.Take(20 - localResults.Count)
					.Select(m => new MovieResponse
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year
					})
					.ToList();

				// Combinar y eliminar duplicados por título
				var combinedResults = localResults
					.Concat(tmdbResults)
					.GroupBy(m => m.Title.ToLower())
					.Select(g => g.First())
					.Take(20)
					.ToList();

				return combinedResults.Any() ? combinedResults : NotFound("No se encontraron películas");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al buscar películas con término: {Query}", query);
				return StatusCode(500, $"Error al buscar películas: {ex.Message}");
			}
		}

		// Sugerencias de búsqueda
		[HttpGet("sugerencias")]
		public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string query)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
				{
					return new List<string>();
				}

				var suggestions = await _context.Peliculas
					.Where(p => p.Titulo.Contains(query))
					.Select(p => p.Titulo)
					.Distinct()
					.Take(5)
					.ToListAsync();

				return suggestions;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener sugerencias para: {Query}", query);
				return new List<string>();
			}
		}

		// Búsqueda avanzada con filtros
		[HttpGet("busqueda-avanzada")]
		public async Task<ActionResult<List<MovieResponse>>> AdvancedSearch(
			[FromQuery] string? title,
			[FromQuery] int? year,
			[FromQuery] string? genre,
			[FromQuery] int page = 1)
		{
			try
			{
				if (page > 2) page = 2;

				var query = _context.Peliculas.AsQueryable();

				// Aplicar filtros
				if (!string.IsNullOrWhiteSpace(title))
				{
					query = query.Where(p => p.Titulo.Contains(title));
				}

				if (year.HasValue)
				{
					query = query.Where(p => p.Año == year.Value);
				}

				if (!string.IsNullOrWhiteSpace(genre))
				{
					query = query.Where(p => p.Generos.Any(pg => pg.Genero.Nombre.Contains(genre)));
				}

				var results = await query
					.Skip((page - 1) * 20)
					.Take(20)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.ToListAsync();

				return results.Any() ? results : NotFound("No se encontraron películas con los filtros especificados");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error en búsqueda avanzada");
				return StatusCode(500, $"Error en búsqueda avanzada: {ex.Message}");
			}
		}

		#endregion

		#region Películas por Género

		// Obtener películas por género
		[HttpGet("genero/{genreName}")]
		public async Task<ActionResult<List<MovieResponse>>> GetMoviesByGenre(string genreName, int cantidad = 15)
		{
			try
			{
				// Buscar el género en la base de datos
				var genre = await _context.Generos
					.FirstOrDefaultAsync(g => g.Nombre.ToLower() == genreName.ToLower());

				if (genre == null)
				{
					return NotFound($"Género '{genreName}' no encontrado");
				}

				// Obtener películas por género
				var movies = await _context.PeliculaGeneros
					.Where(pg => pg.GeneroId == genre.Id)
					.Include(pg => pg.Pelicula)
					.Select(pg => pg.Pelicula)
					.OrderByDescending(p => p.Reseñas.Count)
					.Take(cantidad)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.ToListAsync();

				if (!movies.Any())
				{
					return NotFound($"No se encontraron películas para el género '{genreName}'");
				}

				return movies;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas por género {GenreName}", genreName);
				return StatusCode(500, $"Error al obtener películas: {ex.Message}");
			}
		}

		// Obtener géneros disponibles
		[HttpGet("generos")]
		public async Task<ActionResult<List<GenreResponse>>> GetAvailableGenres()
		{
			try
			{
				var genres = await _context.Generos
					.Select(g => new GenreResponse
					{
						Id = g.Id,
						Name = g.Nombre
					})
					.ToListAsync();

				if (!genres.Any())
				{
					return NotFound("No se encontraron géneros");
				}

				return genres;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener géneros disponibles");
				return StatusCode(500, $"Error al obtener géneros: {ex.Message}");
			}
		}

		#endregion

		#region Estrenos y Populares

		// Obtener películas recién estrenadas
		[HttpGet("estrenos")]
		public async Task<ActionResult<List<MovieResponse>>> GetRecentReleases(int año = 0, int cantidad = 15)
		{
			try
			{
				int targetYear = año > 0 ? año : DateTime.Now.Year;

				var recentMovies = await _context.Peliculas
					.Where(p => p.Año == targetYear)
					.OrderByDescending(p => p.Id)
					.Take(cantidad)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.ToListAsync();

				if (!recentMovies.Any())
				{
					// Si no hay películas en la base de datos, intentar obtener de TMDB
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(1);
					if (tmdbResponse != null && tmdbResponse.Results.Any())
					{
						var popularMovies = tmdbResponse.Results
							.Where(m => m.Release_Date.Year == targetYear)
							.Take(cantidad)
							.Select(m => new MovieResponse
							{
								Id = m.Id.ToString(),
								Title = m.Title,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
								Year = m.Release_Date.Year
							})
							.ToList();

						return popularMovies;
					}

					return NotFound($"No se encontraron estrenos para el año {targetYear}");
				}

				return recentMovies;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas recientes");
				return StatusCode(500, $"Error al obtener estrenos: {ex.Message}");
			}
		}

		// Obtener películas populares
		[HttpGet("populares")]
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

				// Obtener películas populares desde TMDB
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

					if (currentPage > tmdbResponse.Total_Pages) hasMorePages = false;
				}

				if (!allMovies.Any())
					return NotFound("No se encontraron películas");

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
		// Obtener películas mejor valoradas
		[HttpGet("mejor-valoradas")]
		public async Task<ActionResult<List<MovieResponse>>> GetTopRatedMovies(
			[FromQuery] int page = 1,
			[FromQuery] int cantidad = 20,
			[FromQuery] int? year = null)
		{
			try
			{
				int skip = (page - 1) * cantidad;

				// Consulta base para películas con reseñas
				var query = _context.Peliculas
					.Where(p => p.Reseñas.Any()) // Solo películas que tienen reseñas
					.AsQueryable();

				// Filtrar por año si se especifica
				if (year.HasValue)
				{
					query = query.Where(p => p.Año == year.Value);
				}

				// Obtener películas ordenadas por calificación promedio
				var topRatedMovies = await query
					.Select(p => new
					{
						Pelicula = p,
						PromedioCalificacion = p.Reseñas.Average(r => r.Calificacion),
						NumeroReseñas = p.Reseñas.Count()
					})
					.Where(x => x.NumeroReseñas >= 2) // Mínimo 2 reseñas para ser considerada
					.OrderByDescending(x => x.PromedioCalificacion)
					.ThenByDescending(x => x.NumeroReseñas) // Desempate por número de reseñas
					.Skip(skip)
					.Take(cantidad)
					.Select(x => new MovieResponse
					{
						Id = x.Pelicula.Id,
						Title = x.Pelicula.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{x.Pelicula.PosterUrl}",
						Year = x.Pelicula.Año ?? 0,
						Rating = x.PromedioCalificacion
					})
					.ToListAsync();

				if (!topRatedMovies.Any())
				{
					// Si no hay suficientes películas valoradas localmente, complementar con TMDB
					_logger.LogInformation("Pocas películas valoradas localmente, complementando con TMDB");

					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(page);
					if (tmdbResponse != null && tmdbResponse.Results.Any())
					{
						var tmdbMovies = tmdbResponse.Results
							.Where(m => year == null || m.Release_Date.Year == year)
							.Take(cantidad)
							.Select(m => new MovieResponse
							{
								Id = m.Id.ToString(),
								Title = m.Title,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
								Year = m.Release_Date.Year,
								Rating = (decimal?)m.Vote_Average // Usar la valoración de TMDB
							})
							.ToList();

						return tmdbMovies;
					}

					return NotFound("No se encontraron películas valoradas");
				}

				return topRatedMovies;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas mejor valoradas");
				return StatusCode(500, $"Error al obtener películas mejor valoradas: {ex.Message}");
			}
		}
		#endregion

		#region Sincronización y Administración

		// Sincronizar películas populares con la base de datos para un año específico
		[HttpPost("sincronizar/{year}")]
		public async Task<ActionResult> SyncPopularMoviesByYear(int year)
		{
			try
			{
				// Validar el año
				if (year < 1900 || year > DateTime.Now.Year)
					return BadRequest("Año inválido");

				// Obtener películas populares desde TMDB
				List<TmdbSearchResult> allMoviesFromYear = new();
				int maxPages = 5;

				for (int page = 1; page <= maxPages; page++)
				{
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(page);
					if (tmdbResponse == null || !tmdbResponse.Results.Any())
						break;

					var moviesFromYear = tmdbResponse.Results
						.Where(m => m.Release_Date.Year == year)
						.ToList();

					allMoviesFromYear.AddRange(moviesFromYear);

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
		[HttpDelete("limpiar/{year}")]
		public async Task<ActionResult> PurgeMoviesByYear(int year)
		{
			try
			{
				using var transaction = await _context.Database.BeginTransactionAsync();

				var peliculasDelAño = await _context.Peliculas
					.Where(p => p.Año == year)
					.ToListAsync();

				if (!peliculasDelAño.Any())
					return NotFound($"No se encontraron películas del año {year}");

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

		#endregion
	}

	#region DTOs

	public class MovieResponse
	{
		public string Id { get; set; }
		public string Title { get; set; }
		public string PosterUrl { get; set; }
		public int Year { get; set; }

		[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
		public decimal? Rating { get; set; }
	}

	public class PopularMovieResponse
	{
		public string Id { get; set; }
		public string Title { get; set; }
		public string PosterUrl { get; set; }
		public int Year { get; set; }

		[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
		public decimal? Rating { get; set; }
	}

	public class GenreResponse
	{
		public string Id { get; set; }
		public string Name { get; set; }
	}

	#endregion
}
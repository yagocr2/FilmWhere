using FilmWhere.Context;
using FilmWhere.Services;
using FilmWhere.Server.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Services.TmdbService;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Server.Services.Local
{
	public class PeliculasUtilityService
	{
		private readonly TmdbService _tmdbService;
		private readonly WatchModeService _watchModeService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculasUtilityService> _logger;

		public PeliculasUtilityService(
			TmdbService tmdbService,
			WatchModeService watchModeService,
			MyDbContext context,
			ILogger<PeliculasUtilityService> logger)
		{
			_tmdbService = tmdbService;
			_watchModeService = watchModeService;
			_context = context;
			_logger = logger;
		}

		#region Database Availability

		public async Task<bool> IsDatabaseAvailableAsync()
		{
			try
			{
				await _context.Database.CanConnectAsync();
				return true;
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Base de datos no disponible, usando respaldo TMDB");
				return false;
			}
		}

		#endregion

		#region TMDB Only Methods

		public async Task<ActionResult<List<PeliculaDTO>>> SearchOnlyTmdbAsync(string query, int page = 1)
		{
			try
			{
				var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, page);

				if (tmdbResponse?.Results == null || !tmdbResponse.Results.Any())
				{
					return new NotFoundObjectResult("No se encontraron películas en TMDB");
				}

				var movies = tmdbResponse.Results
					.Take(20)
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average
					})
					.ToList();

				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error buscando en TMDB: {Query}", query);
				return new ObjectResult("Error al buscar películas en TMDB") { StatusCode = 500 };
			}
		}

		public async Task<ActionResult<List<PeliculaDTO>>> GetPopularOnlyTmdbAsync(int page = 1, int cantidad = 50)
		{
			try
			{
				List<TmdbSearchResult> allMovies = new();

				// Para obtener 50 películas necesitamos aproximadamente 3 páginas de TMDB (20 por página)
				int paginasNecesarias = Math.Max(3, (int)Math.Ceiling((double)cantidad / 20));

				// Calcular desde qué página de TMDB empezar
				int paginaInicioTmdb = (page - 1) * paginasNecesarias + 1;

				// Obtener las páginas necesarias
				for (int i = 0; i < paginasNecesarias && allMovies.Count < cantidad * 2; i++)
				{
					int paginaTmdb = paginaInicioTmdb + i;
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(paginaTmdb);

					if (tmdbResponse == null || !tmdbResponse.Results.Any())
						break;

					allMovies.AddRange(tmdbResponse.Results);
				}

				if (!allMovies.Any())
					return new NotFoundObjectResult("No se encontraron películas populares");

				// Tomar solo la cantidad solicitada
				var popularMovies = allMovies
					.Take(cantidad)
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average
					})
					.ToList();

				return new OkObjectResult(popularMovies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo populares de TMDB para página {Page}", page);
				return new ObjectResult("Error al obtener películas populares de TMDB") { StatusCode = 500 };
			}
		}

		public async Task<ActionResult<List<PeliculaDTO>>> GetMoviesByGenreOnlyTmdbAsync(string genreName, int cantidad)
		{
			try
			{
				_logger.LogInformation("Usando respaldo TMDB completo para género {GenreName}", genreName);

				List<TmdbSearchResult> allMovies = new();

				// 1. Intentar primero con el ID específico del género
				var genreId = GetTmdbGenreId(genreName);
				if (genreId.HasValue)
				{
					// Obtener películas usando el endpoint de discover por género
					int maxPages = Math.Max(2, (int)Math.Ceiling((double)cantidad / 20));

					for (int page = 1; page <= maxPages && allMovies.Count < cantidad * 2; page++)
					{
						var genreResponse = await _tmdbService.GetMoviesByGenreAsync(genreId.Value, page);

						if (genreResponse?.Results != null && genreResponse.Results.Any())
						{
							allMovies.AddRange(genreResponse.Results);
						}
						else
						{
							break;
						}
					}
				}

				// 2. Si no tenemos suficientes películas, complementar con búsqueda por palabra clave
				if (allMovies.Count < cantidad)
				{
					var searchResponse = await _tmdbService.SearchMoviesAsync(genreName, 1);
					if (searchResponse?.Results != null && searchResponse.Results.Any())
					{
						// Agregar películas que no estén ya en la lista
						var newMovies = searchResponse.Results
							.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
							.Take(cantidad - allMovies.Count);

						allMovies.AddRange(newMovies);
					}
				}

				// 3. Si aún no tenemos suficientes, usar películas populares filtradas por año reciente
				if (allMovies.Count < cantidad)
				{
					var currentYear = DateTime.Now.Year;
					var popularResponse = await _tmdbService.GetPopularMoviesAsync(1);

					if (popularResponse?.Results != null && popularResponse.Results.Any())
					{
						var recentPopular = popularResponse.Results
							.Where(m => m.Release_Date.Year >= currentYear - 2) // Últimos 2 años
							.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
							.Take(cantidad - allMovies.Count);

						allMovies.AddRange(recentPopular);
					}
				}

				// 4. Procesar y devolver resultados
				if (!allMovies.Any())
				{
					return new NotFoundObjectResult($"No se encontraron películas para el género '{genreName}'");
				}

				var movies = allMovies
					.Take(cantidad)
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average,
						Overview = !string.IsNullOrEmpty(m.Overview) ?
							m.Overview.Length > 200 ? m.Overview.Substring(0, 200) + "..." : m.Overview :
							null
					})
					.ToList();

				_logger.LogInformation("Devolviendo {Count} películas de TMDB para género {GenreName}",
					movies.Count, genreName);

				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo películas por género de TMDB: {GenreName}", genreName);
				return new ObjectResult("Error al obtener películas por género de TMDB") { StatusCode = 500 };
			}
		}

		public async Task<ActionResult<List<PeliculaDTO>>> GetEstrenosOnlyTmdbAsync(int year, int cantidad)
		{
			try
			{
				_logger.LogInformation("Usando respaldo TMDB completo para estrenos del año {Year}", year);

				List<TmdbSearchResult> allMovies = new();
				int maxPages = Math.Max(3, (int)Math.Ceiling((double)cantidad / 20));

				// Obtener películas populares y filtrar por año
				for (int page = 1; page <= maxPages && allMovies.Count < cantidad * 2; page++)
				{
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(page);

					if (tmdbResponse?.Results != null && tmdbResponse.Results.Any())
					{
						var moviesFromYear = tmdbResponse.Results
							.Where(m => m.Release_Date.Year == year)
							.ToList();

						allMovies.AddRange(moviesFromYear);
					}
					else
					{
						break;
					}
				}

				// Si no hay suficientes películas del año específico, usar discover con filtro de año
				if (allMovies.Count < cantidad)
				{
					try
					{
						// Intentar usar discover/movie endpoint con filtro de año
						var discoverResponse = await _tmdbService.GetMoviesByYearAsync(year, 1);
						if (discoverResponse?.Results != null && discoverResponse.Results.Any())
						{
							var newMovies = discoverResponse.Results
								.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
								.Take(cantidad - allMovies.Count);

							allMovies.AddRange(newMovies);
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error usando discover endpoint para año {Year}", year);
					}
				}

				if (!allMovies.Any())
				{
					return new NotFoundObjectResult($"No se encontraron estrenos para el año {year}");
				}

				var movies = allMovies
					.Take(cantidad)
					.OrderByDescending(m => m.Release_Date) // Ordenar por fecha de estreno
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average,
						Overview = !string.IsNullOrEmpty(m.Overview) ?
							m.Overview.Length > 200 ? m.Overview.Substring(0, 200) + "..." : m.Overview :
							null
					})
					.ToList();

				_logger.LogInformation("Devolviendo {Count} estrenos de TMDB para año {Year}", movies.Count, year);
				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo estrenos de TMDB para año {Year}", year);
				return new ObjectResult("Error al obtener estrenos de TMDB") { StatusCode = 500 };
			}
		}

		#endregion

		#region Helper Methods

		public async Task<List<PeliculaDTO>> GetTmdbMoviesByYearAsync(int year, int cantidad)
		{
			try
			{
				List<TmdbSearchResult> tmdbMovies = new();

				// Intentar primero con películas populares filtradas por año
				var popularResponse = await _tmdbService.GetPopularMoviesAsync(1);
				if (popularResponse?.Results != null)
				{
					var moviesFromYear = popularResponse.Results
						.Where(m => m.Release_Date.Year == year)
						.Take(cantidad)
						.ToList();

					tmdbMovies.AddRange(moviesFromYear);
				}

				// Si necesitamos más películas, intentar con discover
				if (tmdbMovies.Count < cantidad)
				{
					try
					{
						var discoverResponse = await _tmdbService.GetMoviesByYearAsync(year, 1);
						if (discoverResponse?.Results != null)
						{
							var additionalMovies = discoverResponse.Results
								.Where(m => !tmdbMovies.Any(existing => existing.Id == m.Id))
								.Take(cantidad - tmdbMovies.Count);

							tmdbMovies.AddRange(additionalMovies);
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error usando discover para complementar estrenos del año {Year}", year);
					}
				}

				return tmdbMovies
					.OrderByDescending(m => m.Release_Date)
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average
					})
					.ToList();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo películas de TMDB para año {Year}", year);
				return new List<PeliculaDTO>();
			}
		}

		#endregion

		#region Genre Mapping

		public int? GetTmdbGenreId(string genreName)
		{
			// Normalizar el nombre del género (quitar acentos y convertir a minúsculas)
			string normalizedGenreName = NormalizeGenreName(genreName);

			var genreMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
			{
                // Acción - múltiples variantes
                {"accion", 28},
				{"acción", 28},
				{"action", 28},
        
                // Aventura
                {"aventura", 12},
				{"adventure", 12},
        
                // Animación
                {"animacion", 16},
				{"animación", 16},
				{"animation", 16},
        
                // Comedia
                {"comedia", 35},
				{"comedy", 35},
        
                // Crimen
                {"crimen", 80},
				{"crime", 80},
        
                // Documental
                {"documental", 99},
				{"documentary", 99},
        
                // Drama
                {"drama", 18},
        
                // Familia
                {"familia", 10751},
				{"family", 10751},
        
                // Fantasía - múltiples variantes
                {"fantasia", 14},
				{"fantasía", 14},
				{"fantasy", 14},
        
                // Historia
                {"historia", 36},
				{"history", 36},
        
                // Terror/Horror - múltiples variantes
                {"terror", 27},
				{"horror", 27},
				{"miedo", 27},
        
                // Música
                {"musica", 10402},
				{"música", 10402},
				{"music", 10402},
        
                // Misterio
                {"misterio", 9648},
				{"mystery", 9648},
        
                // Romance
                {"romance", 10749},
				{"romantico", 10749},
				{"romántico", 10749},
        
                // Ciencia ficción - múltiples variantes
                {"ciencia ficcion", 878},
				{"ciencia ficción", 878},
				{"sci-fi", 878},
				{"scifi", 878},
				{"science fiction", 878},
        
                // Thriller
                {"thriller", 53},
				{"suspenso", 53},
				{"suspense", 53},
        
                // Guerra
                {"guerra", 10752},
				{"war", 10752},
				{"belica", 10752},
				{"bélica", 10752},

        
                // Western
                {"western", 37},
				{"oeste", 37}
			};

			// Buscar primero con el nombre original
			if (genreMap.TryGetValue(genreName, out var id))
			{
				return id;
			}

			// Buscar con el nombre normalizado
			if (genreMap.TryGetValue(normalizedGenreName, out var normalizedId))
			{
				return normalizedId;
			}

			return null;
		}

		public string NormalizeGenreName(string genreName)
		{
			if (string.IsNullOrEmpty(genreName))
				return genreName;

			// Convertir a minúsculas y quitar espacios extra
			string normalized = genreName.Trim().ToLowerInvariant();

			// Quitar acentos comunes
			normalized = normalized
				.Replace("á", "a")
				.Replace("é", "e")
				.Replace("í", "i")
				.Replace("ó", "o")
				.Replace("ú", "u")
				.Replace("ü", "u")
				.Replace("ñ", "n");

			return normalized;
		}

		#endregion
	}
}
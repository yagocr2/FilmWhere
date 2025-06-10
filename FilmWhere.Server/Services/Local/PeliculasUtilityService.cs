using FilmWhere.Context;
using FilmWhere.Services;
using FilmWhere.Server.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Services.TmdbService;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Server.Services.Local
{
	/// <summary>
	/// Servicio utilitario para operaciones con películas que proporciona funcionalidad de respaldo
	/// utilizando únicamente la API de TMDB cuando la base de datos no está disponible.
	/// </summary>
	public class PeliculasUtilityService
	{
		private readonly TmdbService _tmdbService;
		private readonly WatchModeService _watchModeService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculasUtilityService> _logger;

		/// <summary>
		/// Mapeo de géneros en español/inglés a sus respectivos IDs en TMDB.
		/// </summary>
		private static readonly Dictionary<string, int> GenreMap = new(StringComparer.OrdinalIgnoreCase)
		{
			// Acción
			{"accion", 28}, {"acción", 28}, {"action", 28},
			// Aventura
			{"aventura", 12}, {"adventure", 12},
			// Animación
			{"animacion", 16}, {"animación", 16}, {"animation", 16},
			// Comedia
			{"comedia", 35}, {"comedy", 35},
			// Crimen
			{"crimen", 80}, {"crime", 80},
			// Documental
			{"documental", 99}, {"documentary", 99},
			// Drama
			{"drama", 18},
			// Familia
			{"familia", 10751}, {"family", 10751},
			// Fantasía
			{"fantasia", 14}, {"fantasía", 14}, {"fantasy", 14},
			// Historia
			{"historia", 36}, {"history", 36},
			// Terror/Horror
			{"terror", 27}, {"horror", 27}, {"miedo", 27},
			// Música
			{"musica", 10402}, {"música", 10402}, {"music", 10402},
			// Misterio
			{"misterio", 9648}, {"mystery", 9648},
			// Romance
			{"romance", 10749}, {"romantico", 10749}, {"romántico", 10749},
			// Ciencia ficción
			{"ciencia ficcion", 878}, {"ciencia ficción", 878}, {"sci-fi", 878},
			{"scifi", 878}, {"science fiction", 878},
			// Thriller
			{"thriller", 53}, {"suspenso", 53}, {"suspense", 53},
			// Guerra
			{"guerra", 10752}, {"war", 10752}, {"belica", 10752}, {"bélica", 10752},
			// Western
			{"western", 37}, {"oeste", 37}
		};

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

		/// <summary>
		/// Verifica si la base de datos está disponible y accesible.
		/// </summary>
		/// <returns>True si la base de datos está disponible, False en caso contrario</returns>
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

		/// <summary>
		/// Busca películas utilizando únicamente la API de TMDB.
		/// </summary>
		/// <param name="query">Término de búsqueda</param>
		/// <param name="page">Número de página para paginación</param>
		/// <returns>Lista de películas encontradas o mensaje de error</returns>
		public async Task<ActionResult<List<PeliculaDTO>>> SearchOnlyTmdbAsync(string query, int page = 1)
		{
			try
			{
				var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, page);

				if (!ValidateApiResponse(tmdbResponse))
				{
					return new NotFoundObjectResult("No se encontraron películas en TMDB");
				}

				var movies = ConvertToMovieList(tmdbResponse.Results.Take(20));
				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error buscando en TMDB: {Query}", query);
				return CreateErrorResult("Error al buscar películas en TMDB");
			}
		}

		/// <summary>
		/// Obtiene películas populares utilizando únicamente la API de TMDB.
		/// </summary>
		/// <param name="page">Número de página para paginación</param>
		/// <param name="cantidad">Cantidad de películas a obtener</param>
		/// <returns>Lista de películas populares o mensaje de error</returns>
		public async Task<ActionResult<List<PeliculaDTO>>> GetPopularOnlyTmdbAsync(int page = 1, int cantidad = 50)
		{
			try
			{
				var allMovies = new List<TmdbSearchResult>();
				int paginasNecesarias = CalcularPaginasNecesarias(cantidad, 48);
				int paginaInicioTmdb = (page - 1) * paginasNecesarias + 1;

				await CollectMoviesFromPages(allMovies, paginaInicioTmdb, paginasNecesarias, cantidad * 2,
					async (pageNum) => await _tmdbService.GetPopularMoviesAsync(pageNum));

				if (!allMovies.Any())
					return new NotFoundObjectResult("No se encontraron películas populares");

				var movies = ConvertToMovieList(allMovies.Take(cantidad));
				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo populares de TMDB para página {Page}", page);
				return CreateErrorResult("Error al obtener películas populares de TMDB");
			}
		}

		/// <summary>
		/// Obtiene películas por género utilizando únicamente la API de TMDB.
		/// Utiliza múltiples estrategias: búsqueda por ID de género, búsqueda por palabra clave y películas populares recientes.
		/// </summary>
		/// <param name="genreName">Nombre del género a buscar</param>
		/// <param name="cantidad">Cantidad de películas a obtener</param>
		/// <returns>Lista de películas del género especificado o mensaje de error</returns>
		public async Task<ActionResult<List<PeliculaDTO>>> GetMoviesByGenreOnlyTmdbAsync(string genreName, int cantidad)
		{
			try
			{
				_logger.LogInformation("Usando respaldo TMDB completo para género {GenreName}", genreName);

				var allMovies = new List<TmdbSearchResult>();

				// Estrategia 1: Búsqueda por ID de género
				await GetMoviesByGenreId(allMovies, genreName, cantidad);

				// Estrategia 2: Búsqueda por palabra clave si no hay suficientes
				await SupplementWithKeywordSearch(allMovies, genreName, cantidad);

				// Estrategia 3: Películas populares recientes como último recurso
				await SupplementWithRecentPopular(allMovies, cantidad);

				if (!allMovies.Any())
				{
					return new NotFoundObjectResult($"No se encontraron películas para el género '{genreName}'");
				}

				var movies = ConvertToMovieListWithOverview(allMovies.Take(cantidad));
				_logger.LogInformation("Devolviendo {Count} películas de TMDB para género {GenreName}", movies.Count, genreName);

				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo películas por género de TMDB: {GenreName}", genreName);
				return CreateErrorResult("Error al obtener películas por género de TMDB");
			}
		}

		/// <summary>
		/// Obtiene estrenos de un año específico utilizando únicamente la API de TMDB.
		/// </summary>
		/// <param name="year">Año de los estrenos a buscar</param>
		/// <param name="cantidad">Cantidad de películas a obtener</param>
		/// <returns>Lista de estrenos del año especificado o mensaje de error</returns>
		public async Task<ActionResult<List<PeliculaDTO>>> GetEstrenosOnlyTmdbAsync(int year, int cantidad)
		{
			try
			{
				_logger.LogInformation("Usando respaldo TMDB completo para estrenos del año {Year}", year);

				var allMovies = new List<TmdbSearchResult>();
				int maxPages = CalcularPaginasNecesarias(cantidad, 48, 3);

				// Obtener películas populares filtradas por año
				await CollectMoviesFromPagesWithYearFilter(allMovies, maxPages, year, cantidad * 2);

				// Complementar con discover si es necesario
				await SupplementWithDiscoverByYear(allMovies, year, cantidad);

				if (!allMovies.Any())
				{
					return new NotFoundObjectResult($"No se encontraron estrenos para el año {year}");
				}

				var movies = allMovies
					.Take(cantidad)
					.OrderByDescending(m => m.Release_Date)
					.Select(ConvertToMovieDTOWithOverview)
					.ToList();

				_logger.LogInformation("Devolviendo {Count} estrenos de TMDB para año {Year}", movies.Count, year);
				return new OkObjectResult(movies);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo estrenos de TMDB para año {Year}", year);
				return CreateErrorResult("Error al obtener estrenos de TMDB");
			}
		}

		#endregion

		#region Helper Methods

		/// <summary>
		/// Obtiene películas de TMDB filtradas por año específico.
		/// </summary>
		/// <param name="year">Año de las películas a obtener</param>
		/// <param name="cantidad">Cantidad máxima de películas a obtener</param>
		/// <returns>Lista de películas del año especificado</returns>
		public async Task<List<PeliculaDTO>> GetTmdbMoviesByYearAsync(int year, int cantidad)
		{
			try
			{
				var tmdbMovies = new List<TmdbSearchResult>();

				// Intentar con películas populares filtradas por año
				await GetPopularMoviesByYear(tmdbMovies, year, cantidad);

				// Complementar con discover si es necesario
				await SupplementWithDiscoverByYear(tmdbMovies, year, cantidad);

				return tmdbMovies
					.OrderByDescending(m => m.Release_Date)
					.Take(cantidad)
					.Select(ConvertToMovieDTO)
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

		/// <summary>
		/// Obtiene el ID de género de TMDB basado en el nombre del género en español o inglés.
		/// </summary>
		/// <param name="genreName">Nombre del género a buscar</param>
		/// <returns>ID del género en TMDB o null si no se encuentra</returns>
		public int? GetTmdbGenreId(string genreName)
		{
			if (string.IsNullOrEmpty(genreName))
				return null;

			// Buscar primero con el nombre original
			if (GenreMap.TryGetValue(genreName, out var id))
				return id;

			// Buscar con el nombre normalizado
			var normalizedName = NormalizeGenreName(genreName);
			return GenreMap.TryGetValue(normalizedName, out var normalizedId) ? normalizedId : null;
		}

		/// <summary>
		/// Normaliza el nombre de un género eliminando acentos y convirtiendo a minúsculas.
		/// </summary>
		/// <param name="genreName">Nombre del género a normalizar</param>
		/// <returns>Nombre del género normalizado</returns>
		public string NormalizeGenreName(string genreName)
		{
			if (string.IsNullOrEmpty(genreName))
				return genreName;

			return genreName.Trim().ToLowerInvariant()
				.Replace("á", "a").Replace("é", "e").Replace("í", "i")
				.Replace("ó", "o").Replace("ú", "u").Replace("ü", "u")
				.Replace("ñ", "n");
		}

		#endregion

		#region Private Helper Methods

		/// <summary>
		/// Valida la respuesta de la API de TMDB para asegurarse de que contiene resultados.
		/// </summary>
		/// <typeparam name="T"></typeparam>
		/// <param name="response"></param>
		/// <returns></returns>
		private static bool ValidateApiResponse<T>(T response) where T : class
		{
			return response != null &&
				   typeof(T).GetProperty("Results")?.GetValue(response) is IEnumerable<object> results &&
				   results.Any();
		}

		/// <summary>
		/// Calcula el número de páginas necesarias para obtener una cantidad específica de elementos,
		/// </summary>
		/// <param name="cantidad"></param>
		/// <param name="elementosPorPagina"></param>
		/// <param name="minimo"></param>
		/// <returns></returns>
		private static int CalcularPaginasNecesarias(int cantidad, int elementosPorPagina, int minimo = 0)
		{
			return Math.Max(minimo, (int)Math.Ceiling((double)cantidad / elementosPorPagina));
		}

		/// <summary>
		/// Crea un resultado de error para devolver en caso de fallos en las operaciones.
		/// </summary>
		/// <param name="message"></param>
		/// <returns></returns>
		private static ObjectResult CreateErrorResult(string message)
		{
			return new ObjectResult(message) { StatusCode = 500 };
		}
		/// <summary>
		/// Convierte una colección de TmdbSearchResult a una lista de PeliculaDTO sin overview.
		/// </summary>
		/// <param name="tmdbResults"></param>
		/// <returns></returns>
		private static List<PeliculaDTO> ConvertToMovieList(IEnumerable<TmdbSearchResult> tmdbResults)
		{
			return tmdbResults.Select(ConvertToMovieDTO).ToList();
		}

		/// <summary>
		/// Convierte una colección de TmdbSearchResult a PeliculaDTO incluyendo un overview truncado.
		/// </summary>
		/// <param name="tmdbResults"></param>
		/// <returns></returns>
		private static List<PeliculaDTO> ConvertToMovieListWithOverview(IEnumerable<TmdbSearchResult> tmdbResults)
		{
			return tmdbResults.Select(ConvertToMovieDTOWithOverview).ToList();
		}

		/// <summary>
		/// Convierte un TmdbSearchResult individual a PeliculaDTO sin overview.
		/// </summary>
		/// <param name="movie"></param>
		/// <returns></returns>
		private static PeliculaDTO ConvertToMovieDTO(TmdbSearchResult movie)
		{
			return new PeliculaDTO
			{
				Id = movie.Id.ToString(),
				Title = movie.Title,
				PosterUrl = $"https://image.tmdb.org/t/p/w500/{movie.Poster_Path}",
				Year = movie.Release_Date.Year,
				Rating = movie.Vote_Average
			};
		}

		/// <summary>
		/// Convierte un TmdbSearchResult individual a PeliculaDTO incluyendo un overview truncado.
		/// </summary>
		/// <param name="movie"></param>
		/// <returns></returns>
		private static PeliculaDTO ConvertToMovieDTOWithOverview(TmdbSearchResult movie)
		{
			var dto = ConvertToMovieDTO(movie);
			dto.Overview = TruncateOverview(movie.Overview);
			return dto;
		}

		/// <summary>
		/// Trunca el overview de una película a un máximo de 200 caracteres, añadiendo "..." si es necesario.
		/// </summary>
		/// <param name="overview"></param>
		/// <returns></returns>
		private static string TruncateOverview(string overview)
		{
			if (string.IsNullOrEmpty(overview))
				return null;

			return overview.Length > 200 ? overview.Substring(0, 200) + "..." : overview;
		}

		/// <summary>
		/// Recopila películas de múltiples páginas de TMDB.
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="startPage"></param>
		/// <param name="pageCount"></param>
		/// <param name="maxMovies"></param>
		/// <param name="getPageFunc"></param>
		/// <returns></returns>
		private async Task CollectMoviesFromPages(List<TmdbSearchResult> allMovies, int startPage, int pageCount,
			int maxMovies, Func<int, Task<TmdbSearchResponse>> getPageFunc)
		{
			for (int i = 0; i < pageCount && allMovies.Count < maxMovies; i++)
			{
				var response = await getPageFunc(startPage + i);
				if (response?.Results == null || !response.Results.Any())
					break;

				allMovies.AddRange(response.Results);
			}
		}

		/// <summary>
		/// 
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="maxPages"></param>
		/// <param name="year"></param>
		/// <param name="maxMovies"></param>
		/// <returns></returns>
		private async Task CollectMoviesFromPagesWithYearFilter(List<TmdbSearchResult> allMovies, int maxPages,
			int year, int maxMovies)
		{
			for (int page = 1; page <= maxPages && allMovies.Count < maxMovies; page++)
			{
				var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(page);
				if (tmdbResponse?.Results == null || !tmdbResponse.Results.Any())
					break;

				var moviesFromYear = tmdbResponse.Results.Where(m => m.Release_Date.Year == year);
				allMovies.AddRange(moviesFromYear);
			}
		}

		/// <summary>
		/// 
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="genreName"></param>
		/// <param name="cantidad"></param>
		/// <returns></returns>
		private async Task GetMoviesByGenreId(List<TmdbSearchResult> allMovies, string genreName, int cantidad)
		{
			var genreId = GetTmdbGenreId(genreName);
			if (!genreId.HasValue) return;

			int maxPages = CalcularPaginasNecesarias(cantidad, 48, 2);
			await CollectMoviesFromPages(allMovies, 1, maxPages, cantidad * 2,
				async (page) => await _tmdbService.GetMoviesByGenreAsync(genreId.Value, page));
		}

		/// <summary>
		/// Complementa la lista de películas con una búsqueda por palabra clave si no hay suficientes resultados del género.
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="genreName"></param>
		/// <param name="cantidad"></param>
		/// <returns></returns>
		private async Task SupplementWithKeywordSearch(List<TmdbSearchResult> allMovies, string genreName, int cantidad)
		{
			if (allMovies.Count >= cantidad) return;

			var searchResponse = await _tmdbService.SearchMoviesAsync(genreName, 1);
			if (searchResponse?.Results == null) return;

			var newMovies = searchResponse.Results
				.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
				.Take(cantidad - allMovies.Count);

			allMovies.AddRange(newMovies);
		}

		/// <summary>
		/// Complementa la lista de películas con populares recientes si no hay suficientes resultados del género.
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="cantidad"></param>
		/// <returns></returns>
		private async Task SupplementWithRecentPopular(List<TmdbSearchResult> allMovies, int cantidad)
		{
			if (allMovies.Count >= cantidad) return;

			var currentYear = DateTime.Now.Year;
			var popularResponse = await _tmdbService.GetPopularMoviesAsync(1);
			if (popularResponse?.Results == null) return;

			var recentPopular = popularResponse.Results
				.Where(m => m.Release_Date.Year >= currentYear - 2)
				.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
				.Take(cantidad - allMovies.Count);

			allMovies.AddRange(recentPopular);
		}

		/// <summary>
		/// Obtiene películas populares de TMDB filtradas por año específico.
		/// </summary>
		/// <param name="tmdbMovies"></param>
		/// <param name="year"></param>
		/// <param name="cantidad"></param>
		/// <returns></returns>
		private async Task GetPopularMoviesByYear(List<TmdbSearchResult> tmdbMovies, int year, int cantidad)
		{
			var popularResponse = await _tmdbService.GetPopularMoviesAsync(1);
			if (popularResponse?.Results != null)
			{
				var moviesFromYear = popularResponse.Results
					.Where(m => m.Release_Date.Year == year)
					.Take(cantidad);

				tmdbMovies.AddRange(moviesFromYear);
			}
		}

		/// <summary>
		/// Complementa la lista de películas con resultados de discover por año si no hay suficientes.
		/// </summary>
		/// <param name="allMovies"></param>
		/// <param name="year"></param>
		/// <param name="cantidad"></param>
		/// <returns></returns>
		private async Task SupplementWithDiscoverByYear(List<TmdbSearchResult> allMovies, int year, int cantidad)
		{
			if (allMovies.Count >= cantidad) return;

			try
			{
				var discoverResponse = await _tmdbService.GetMoviesByYearAsync(year, 1);
				if (discoverResponse?.Results == null) return;

				var newMovies = discoverResponse.Results
					.Where(m => !allMovies.Any(existing => existing.Id == m.Id))
					.Take(cantidad - allMovies.Count);

				allMovies.AddRange(newMovies);
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Error usando discover endpoint para año {Year}", year);
			}
		}

		#endregion
	}
}
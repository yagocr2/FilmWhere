using FilmWhere.Context;
using FilmWhere.Services;
using FilmWhere.Server.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Services.TmdbService;
using FilmWhere.Server.Services.Local;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Server.Controllers
{
	/// <summary>
	/// Controlador para la gestión de películas
	/// </summary>
	[ApiController]
	[Route("api/[controller]")]
	[Produces("application/json")]
	public class PeliculaController : ControllerBase
	{
		private readonly TmdbService _tmdbService;
		private readonly WatchModeService _watchModeService;
		private readonly DataSyncService _dataSyncService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculaController> _logger;
		private readonly PeliculasUtilityService _utilityService;

		public PeliculaController(
			TmdbService tmdbService,
			WatchModeService watchModeService,
			DataSyncService dataSyncService,
			MyDbContext context,
			ILogger<PeliculaController> logger,
			PeliculasUtilityService utilityService)
		{
			_tmdbService = tmdbService;
			_watchModeService = watchModeService;
			_dataSyncService = dataSyncService;
			_context = context;
			_logger = logger;
			_utilityService = utilityService;
		}

		#region Obtener Película por ID

		/// <summary>
		/// Obtiene los detalles de una película específica por su ID
		/// </summary>
		/// <param name="id">ID de la película (puede ser ID local o ID de TMDB)</param>
		/// <returns>Detalles completos de la película incluyendo géneros, plataformas y reseñas</returns>
		/// <response code="200">Película encontrada exitosamente</response>
		/// <response code="404">No se encontró ninguna película con el ID especificado</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("{id}")]
		[ProducesResponseType(typeof(PeliculaDTO), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PeliculaDTO>> GetMovieById(string id)
		{
			try
			{
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();
				if (dbAvailable)
				{
					try
					{
						// Buscar primero en la base de datos local
						var localMovie = await _context.Peliculas
							.Include(p => p.Generos)
								.ThenInclude(pg => pg.Genero)
							.Include(p => p.Plataformas)
								.ThenInclude(pp => pp.Plataforma)
							.Include(p => p.Reseñas)
								.ThenInclude(r => r.Usuario)
							.FirstOrDefaultAsync(p => p.Id == id || p.IdApiTmdb.ToString() == id);

						if (localMovie != null)
						{
							var movieDetail = new PeliculaDTO
							{
								Id = localMovie.Id,
								Title = localMovie.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{localMovie.PosterUrl}",
								Overview = localMovie.Sinopsis,
								Year = localMovie.Año ?? 0,
								Rating = localMovie.Reseñas.Any()
									? Math.Round(localMovie.Reseñas.Average(r => r.Calificacion), 1)
									: null,
								Genres = localMovie.Generos.Select(pg => pg.Genero.Nombre).ToList(),
								Platforms = localMovie.Plataformas.Select(pp => new PlataformaDTO
								{
									Name = pp.Plataforma.Nombre,
									Type = pp.Tipo.ToString(),
									Price = pp.Precio,
									Url = pp.Enlace
								}).ToList(),
								Reviews = localMovie.Reseñas.OrderByDescending(r => r.Fecha).Take(5).Select(r => new ReviewDTO
								{
									Id = r.Id,
									Comment = r.Comentario,
									Rating = r.Calificacion,
									Date = r.Fecha,
									UserName = r.Usuario.UserName,
									UserId = r.Usuario.Id
								}).ToList(),
								ReviewCount = localMovie.Reseñas.Count,
								TmdbId = localMovie.IdApiTmdb
							};

							return movieDetail;
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error accediendo a BD local para detalles");
						// Continuar con TMDB como respaldo
					}
				}

				//Si no está en BD local, buscar en TMDB usando GetMovieDetailsAsync
				if (int.TryParse(id, out int tmdbId))
				{
					var plataformas = await _watchModeService.GetStreamingSourcesAsync(tmdbId);
					var movieDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId);
					_logger.BeginScope("Obteniendo detalles de película TMDB ID: {TmdbId}", plataformas);

					if (movieDetails != null)
					{
						var basicMovieDetail = new PeliculaDTO
						{
							Id = movieDetails.Id.ToString(),
							Title = movieDetails.Title,
							PosterUrl = $"https://image.tmdb.org/t/p/w500/{movieDetails.Poster_Path}",
							Overview = movieDetails.Overview,
							Year = movieDetails.GetReleaseDate()?.Year ?? 0,
							Rating = movieDetails.Vote_Average,
							Genres = movieDetails.Genres.Select(g => g.Name).ToList(),
							Platforms = plataformas,
							Reviews = new List<ReviewDTO>(),
							ReviewCount = 0,
							TmdbId = movieDetails.Id
						};

						return basicMovieDetail;
					}
				}

				return NotFound($"No se encontró película con ID {id}");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener detalles de película con ID {Id}", id);
				return StatusCode(500, $"Error al obtener detalles de la película: {ex.Message}");
			}
		}

		#endregion

		#region Búsquedas

		/// <summary>
		/// Busca películas por título
		/// </summary>
		/// <param name="query">Término de búsqueda para el título de la película</param>
		/// <param name="page">Número de página para paginación (por defecto: 1)</param>
		/// <returns>Lista de películas que coinciden con el término de búsqueda</returns>
		/// <response code="200">Búsqueda realizada exitosamente</response>
		/// <response code="400">El término de búsqueda está vacío</response>
		/// <response code="404">No se encontraron películas</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("buscar")]
		[ProducesResponseType(typeof(List<PeliculaDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<PeliculaDTO>>> SearchMovies(
		   [FromQuery] string query,
		   [FromQuery] int page = 1)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(query))
				{
					return BadRequest("El término de búsqueda no puede estar vacío");
				}

				// Verificar disponibilidad de la base de datos
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();

				List<PeliculaDTO> localResults = new();

				if (dbAvailable)
				{
					try
					{
						// Buscar en la base de datos local
						localResults = await _context.Peliculas
							.Where(p => p.Titulo.Contains(query))
							.Skip((page - 1) * 20)
							.Take(20)
							.Select(p => new PeliculaDTO
							{
								Id = p.Id,
								Title = p.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
								Year = p.Año ?? 0
							})
							.ToListAsync();
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error accediendo a base de datos local, usando solo TMDB");
						dbAvailable = false;
					}
				}

				// Si no hay base de datos disponible, usar solo TMDB
				if (!dbAvailable)
				{
					return await _utilityService.SearchOnlyTmdbAsync(query, page);
				}

				// Si tenemos suficientes resultados locales, devolverlos
				if (localResults.Count >= 10)
				{
					return localResults;
				}

				// Complementar con TMDB
				try
				{
					var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, page);

					if (tmdbResponse?.Results != null && tmdbResponse.Results.Any())
					{
						var tmdbResults = tmdbResponse.Results
							.Take(20 - localResults.Count)
							.Select(m => new PeliculaDTO
							{
								Id = m.Id.ToString(),
								Title = m.Title,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
								Year = m.Release_Date.Year,
								Rating = (decimal?)m.Vote_Average
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
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error buscando en TMDB");
				}

				// Devolver solo los resultados locales si los hay
				return localResults.Any() ? localResults : NotFound("No se encontraron películas");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al buscar películas con término: {Query}", query);
				return StatusCode(500, $"Error al buscar películas: {ex.Message}");
			}
		}

		/// <summary>
		/// Obtiene sugerencias de títulos de películas basadas en el término de búsqueda
		/// </summary>
		/// <param name="query">Término de búsqueda parcial (mínimo 2 caracteres)</param>
		/// <returns>Lista de sugerencias de títulos de películas</returns>
		/// <response code="200">Sugerencias obtenidas exitosamente</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("sugerencias")]
		[ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string query)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
				{
					return new List<string>();
				}

				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();

				if (dbAvailable)
				{
					try
					{
						var suggestions = await _context.Peliculas
							.Where(p => p.Titulo.Contains(query))
							.Select(p => p.Titulo)
							.Distinct()
							.Take(5)
							.ToListAsync();

						if (suggestions.Any())
							return suggestions;
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo sugerencias de BD local");
					}
				}

				// Respaldo con TMDB
				try
				{
					var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, 1);
					var tmdbSuggestions = tmdbResponse?.Results?
						.Take(5)
						.Select(m => m.Title)
						.ToList() ?? new List<string>();

					return tmdbSuggestions;
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error obteniendo sugerencias de TMDB");
					return new List<string>();
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener sugerencias para: {Query}", query);
				return new List<string>();
			}
		}

		/// <summary>
		/// Realiza una búsqueda avanzada de películas con múltiples filtros
		/// </summary>
		/// <param name="title">Filtro por título (opcional)</param>
		/// <param name="year">Filtro por año de lanzamiento (opcional)</param>
		/// <param name="genre">Filtro por género (opcional)</param>
		/// <param name="page">Número de página para paginación (por defecto: 1)</param>
		/// <returns>Lista de películas que coinciden con los filtros especificados</returns>
		/// <response code="200">Búsqueda realizada exitosamente</response>
		/// <response code="404">No se encontraron películas con los filtros especificados</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("busqueda-avanzada")]
		[ProducesResponseType(typeof(List<PeliculaDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<PeliculaDTO>>> AdvancedSearch(
			[FromQuery] string? title,
			[FromQuery] int? year,
			[FromQuery] string? genre,
			[FromQuery] int page = 1)
		{
			try
			{
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();

				if (dbAvailable)
				{
					try
					{
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
							.Select(p => new PeliculaDTO
							{
								Id = p.Id,
								Title = p.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
								Year = p.Año ?? 0
							})
							.ToListAsync();

						if (results.Any())
							return results;
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error en búsqueda avanzada local, usando TMDB");
					}
				}

				// Respaldo con TMDB para búsqueda básica por título
				if (!string.IsNullOrWhiteSpace(title))
				{
					return await _utilityService.SearchOnlyTmdbAsync(title, page);
				}

				return NotFound("No se encontraron películas con los filtros especificados");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error en búsqueda avanzada");
				return StatusCode(500, $"Error en búsqueda avanzada: {ex.Message}");
			}
		}

		#endregion

		#region Películas por Género

		/// <summary>
		/// Obtiene películas filtradas por género específico con paginación
		/// </summary>
		/// <param name="genreName">Nombre del género (ej: "Acción", "Comedia", "Drama")</param>
		/// <param name="page">Número de página (por defecto: 1)</param>
		/// <param name="cantidad">Número máximo de películas por página (por defecto: 15)</param>
		/// <returns>Lista paginada de películas del género especificado</returns>
		/// <response code="200">Películas del género obtenidas exitosamente</response>
		/// <response code="404">No se encontraron películas del género especificado</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("genero/{genreName}")]
		[ProducesResponseType(typeof(PaginatedResponse<PeliculaDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<PaginatedResponse<PeliculaDTO>>> GetMoviesByGenre(
			string genreName,
			int page = 1,
			int cantidad = 15)
		{
			try
			{
				// Validar parámetros de paginación
				if (page < 1) page = 1;
				if (cantidad < 1 || cantidad > 100) cantidad = 15;

				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();
				List<PeliculaDTO> localMovies = new();
				int totalMovies = 0;
				int totalPages = 0;

				if (dbAvailable)
				{
					try
					{
						var genre = await _context.Generos
							.FirstOrDefaultAsync(g => g.Nombre.ToLower() == genreName.ToLower());

						if (genre != null)
						{
							totalMovies = await _context.PeliculaGeneros
								.Where(pg => pg.GeneroId == genre.Id)
								.CountAsync();

							if (totalMovies > 0)
							{
								totalPages = (int)Math.Ceiling((double)totalMovies / cantidad);
								var skip = (page - 1) * cantidad;

								localMovies = await _context.PeliculaGeneros
									.Where(pg => pg.GeneroId == genre.Id)
									.Include(pg => pg.Pelicula)
									.ThenInclude(p => p.Reseñas)
									.Select(pg => pg.Pelicula)
									.OrderByDescending(p => p.Reseñas.Count)
									.Skip(skip)
									.Take(cantidad)
									.Select(p => new PeliculaDTO
									{
										Id = p.Id,
										Title = p.Titulo,
										PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
										Year = p.Año ?? 0,
										Rating = p.Reseñas.Any()
											? Math.Round(p.Reseñas.Average(r => r.Calificacion), 1)
											: null
									})
									.ToListAsync();
							}
						}
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo películas por género de BD local");
					}
				}

				// Obtener resultados externos (TMDB)
				var tmdbResult = await _utilityService.GetMoviesByGenreOnlyTmdbAsync(genreName, page, cantidad);
				List<PeliculaDTO> tmdbMovies = new();
				int tmdbTotalPages = 0;
				int tmdbTotalItems = 0;

				if (tmdbResult.Result is OkObjectResult okResult && okResult.Value is PaginatedResponse<PeliculaDTO> tmdbResponse)
				{
					tmdbMovies = tmdbResponse.Data ?? new List<PeliculaDTO>();
					tmdbTotalPages = tmdbResponse.TotalPages;
					tmdbTotalItems = tmdbResponse.TotalItems;
				}

				// Concatenar y eliminar duplicados por título (ignorando mayúsculas/minúsculas)
				var combinedMovies = localMovies
					.Concat(tmdbMovies)
					.GroupBy(m => m.Title.ToLower())
					.Select(g => g.First())
					.OrderByDescending(m => m.Rating)
					.Take(cantidad)
					.ToList();

				// Calcular totales combinados
				int combinedTotalItems = totalMovies + tmdbTotalItems;
				int combinedTotalPages = (int)Math.Ceiling((double)combinedTotalItems / cantidad);

				if (combinedMovies.Any())
				{
					var response = new PaginatedResponse<PeliculaDTO>
					{
						Data = combinedMovies,
						CurrentPage = page,
						TotalPages = combinedTotalPages > 0 ? combinedTotalPages : 1,
						TotalItems = combinedTotalItems,
						ItemsPerPage = cantidad,
						HasNextPage = page < (combinedTotalPages > 0 ? combinedTotalPages : 1),
						HasPreviousPage = page > 1
					};
					return Ok(response);
				}

				return NotFound("No se encontraron películas del género especificado");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas por género {GenreName}, página {Page}", genreName, page);
				return StatusCode(500, $"Error al obtener películas: {ex.Message}");
			}
		}

		/// <summary>
		/// Obtiene la lista de géneros disponibles en el sistema
		/// </summary>
		/// <returns>Lista de todos los géneros disponibles con sus IDs y nombres</returns>
		/// <response code="200">Lista de géneros obtenida exitosamente</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("generos")]
		[ProducesResponseType(typeof(List<GeneroDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<GeneroDTO>>> GetAvailableGenres()
		{
			try
			{
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();

				if (dbAvailable)
				{
					try
					{
						var genres = await _context.Generos
							.Select(g => new GeneroDTO
							{
								Id = g.Id,
								Name = g.Nombre
							})
							.ToListAsync();

						if (genres.Any())
							return genres;
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo géneros de BD local");
					}
				}

				// Respaldo: géneros básicos predefinidos
				var defaultGenres = new List<GeneroDTO>
				{
					new() { Id = "28", Name = "Acción" },
					new() { Id = "12", Name = "Aventura" },
					new() { Id = "16", Name = "Animación" },
					new() { Id = "35", Name = "Comedia" },
					new() { Id = "80", Name = "Crimen" },
					new() { Id = "99", Name = "Documental" },
					new() { Id = "18", Name = "Drama" },
					new() { Id = "10751", Name = "Familia" },
					new() { Id = "14", Name = "Fantasía" },
					new() { Id = "36", Name = "Historia" },
					new() { Id = "27", Name = "Terror" },
					new() { Id = "10402", Name = "Música" },
					new() { Id = "9648", Name = "Misterio" },
					new() { Id = "10749", Name = "Romance" },
					new() { Id = "878", Name = "Ciencia ficción" },
					new() { Id = "10770", Name = "Película de TV" },
					new() { Id = "53", Name = "Thriller" },
					new() { Id = "10752", Name = "Guerra" },
					new() { Id = "37", Name = "Western" }
				};

				return defaultGenres;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener géneros disponibles");
				return StatusCode(500, $"Error al obtener géneros: {ex.Message}");
			}
		}

		#endregion

		#region Estrenos y populares

		/// <summary>
		/// Obtiene las películas de estreno recientes para un año específico
		/// </summary>
		/// <param name="año">Año de los estrenos (por defecto: año actual)</param>
		/// <param name="cantidad">Número máximo de películas a devolver (por defecto: 15)</param>
		/// <returns>Lista de películas estrenadas en el año especificado</returns>
		/// <response code="200">Estrenos obtenidos exitosamente</response>
		/// <response code="404">No se encontraron estrenos para el año especificado</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("estrenos")]
		[ProducesResponseType(typeof(List<PeliculaDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<PeliculaDTO>>> GetRecentReleases(int año = 0, int cantidad = 15)
		{
			try
			{
				int targetYear = año > 0 ? año : DateTime.Now.Year;
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();

				List<PeliculaDTO> localResults = new();

				if (dbAvailable)
				{
					try
					{
						var recentMovies = await _context.Peliculas
							.Where(p => p.Año == targetYear)
							.OrderByDescending(p => p.Id)
							.Take(cantidad)
							.Select(p => new PeliculaDTO
							{
								Id = p.Id,
								Title = p.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
								Year = p.Año ?? 0,
								Rating = p.Reseñas.Any()
									? Math.Round(p.Reseñas.Average(r => r.Calificacion), 1)
									: null
							})
							.ToListAsync();

						localResults = recentMovies;
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo estrenos de BD local");
						dbAvailable = false;
					}
				}

				// Si no hay base de datos disponible, usar solo TMDB
				if (!dbAvailable)
				{
					return await _utilityService.GetEstrenosOnlyTmdbAsync(targetYear, cantidad);
				}

				// Si tenemos suficientes resultados locales, devolverlos
				if (localResults.Count >= Math.Min(cantidad, 10))
				{
					return localResults;
				}

				// Complementar con TMDB si no hay suficientes resultados locales
				try
				{
					var tmdbResults = await _utilityService.GetTmdbMoviesByYearAsync(targetYear, cantidad - localResults.Count);

					// Combinar resultados y eliminar duplicados por título
					var combinedResults = localResults
						.Concat(tmdbResults)
						.GroupBy(m => m.Title.ToLower())
						.Select(g => g.First())
						.Take(cantidad)
						.ToList();

					return combinedResults.Any() ? combinedResults : NotFound($"No se encontraron estrenos para el año {targetYear}");
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error obteniendo estrenos de TMDB para año {Year}", targetYear);
				}

				// Devolver solo los resultados locales si los hay
				return localResults.Any() ? localResults : NotFound($"No se encontraron estrenos para el año {targetYear}");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas recientes para año {Year}", año);
				return StatusCode(500, $"Error al obtener estrenos: {ex.Message}");
			}
		}

		/// <summary>
		/// Obtiene las películas más populares
		/// </summary>
		/// <param name="page">Número de página para paginación (por defecto: 1)</param>
		/// <param name="year">Filtro por año específico (opcional)</param>
		/// <param name="cantidad">Número máximo de películas a devolver (por defecto: 50, máximo: 100)</param>
		/// <returns>Lista de películas populares ordenadas por popularidad</returns>
		/// <response code="200">Películas populares obtenidas exitosamente</response>
		/// <response code="404">No se encontraron películas populares</response>
		/// <response code="500">Error interno del servidor</response>
		[HttpGet("populares")]
		[ProducesResponseType(typeof(List<PeliculaDTO>), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public async Task<ActionResult<List<PeliculaDTO>>> GetPopularMovies(int page = 1, int year = 0, int cantidad = 50)
		{
			try
			{
				// Validar parámetros
				if (page < 1) page = 1;
				if (cantidad < 1) cantidad = 50;
				if (cantidad > 100) cantidad = 100; // Limitar máximo por rendimiento

				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();
				List<PeliculaDTO> localMovies = new();

				// Si se solicita un año específico, buscar en la base de datos
				if (year > 0 && dbAvailable)
				{
					try
					{
						int skip = (page - 1) * cantidad;

						localMovies = await _context.Peliculas
							.Where(p => p.Año == year)
							.OrderByDescending(p => p.Reseñas.Count)
							.ThenByDescending(p => p.Id)
							.Skip(skip)
							.Take(cantidad)
							.Select(p => new PeliculaDTO
							{
								Id = p.Id,
								Title = p.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
								Year = p.Año ?? 0
							})
							.ToListAsync();
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo populares de BD local");
					}
				}

				// Obtener resultados externos (TMDB)
				var tmdbResult = await _utilityService.GetPopularOnlyTmdbAsync(page, cantidad);
				List<PeliculaDTO> tmdbMovies = new();
				if (tmdbResult.Result is OkObjectResult okResult && okResult.Value is List<PeliculaDTO> tmdbList)
				{
					tmdbMovies = tmdbList;
				}
				else if (tmdbResult.Value is List<PeliculaDTO> tmdbList2)
				{
					tmdbMovies = tmdbList2;
				}

				// Mezclar y eliminar duplicados por título (ignorando mayúsculas/minúsculas)
				var combinedMovies = localMovies
					.Concat(tmdbMovies)
					.GroupBy(m => m.Title.ToLower())
					.Select(g => g.First())
					.Take(cantidad)
					.ToList();

				if (combinedMovies.Any())
					return combinedMovies;

				return NotFound("No se encontraron películas populares");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas populares - Página: {Page}, Cantidad: {Cantidad}", page, cantidad);
				return StatusCode(500, "Error al obtener películas populares");
			}
		}

		[HttpGet("mejor-valoradas")]
		public async Task<ActionResult<List<PeliculaDTO>>> GetTopRatedMovies(
			[FromQuery] int page = 1,
			[FromQuery] int cantidad = 20,
			[FromQuery] int? year = null)
		{
			try
			{
				int skip = (page - 1) * cantidad;
				bool dbAvailable = await _utilityService.IsDatabaseAvailableAsync();
				List<PeliculaDTO> localMovies = new();

				if (dbAvailable)
				{
					try
					{
						var query = _context.Peliculas
							.Where(p => p.Reseñas.Any())
							.AsQueryable();

						if (year.HasValue)
						{
							query = query.Where(p => p.Año == year.Value);
						}

						localMovies = await query
							.Select(p => new
							{
								Pelicula = p,
								PromedioCalificacion = p.Reseñas.Average(r => r.Calificacion),
								NumeroReseñas = p.Reseñas.Count()
							})
							.Where(x => x.NumeroReseñas >= 2)
							.OrderByDescending(x => x.PromedioCalificacion)
							.ThenByDescending(x => x.NumeroReseñas)
							.Skip(skip)
							.Take(cantidad)
							.Select(x => new PeliculaDTO
							{
								Id = x.Pelicula.Id,
								Title = x.Pelicula.Titulo,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{x.Pelicula.PosterUrl}",
								Year = x.Pelicula.Año ?? 0,
								Rating = x.PromedioCalificacion
							})
							.ToListAsync();
					}
					catch (Exception ex)
					{
						_logger.LogWarning(ex, "Error obteniendo mejor valoradas de BD local");
					}
				}

				// Respaldo con TMDB
				_logger.LogInformation("Usando respaldo TMDB para mejor valoradas");

				List<TmdbSearchResult> allMovies = new();
				int currentPage = page;
				bool hasMorePages = true;

				try
				{
					while (allMovies.Count < cantidad && hasMorePages && currentPage <= 3)
					{
						var tmdbResponse = await _tmdbService.GetTopRatedMoviesAsync(currentPage);

						if (tmdbResponse == null || !tmdbResponse.Results.Any())
						{
							hasMorePages = false;
							break;
						}

						allMovies.AddRange(tmdbResponse.Results);
						currentPage++;

						if (currentPage > tmdbResponse.Total_Pages) hasMorePages = false;
					}
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Error obteniendo películas mejor valoradas de TMDB");
					// Si hay resultados locales, devolverlos aunque falle TMDB
					if (localMovies.Any())
						return localMovies;
					return StatusCode(500, "Error al obtener películas mejor valoradas de TMDB");
				}

				var tmdbMovies = allMovies
					.Select(m => new PeliculaDTO
					{
						Id = m.Id.ToString(),
						Title = m.Title,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
						Year = m.Release_Date.Year,
						Rating = m.Vote_Average
					})
					.ToList();

				// Concatenar y eliminar duplicados por título (ignorando mayúsculas/minúsculas)
				var combinedMovies = localMovies
					.Concat(tmdbMovies)
					.GroupBy(m => m.Title.ToLower())
					.Select(g => g.First())
					.Take(cantidad)
					.ToList();

				if (combinedMovies.Any())
					return combinedMovies;

				return NotFound("No se encontraron películas mejor valoradas");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas mejor valoradas");
				return StatusCode(500, $"Error al obtener películas mejor valoradas: {ex.Message}");
			}
		}

		#endregion
	}
}
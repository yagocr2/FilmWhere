using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
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
        #region Métodos de Utilidad

        // Verificar si la base de datos está disponible
        private async Task<bool> IsDatabaseAvailableAsync()
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

        // Método para buscar solo en TMDB
        private async Task<ActionResult<List<MovieResponse>>> SearchOnlyTmdbAsync(string query, int page = 1)
        {
            try
            {
                var tmdbResponse = await _tmdbService.SearchMoviesAsync(query, page);

                if (tmdbResponse?.Results == null || !tmdbResponse.Results.Any())
                {
                    return NotFound("No se encontraron películas en TMDB");
                }

                var movies = tmdbResponse.Results
                    .Take(20)
                    .Select(m => new MovieResponse
                    {
                        Id = m.Id.ToString(),
                        Title = m.Title,
                        PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
                        Year = m.Release_Date.Year,
                        Rating = (decimal?)m.Vote_Average
                    })
                    .ToList();

                return movies;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error buscando en TMDB: {Query}", query);
                return StatusCode(500, "Error al buscar películas en TMDB");
            }
        }

        // Método para obtener populares solo de TMDB
        private async Task<ActionResult<List<PopularMovieResponse>>> GetPopularOnlyTmdbAsync(int page = 1, int cantidad = 28)
        {
            try
            {
                List<TmdbSearchResult> allMovies = new();
                int currentPage = page;
                bool hasMorePages = true;

                while (allMovies.Count < cantidad && hasMorePages && currentPage <= 3) // Limitar a 3 páginas
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
                    return NotFound("No se encontraron películas populares");

                var popularMovies = allMovies
                    .Take(cantidad)
                    .Select(m => new PopularMovieResponse
                    {
                        Id = m.Id.ToString(),
                        Title = m.Title,
                        PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
                        Year = m.Release_Date.Year,
                        Rating = (decimal?)m.Vote_Average
                    })
                    .ToList();

                return popularMovies;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo populares de TMDB");
                return StatusCode(500, "Error al obtener películas populares de TMDB");
            }
        }

        #endregion

        #region Obtener Película por ID

        // Obtener película específica por ID
        [HttpGet("{id}")]
        public async Task<ActionResult<MovieResponse>> GetMovieById(int id)
        {
            try
            {
                // Verificar disponibilidad de la base de datos
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (dbAvailable)
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

                    if (movie != null)
                        return movie;
                }

                // Si no hay película en la base de datos o la BD no está disponible, usar TMDB
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
                            Year = m.Release_Date.Year,
                            Rating = (decimal?)m.Vote_Average
                        })
                        .FirstOrDefault();

                    if (tmdbMovie != null)
                        return tmdbMovie;
                }

                // Como último recurso, intentar obtener detalles específicos de TMDB
                var movieDetails = await _tmdbService.GetMovieDetailsAsync(id);
                if (movieDetails != null)
                {
                    return new MovieResponse
                    {
                        Id = movieDetails.Id.ToString(),
                        Title = movieDetails.Title,
                        PosterUrl = $"https://image.tmdb.org/t/p/w500/{movieDetails.Poster_Path}",
                        Year = movieDetails.GetReleaseDate()?.Year ?? 0
                    };
                }

                return NotFound($"No se encontró película con ID {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener película por ID {Id}", id);
                return StatusCode(500, $"Error al obtener película por ID: {ex.Message}");
            }
        }

        #endregion

        #region Búsquedas

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

                if (page > 2) page = 2;

                // Verificar disponibilidad de la base de datos
                bool dbAvailable = await IsDatabaseAvailableAsync();

                List<MovieResponse> localResults = new();

                if (dbAvailable)
                {
                    try
                    {
                        // Buscar en la base de datos local
                        localResults = await _context.Peliculas
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
                    return await SearchOnlyTmdbAsync(query, page);
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
                            .Select(m => new MovieResponse
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

        [HttpGet("sugerencias")]
        public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return new List<string>();
                }

                bool dbAvailable = await IsDatabaseAvailableAsync();

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

                bool dbAvailable = await IsDatabaseAvailableAsync();

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
                            .Select(p => new MovieResponse
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
                    return await SearchOnlyTmdbAsync(title, page);
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

        [HttpGet("genero/{genreName}")]
        public async Task<ActionResult<List<MovieResponse>>> GetMoviesByGenre(string genreName, int cantidad = 15)
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (dbAvailable)
                {
                    try
                    {
                        var genre = await _context.Generos
                            .FirstOrDefaultAsync(g => g.Nombre.ToLower() == genreName.ToLower());

                        if (genre != null)
                        {
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

                            if (movies.Any())
                                return movies;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error obteniendo películas por género de BD local");
                    }
                }

                // Respaldo: obtener películas populares de TMDB (sin filtro de género específico)
                _logger.LogInformation("Usando respaldo TMDB para género {GenreName}", genreName);
                var popularMovies = await GetPopularOnlyTmdbAsync(1, cantidad);

                if (popularMovies.Value != null)
                {
                    return Ok(popularMovies.Value);
                }

                return NotFound($"No se encontraron películas para el género '{genreName}'");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener películas por género {GenreName}", genreName);
                return StatusCode(500, $"Error al obtener películas: {ex.Message}");
            }
        }

        [HttpGet("generos")]
        public async Task<ActionResult<List<GenreResponse>>> GetAvailableGenres()
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (dbAvailable)
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

                        if (genres.Any())
                            return genres;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error obteniendo géneros de BD local");
                    }
                }

                // Respaldo: géneros básicos predefinidos
                var defaultGenres = new List<GenreResponse>
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

        [HttpGet("estrenos")]
        public async Task<ActionResult<List<MovieResponse>>> GetRecentReleases(int año = 0, int cantidad = 15)
        {
            try
            {
                int targetYear = año > 0 ? año : DateTime.Now.Year;
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (dbAvailable)
                {
                    try
                    {
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

                        if (recentMovies.Any())
                            return recentMovies;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error obteniendo estrenos de BD local");
                    }
                }

                // Respaldo con TMDB
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
                            Year = m.Release_Date.Year,
                            Rating = (decimal?)m.Vote_Average
                        })
                        .ToList();

                    if (popularMovies.Any())
                        return popularMovies;
                }

                return NotFound($"No se encontraron estrenos para el año {targetYear}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener películas recientes");
                return StatusCode(500, $"Error al obtener estrenos: {ex.Message}");
            }
        }

        [HttpGet("populares")]
        public async Task<ActionResult<List<PopularMovieResponse>>> GetPopularMovies(int page = 1, int year = 0, int cantidad = 0)
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();

                // Si se solicita un año específico, buscar en la base de datos
                if (year > 0 && dbAvailable)
                {
                    try
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
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error obteniendo populares de BD local");
                    }
                }

                // Usar TMDB como fuente principal o respaldo
                return await GetPopularOnlyTmdbAsync(page, cantidad > 0 ? cantidad : 28);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener películas populares");
                return StatusCode(500, "Error al obtener películas populares");
            }
        }

        [HttpGet("mejor-valoradas")]
        public async Task<ActionResult<List<MovieResponse>>> GetTopRatedMovies(
            [FromQuery] int page = 1,
            [FromQuery] int cantidad = 20,
            [FromQuery] int? year = null)
        {
            try
            {
                int skip = (page - 1) * cantidad;
                bool dbAvailable = await IsDatabaseAvailableAsync();

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

                        var topRatedMovies = await query
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
                            .Select(x => new MovieResponse
                            {
                                Id = x.Pelicula.Id,
                                Title = x.Pelicula.Titulo,
                                PosterUrl = $"https://image.tmdb.org/t/p/w500/{x.Pelicula.PosterUrl}",
                                Year = x.Pelicula.Año ?? 0,
                                Rating = x.PromedioCalificacion
                            })
                            .ToListAsync();

                        if (topRatedMovies.Any())
                            return topRatedMovies;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error obteniendo mejor valoradas de BD local");
                    }
                }

                // Respaldo con películas populares de TMDB
                _logger.LogInformation("Usando respaldo TMDB para mejor valoradas");
                var popularResult = await GetPopularOnlyTmdbAsync(page, cantidad);

                if (popularResult.Value != null)
                {
                    var tmdbMovies = popularResult.Value.Select(p => new MovieResponse
                    {
                        Id = p.Id,
                        Title = p.Title,
                        PosterUrl = p.PosterUrl,
                        Year = p.Year,
                        Rating = p.Rating
                    }).ToList();

                    return tmdbMovies;
                }

                return NotFound("No se encontraron películas valoradas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener películas mejor valoradas");
                return StatusCode(500, $"Error al obtener películas mejor valoradas: {ex.Message}");
            }
        }

        #endregion

        #region Sincronización y Administración

        [HttpPost("sincronizar/{year}")]
        public async Task<ActionResult> SyncPopularMoviesByYear(int year)
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (!dbAvailable)
                {
                    return BadRequest("Base de datos no disponible para sincronización");
                }

                if (year < 1900 || year > DateTime.Now.Year)
                    return BadRequest("Año inválido");

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

        [HttpDelete("limpiar/{year}")]
        public async Task<ActionResult> PurgeMoviesByYear(int year)
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();

                if (!dbAvailable)
                {
                    return BadRequest("Base de datos no disponible para operaciones de limpieza");
                }

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

        #region Detalle
        [HttpGet("detalle/{id}")]
        public async Task<ActionResult<MovieDetailResponse>> GetMovieDetails(string id)
        {
            try
            {
                bool dbAvailable = await IsDatabaseAvailableAsync();
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
                            var movieDetail = new MovieDetailResponse
                            {
                                Id = localMovie.Id,
                                Title = localMovie.Titulo,
                                PosterUrl = $"https://image.tmdb.org/t/p/w500/{localMovie.PosterUrl}",
                                Year = localMovie.Año ?? 0,
                                Rating = localMovie.Reseñas.Any()
                                    ? Math.Round(localMovie.Reseñas.Average(r => r.Calificacion), 1)
                                    : null,
                                Genres = localMovie.Generos.Select(pg => pg.Genero.Nombre).ToList(),
                                Platforms = localMovie.Plataformas.Select(pp => new PlatformInfo
                                {
                                    Name = pp.Plataforma.Nombre,
                                    Type = pp.Plataforma.Tipo.ToString(),
                                    Price = pp.Precio,
                                    Url = pp.Plataforma.Enlace
                                }).ToList(),
                                Reviews = localMovie.Reseñas.OrderByDescending(r => r.Fecha).Take(5).Select(r => new ReviewInfo
                                {
                                    Id = r.Id,
                                    Comment = r.Comentario,
                                    Rating = r.Calificacion,
                                    Date = r.Fecha,
                                    UserName = r.Usuario.UserName
                                }).ToList(),
                                ReviewCount = localMovie.Reseñas.Count,
                                TmdbId = localMovie.IdApiTmdb
                            };

                            return movieDetail;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al obtener los detalles de la pelicula");
                        return StatusCode(500, $"Error al obtener detalles: {ex.Message}");
                    }
                }

                // Si no está en la base de datos local, intentar obtener información básica de TMDB
                if (int.TryParse(id, out int tmdbId))
                {
                    var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(1);
                    var tmdbMovie = tmdbResponse?.Results?.FirstOrDefault(m => m.Id == tmdbId);

                    if (tmdbMovie != null)
                    {
                        var basicMovieDetail = new MovieDetailResponse
                        {
                            Id = tmdbMovie.Id.ToString(),
                            Title = tmdbMovie.Title,
                            PosterUrl = $"https://image.tmdb.org/t/p/w500/{tmdbMovie.Poster_Path}",
                            Year = tmdbMovie.Release_Date.Year,
                            Rating = (decimal?)tmdbMovie.Vote_Average,
                            Genres = new List<string>(),
                            Platforms = new List<PlatformInfo>(),
                            Reviews = new List<ReviewInfo>(),
                            ReviewCount = 0,
                            TmdbId = tmdbMovie.Id
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
    }

    #region DTOs
    public class MovieDetailResponse
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string PosterUrl { get; set; }
        public int Year { get; set; }
        public decimal? Rating { get; set; }
        public List<string> Genres { get; set; } = new List<string>();
        public List<PlatformInfo> Platforms { get; set; } = new List<PlatformInfo>();
        public List<ReviewInfo> Reviews { get; set; } = new List<ReviewInfo>();
        public int ReviewCount { get; set; }
        public int TmdbId { get; set; }
    }

    public class PlatformInfo
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public decimal Price { get; set; }
        public string Url { get; set; }
    }

    public class ReviewInfo
    {
        public string Id { get; set; }
        public string Comment { get; set; }
        public decimal Rating { get; set; }
        public DateTime Date { get; set; }
        public string UserName { get; set; }
    }
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
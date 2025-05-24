using FilmWhere.Context;
using FilmWhere.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/")]
	public class PeliculasController : ControllerBase
	{
		private readonly TmdbService _tmdbService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculasGeneroController> _logger;

		public PeliculasController(
			TmdbService tmdbService,
			MyDbContext context,
			ILogger<PeliculasGeneroController> logger)
		{
			_tmdbService = tmdbService;
			_context = context;
			_logger = logger;
		}
		// Obtener películas recién estrenadas
		[HttpGet("pelicula/{id}")]
		public async Task<ActionResult<List<MovieResponse>>> GetMoviesById(int id)
		{
			try
			{

				var movie = await _context.Peliculas
					.Where(p => p.IdApiTmdb == id)
					.Take(1)
					.Select(p => new MovieResponse
					{
						Id = p.Id,
						Title = p.Titulo,
						PosterUrl = $"https://image.tmdb.org/t/p/w500/{p.PosterUrl}",
						Year = p.Año ?? 0
					})
					.ToListAsync();

				if (!movie.Any())
				{
					// Si no hay películas en la base de datos para el año actual, intentar obtener de TMDB
					var tmdbResponse = await _tmdbService.GetPopularMoviesAsync(1);
					if (tmdbResponse != null && tmdbResponse.Results.Any())
					{
						movie = tmdbResponse.Results
							.Where(m => m.Id == id)
							.Take(1)
							.Select(m => new MovieResponse
							{
								Id = m.Id.ToString(),
								Title = m.Title,
								PosterUrl = $"https://image.tmdb.org/t/p/w500/{m.Poster_Path}",
								Year = m.Release_Date.Year
							})
							.ToList();

						return movie;
					}

					return NotFound($"No se encontro id {id}");
				}

				return movie;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener películas por id");
				return StatusCode(500, $"Error al obtener peliculas por id: {ex.Message}");
			}
		}
		[HttpGet("SearchMovies")]
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
				if (page > 2)
				{
					page = 2;
				}

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
					.Take(20 - localResults.Count) // Completar hasta 20 total
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

		// Endpoint para obtener sugerencias de búsqueda
		[HttpGet("SearchSuggestions")]
		public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string query)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
				{
					return new List<string>();
				}

				// Buscar sugerencias en la base de datos local
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

		// Endpoint para búsqueda avanzada con filtros
		[HttpGet("AdvancedSearch")]
		public async Task<ActionResult<List<MovieResponse>>> AdvancedSearch(
			[FromQuery] string? title,
			[FromQuery] int? year,
			[FromQuery] string? genre,
			[FromQuery] int page = 1)
		{
			try
			{
				if (page > 2) page = 2; // Limitar a máximo 2 páginas

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
	}
}

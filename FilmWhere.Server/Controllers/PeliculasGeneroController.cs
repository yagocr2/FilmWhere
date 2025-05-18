using FilmWhere.Context;
using FilmWhere.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class PeliculasGeneroController : ControllerBase
	{
		private readonly TmdbService _tmdbService;
		private readonly MyDbContext _context;
		private readonly ILogger<PeliculasGeneroController> _logger;

		public PeliculasGeneroController(
			TmdbService tmdbService,
			MyDbContext context,
			ILogger<PeliculasGeneroController> logger)
		{
			_tmdbService = tmdbService;
			_context = context;
			_logger = logger;
		}

		// Obtener películas por género
		[HttpGet("{genreName}")]
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

		// Obtener películas recién estrenadas
		[HttpGet("estrenos")]
		public async Task<ActionResult<List<MovieResponse>>> GetRecentReleases(int año = 0, int cantidad = 15)
		{
			try
			{
				int targetYear = año > 0 ? año : DateTime.Now.Year;

				var recentMovies = await _context.Peliculas
					.Where(p => p.Año == targetYear)
					.OrderByDescending(p => p.Id) // Ordenar por ID (asumiendo que IDs más recientes son más altos)
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
					// Si no hay películas en la base de datos para el año actual, intentar obtener de TMDB
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
	}

	// DTOs
	public class MovieResponse
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
}

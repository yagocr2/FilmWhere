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
	}
}

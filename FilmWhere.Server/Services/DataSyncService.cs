using FilmWhere.Context;
using FilmWhere.Models;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Models.Plataforma;

namespace FilmWhere.Services
{
	public class DataSyncService
	{
		private readonly MyDbContext _context;
		private readonly TmdbService _tmdbService;
		private readonly WatchModeService _watchModeService;
		private readonly ILogger<DataSyncService> _logger;

		// Inyectar dependencias en el constructor
		public DataSyncService(MyDbContext context, TmdbService tmdbService,
			WatchModeService watchModeService, ILogger<DataSyncService> logger)
		{
			_context = context;
			_tmdbService = tmdbService;
			_watchModeService = watchModeService;
			_logger = logger;
		}
		private async Task ProcessGenerosAsync(List<TmdbService.TmdbGenre> genresFromTmdb, Pelicula pelicula)
		{
			// Buscar géneros existentes por nombre
			var existingGeneros = await _context.Generos
				.Where(g => genresFromTmdb.Select(tg => tg.Name).Contains(g.Nombre))
				.ToListAsync();

			// Crear nuevos géneros si no existen
			var newGeneros = genresFromTmdb
				.Where(tg => !existingGeneros.Any(eg => eg.Nombre == tg.Name))
				.Select(tg => new Genero
				{
					Id = tg.Id.ToString(), // Convertir a string
					Nombre = tg.Name
				})
				.ToList();

			await _context.Generos.AddRangeAsync(newGeneros);
			await _context.SaveChangesAsync();

			// Relacionar con PeliculaGenero
			var allGeneros = existingGeneros.Concat(newGeneros).ToList();
			foreach (var genero in allGeneros)
			{
				if (!_context.PeliculaGeneros.Any(pg =>
					    pg.PeliculaId == pelicula.Id && pg.GeneroId == genero.Id))
				{
					_context.PeliculaGeneros.Add(new PeliculaGenero
					{
						PeliculaId = pelicula.Id,
						GeneroId = genero.Id
					});
				}
			}
		}
		private async Task ProcessPlatformsAsync(List<WatchModeService.WatchModePlatform> platforms, Pelicula pelicula)
		{
			// Filtrar plataformas nuevas
			var existingPlatforms = await _context.Plataformas
				.Where(p => platforms.Select(wmp => wmp.Name).Contains(p.Nombre))
				.ToListAsync();

			var newPlatforms = platforms
				.Where(wmp => !existingPlatforms.Any(ep => ep.Nombre == wmp.Name))
				.Select(wmp => new Plataforma
				{
					Nombre = wmp.Name,
					Enlace = wmp.WebUrl,
					Tipo = MapPlatformType(wmp.Type)
				}).ToList();

			// Guardar nuevas plataformas
			await _context.Plataformas.AddRangeAsync(newPlatforms);
			await _context.SaveChangesAsync();

			// Crear relaciones
			var allPlatforms = existingPlatforms.Concat(newPlatforms).ToList();
			foreach (var plataforma in allPlatforms)
			{
				if (!_context.PeliculaPlataformas.Any(pp =>
					    pp.PeliculaId == pelicula.Id && pp.PlataformaId == plataforma.Id))
				{
					var precio = await _watchModeService.GetPlatformPricingAsync(plataforma.Nombre);
					_context.PeliculaPlataformas.Add(new PeliculaPlataforma
					{
						Pelicula = pelicula,
						Plataforma = plataforma,
						Precio = precio ?? 0
					});
				}
			}
		}
		public async Task SyncMovieByTitleAsync(string movieTitle, string region = "ES")
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				// Buscar en TMDB
				var searchResult = await _tmdbService.SearchMoviesAsync(movieTitle);
				var tmdbId = searchResult?.Results.FirstOrDefault()?.Id;

				if (!tmdbId.HasValue)
				{
					_logger.LogWarning("Pelicula no encontrada en TMDB: {Title}", movieTitle);
					return;
				}

				// Obtener detalles completos
				var movieDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId.Value);
				if (movieDetails == null) return;

				// Mapear a entidad Pelicula
				var pelicula = new Pelicula
				{
					Id = tmdbId.Value.ToString(),
					Titulo = movieDetails.Title,
					Año = movieDetails.GetReleaseDate()?.Year,
					IdApiTmdb = tmdbId.Value,
				};
				// Guardar o actualizar película
				await ProcessGenerosAsync(movieDetails.Genres, pelicula);

				// Guardar película
				await _context.Peliculas.AddAsync(pelicula);
				await _context.SaveChangesAsync();

				// Obtener plataformas
				var plataformas = await _watchModeService.GetStreamingSourcesAsync(tmdbId.Value, region);
				await ProcessPlatformsAsync(plataformas, pelicula);

				await transaction.CommitAsync();
				_logger.LogInformation("Sincronizado: {Titulo}", pelicula.Titulo);
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, "Error sincronizando {Title}", movieTitle);
				throw;
			}
		}

		public class SyncException : Exception
		{
			public SyncException(string message, Exception inner)
				: base(message, inner) { }
		}
		private TipoPlataforma MapPlatformType(string watchModeType)
		{
			return watchModeType switch
			{
				"sub" => TipoPlataforma.Suscripción,
				"rent" => TipoPlataforma.Alquiler,
				"buy" => TipoPlataforma.Compra,
				_ => TipoPlataforma.Otro // Valor por defecto
			};
		}
	}
}

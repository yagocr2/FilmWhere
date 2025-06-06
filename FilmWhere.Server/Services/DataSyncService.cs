using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Server.DTOs;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Models.Plataforma;
using static FilmWhere.Server.DTOs.TmdbDTO;

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
		private async Task ProcessGenerosAsync(List<TmdbGenre> genresFromTmdb, Pelicula pelicula)
		{
			var existingGeneros = await _context.Generos
				.Where(g => genresFromTmdb.Select(tg => tg.Name).Contains(g.Nombre))
				.ToListAsync();

			var newGeneros = genresFromTmdb
				.Where(tg => !existingGeneros.Any(eg => eg.Nombre == tg.Name))
				.Select(tg => new Genero { Id = tg.Id.ToString(), Nombre = tg.Name })
				.ToList();

			if (newGeneros.Any())
			{
				await _context.Generos.AddRangeAsync(newGeneros);
				await _context.SaveChangesAsync();
			}

			var allGeneros = existingGeneros.Concat(newGeneros);
			var peliculaGeneros = allGeneros
				.Where(g => !_context.PeliculaGeneros.Any(pg => pg.PeliculaId == pelicula.Id && pg.GeneroId == g.Id))
				.Select(g => new PeliculaGenero { PeliculaId = pelicula.Id, GeneroId = g.Id });

			_context.PeliculaGeneros.AddRange(peliculaGeneros);
		}

		private async Task ProcessPlatformsAsync(List<PlataformaDTO> platforms, Pelicula pelicula)
		{
			if (!platforms.Any()) return;

			var platformNames = platforms.Select(p => p.Name).ToList();
			var existingPlatforms = await _context.Plataformas
				.Where(p => platformNames.Contains(p.Nombre))
				.ToListAsync();

			var newPlatforms = await CreateNewPlatformsAsync(platforms, existingPlatforms);

			if (newPlatforms.Any())
			{
				await _context.Plataformas.AddRangeAsync(newPlatforms);
				await _context.SaveChangesAsync();
			}

			await CreatePlatformRelationsAsync(platforms, pelicula, existingPlatforms.Concat(newPlatforms));
		}
		private async Task<List<Plataforma>> CreateNewPlatformsAsync(List<PlataformaDTO> platforms,
			List<Plataforma> existingPlatforms)
		{
			var newPlatforms = new List<Plataforma>();

			foreach (var platform in platforms.Where(p =>
				!existingPlatforms.Any(ep => ep.Nombre.Equals(p.Name, StringComparison.OrdinalIgnoreCase))))
			{
				var platformDetails = await _watchModeService.GetPlatformDetailsAsync(platform.Id);
				newPlatforms.Add(new Plataforma
				{
					Id = platform.Id.ToString(),
					Nombre = platform.Name,
					Enlace = platform.Url ?? platformDetails?.WebUrl ?? "",
					Tipo = MapPlatformType(platform.Type)
				});
			}

			return newPlatforms;
		}
		private async Task CreatePlatformRelationsAsync(List<PlataformaDTO> platforms, Pelicula pelicula,
			IEnumerable<Plataforma> allPlatforms)
		{
			var newRelations = new List<PeliculaPlataforma>();
			var existingRelations = await _context.PeliculaPlataformas
				.Where(pp => pp.PeliculaId == pelicula.Id)
				.ToDictionaryAsync(pp => pp.PlataformaId);

			foreach (var platform in platforms)
			{
				var dbPlatform = allPlatforms.FirstOrDefault(p =>
					p.Nombre.Equals(platform.Name, StringComparison.OrdinalIgnoreCase));

				if (dbPlatform == null) continue;

				if (!existingRelations.ContainsKey(dbPlatform.Id))
				{
					newRelations.Add(new PeliculaPlataforma
					{
						PeliculaId = pelicula.Id,
						PlataformaId = dbPlatform.Id,
						Precio = platform.Price ?? await GetPlatformPriceAsync(platform.Id, platform.Type),
						Enlace = platform.Url ?? dbPlatform.Enlace
					});
				}
				else
				{
					var relation = existingRelations[dbPlatform.Id];
					var newPrice = platform.Price ?? await GetPlatformPriceAsync(platform.Id, platform.Type);
					if (newPrice != relation.Precio) relation.Precio = newPrice;
				}
			}

			if (newRelations.Any())
			{
				_context.PeliculaPlataformas.AddRange(newRelations);
				await _context.SaveChangesAsync();
			}
		}

		private async Task<decimal> GetPlatformPriceAsync(int platformId, string platformType)
		{
			try
			{
				var platformDetails = await _watchModeService.GetPlatformDetailsAsync(platformId);
				return platformDetails?.Price ?? GetDefaultPrice(platformType, platformDetails?.Name);
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Error obteniendo precio para {Platform}", platformId);
				return platformType == "free" ? 0m : 3.99m;
			}
		}
		
		private async Task<Pelicula> CreatePeliculaFromTmdbAsync(TmdbMovieDetails movieDetails)
		{
			var pelicula = new Pelicula
			{
				Id = movieDetails.Id.ToString(),
				Titulo = movieDetails.Title,
				Sinopsis = movieDetails.Overview,
				Año = movieDetails.GetReleaseDate()?.Year,
				IdApiTmdb = movieDetails.Id,
				PosterUrl = movieDetails.Poster_Path?.TrimStart('/')
			};

			await ProcessGenerosAsync(movieDetails.Genres, pelicula);
			await _context.Peliculas.AddAsync(pelicula);
			await _context.SaveChangesAsync();

			return pelicula;
		}
		public async Task SyncMovieByTmdbIdAsync(int tmdbId, string region = "ES")
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				var existingMovie = await _context.Peliculas.FirstOrDefaultAsync(p => p.IdApiTmdb == tmdbId);
				if (existingMovie != null)
				{
					await UpdateMoviePlatformsAsync(existingMovie, region);
					await transaction.CommitAsync();
					return;
				}

				var movieDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId);
				if (movieDetails == null)
				{
					_logger.LogWarning("No se pudieron obtener detalles de TMDB para ID: {TmdbId}", tmdbId);
					return;
				}

				var pelicula = await CreatePeliculaFromTmdbAsync(movieDetails);
				var plataformas = await _watchModeService.GetStreamingSourcesAsync(tmdbId, region);
				await ProcessPlatformsAsync(plataformas, pelicula);

				await transaction.CommitAsync();
				_logger.LogInformation("Película sincronizada: {Title} con {Count} plataformas",
					pelicula.Titulo, plataformas.Count);
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, "Error sincronizando película por TMDB ID: {TmdbId}", tmdbId);
				throw new SyncException($"Error sincronizando película con TMDB ID '{tmdbId}'", ex);
			}
		}
		public async Task SyncMovieByTitleAsync(string movieTitle, string region = "ES")
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				var existingMovie = await _context.Peliculas
					.FirstOrDefaultAsync(p => p.Titulo.ToLower() == movieTitle.ToLower());

				if (existingMovie != null)
				{
					await UpdateMoviePlatformsAsync(existingMovie, region);
					await transaction.CommitAsync();
					return;
				}

				var searchResult = await _tmdbService.SearchMoviesAsync(movieTitle);
				var tmdbMovie = searchResult?.Results?.FirstOrDefault();
				if (tmdbMovie == null)
				{
					_logger.LogWarning("Película no encontrada en TMDB: {Title}", movieTitle);
					return;
				}

				await SyncMovieByTmdbIdAsync(tmdbMovie.Id, region);
				await transaction.CommitAsync();
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, "Error sincronizando película: {Title}", movieTitle);
				throw new SyncException($"Error sincronizando '{movieTitle}'", ex);
			}
		}
		public async Task UpdateMoviePlatformsAsync(Pelicula pelicula, string region = "ES")
		{
			if (pelicula.IdApiTmdb == null) return;

			var plataformas = await _watchModeService.GetStreamingSourcesAsync(pelicula.IdApiTmdb, region);
			await ProcessPlatformsAsync(plataformas, pelicula);
			await _context.SaveChangesAsync();
		}
		public async Task<bool> IsMovieSyncedAsync(string peliculaId) =>
			await _context.Peliculas.AnyAsync(p => p.Id == peliculaId);

		public async Task<List<Pelicula>> GetMostReviewedMoviesAsync(int limit = 50)
		{
			var mostReviewed = await _context.Reseñas
				.GroupBy(r => r.PeliculaId)
				.OrderByDescending(g => g.Count())
				.Take(limit)
				.Select(g => g.Key)
				.ToListAsync();

			return await _context.Peliculas
				.Include(p => p.Reseñas)
				.Where(p => mostReviewed.Contains(p.Id))
				.ToListAsync();
		}
        private decimal GetDefaultPrice(string platformType, string platformName) =>
            platformType switch
            {
                "free" => 0m,
                "sub" => GetDefaultSubscriptionPrice(platformName),
                "rent" => 3.99m,
                "buy" => 9.99m,
                _ => 0m
            };
        private decimal GetDefaultSubscriptionPrice(string platformName)
        {
            return platformName.ToLower() switch
            {
                "netflix" => 12.99m,
                "amazon prime video" => 8.99m,
                "disney+" => 8.99m,
                "hbo max" => 9.99m,
                "apple tv+" => 6.99m,
                "paramount+" => 7.99m,
                _ => 9.99m // Precio genérico
            };
        }
        private TipoPlataforma MapPlatformType(string watchModeType)
		{
			return watchModeType switch
			{
				"free" => TipoPlataforma.Gratis, // "free" puede ser considerado como Otro
				"sub" => TipoPlataforma.Suscripción,
				"rent" => TipoPlataforma.Alquiler,
				"buy" => TipoPlataforma.Compra,
				_ => TipoPlataforma.Otro // Valor por defecto
			};
		}
		public class SyncException : Exception
		{
			public SyncException(string message, Exception inner)
				: base(message, inner) { }
		}
	}
}

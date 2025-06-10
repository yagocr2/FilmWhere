using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Server.DTOs;
using Microsoft.EntityFrameworkCore;
using static FilmWhere.Models.PeliculaPlataforma;
using static FilmWhere.Models.Plataforma;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Services
{
	/// <summary>
	/// Servicio encargado de sincronizar datos de películas entre las APIs externas (TMDB y WatchMode) y la base de datos local.
	/// Maneja la creación, actualización y sincronización de películas, géneros y plataformas de streaming.
	/// </summary>
	public class DataSyncService
	{
		private readonly MyDbContext _context;
		private readonly TmdbService _tmdbService;
		private readonly WatchModeService _watchModeService;
		private readonly ILogger<DataSyncService> _logger;

		/// <summary>
		/// Constructor del servicio de sincronización de datos.
		/// </summary>
		/// <param name="context">Contexto de la base de datos</param>
		/// <param name="tmdbService">Servicio para interactuar con la API de TMDB</param>
		/// <param name="watchModeService">Servicio para interactuar con la API de WatchMode</param>
		/// <param name="logger">Logger para registrar eventos y errores</param>
		public DataSyncService(MyDbContext context, TmdbService tmdbService,
			WatchModeService watchModeService, ILogger<DataSyncService> logger)
		{
			_context = context;
			_tmdbService = tmdbService;
			_watchModeService = watchModeService;
			_logger = logger;
		}

		#region Métodos Públicos

		/// <summary>
		/// Sincroniza una película específica utilizando su ID de TMDB.
		/// Si la película ya existe, actualiza sus plataformas; si no existe, la crea con todos sus datos.
		/// </summary>
		/// <param name="tmdbId">ID de la película en TMDB</param>
		/// <param name="region">Región para obtener plataformas disponibles, por defecto "ES"</param>
		/// <exception cref="SyncException">Se lanza cuando ocurre un error durante la sincronización</exception>
		public async Task SyncMovieByTmdbIdAsync(int tmdbId, string region = "ES")
		{
			await ExecuteInTransactionAsync(async () =>
			{
				var existingMovie = await _context.Peliculas.FirstOrDefaultAsync(p => p.IdApiTmdb == tmdbId);
				if (existingMovie != null)
				{
					await UpdateMoviePlatformsAsync(existingMovie, region);
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

				_logger.LogInformation("Película sincronizada: {Title} con {Count} plataformas",
					pelicula.Titulo, plataformas.Count);
			}, $"Error sincronizando película con TMDB ID '{tmdbId}'");
		}

		/// <summary>
		/// Actualiza las plataformas de streaming disponibles para una película existente.
		/// </summary>
		/// <param name="pelicula">Película a actualizar</param>
		/// <param name="region">Región para obtener plataformas disponibles, por defecto "ES"</param>
		public async Task UpdateMoviePlatformsAsync(Pelicula pelicula, string region = "ES")
		{
			if (pelicula.IdApiTmdb == null) return;

			var plataformas = await _watchModeService.GetStreamingSourcesAsync(pelicula.IdApiTmdb, region);
			await ProcessPlatformsAsync(plataformas, pelicula);
			await _context.SaveChangesAsync();
		}

		/// <summary>
		/// Verifica si una película específica ya está sincronizada en la base de datos.
		/// </summary>
		/// <param name="peliculaId">ID de la película a verificar</param>
		/// <returns>True si la película existe en la base de datos, false en caso contrario</returns>
		public async Task<bool> IsMovieSyncedAsync(string peliculaId) =>
			await _context.Peliculas.AnyAsync(p => p.Id == peliculaId);

		/// <summary>
		/// Obtiene las películas con más reseñas de la base de datos.
		/// </summary>
		/// <param name="limit">Número máximo de películas a obtener, por defecto 50</param>
		/// <returns>Lista de películas ordenadas por número de reseñas descendente</returns>
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

		#endregion

		#region Métodos Privados - Procesamiento de Datos

		/// <summary>
		/// Procesa y sincroniza los géneros de una película con la base de datos.
		/// Crea nuevos géneros si no existen y establece las relaciones película-género.
		/// </summary>
		/// <param name="genresFromTmdb">Lista de géneros obtenidos de TMDB</param>
		/// <param name="pelicula">Película a la que se asociarán los géneros</param>
		private async Task ProcessGenerosAsync(List<TmdbGenre> genresFromTmdb, Pelicula pelicula)
		{
			var genreNames = genresFromTmdb.Select(g => g.Name).ToList();
			var existingGeneros = await _context.Generos
				.Where(g => genreNames.Contains(g.Nombre))
				.ToListAsync();

			await CreateMissingGenresAsync(genresFromTmdb, existingGeneros);
			await CreateGenreRelationsAsync(genresFromTmdb, pelicula, existingGeneros);
		}

		/// <summary>
		/// Procesa y sincroniza las plataformas de streaming para una película.
		/// Crea nuevas plataformas si no existen y establece las relaciones película-plataforma.
		/// </summary>
		/// <param name="platforms">Lista de plataformas obtenidas de WatchMode</param>
		/// <param name="pelicula">Película a la que se asociarán las plataformas</param>
		private async Task ProcessPlatformsAsync(List<PlataformaDTO> platforms, Pelicula pelicula)
		{
			if (!platforms.Any()) return;

			var platformNames = platforms.Select(p => p.Name).ToList();
			var existingPlatforms = await _context.Plataformas
				.Where(p => platformNames.Contains(p.Nombre))
				.ToListAsync();

			var newPlatforms = await CreateMissingPlatformsAsync(platforms, existingPlatforms);
			await CreatePlatformRelationsAsync(platforms, pelicula, existingPlatforms.Concat(newPlatforms));
		}

		/// <summary>
		/// Crea una nueva película en la base de datos a partir de los detalles obtenidos de TMDB.
		/// </summary>
		/// <param name="movieDetails">Detalles de la película obtenidos de TMDB</param>
		/// <returns>La película creada y guardada en la base de datos</returns>
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

		#endregion

		#region Métodos Privados - Helpers

		/// <summary>
		/// Crea los géneros que no existen en la base de datos.
		/// </summary>
		/// <param name="genresFromTmdb">Géneros obtenidos de TMDB</param>
		/// <param name="existingGeneros">Géneros que ya existen en la base de datos</param>
		private async Task CreateMissingGenresAsync(List<TmdbGenre> genresFromTmdb, List<Genero> existingGeneros)
		{
			var newGeneros = genresFromTmdb
				.Where(tg => !existingGeneros.Any(eg => eg.Nombre == tg.Name))
				.Select(tg => new Genero { Id = tg.Id.ToString(), Nombre = tg.Name })
				.ToList();

			if (newGeneros.Any())
			{
				await _context.Generos.AddRangeAsync(newGeneros);
				await _context.SaveChangesAsync();
				existingGeneros.AddRange(newGeneros);
			}
		}

		/// <summary>
		/// Crea las relaciones entre película y géneros que no existen.
		/// </summary>
		/// <param name="genresFromTmdb">Géneros obtenidos de TMDB</param>
		/// <param name="pelicula">Película a asociar</param>
		/// <param name="allGeneros">Todos los géneros disponibles en la base de datos</param>
		private async Task CreateGenreRelationsAsync(List<TmdbGenre> genresFromTmdb, Pelicula pelicula, List<Genero> allGeneros)
		{
			var genreNames = genresFromTmdb.Select(g => g.Name).ToList();
			var existingRelations = await _context.PeliculaGeneros
				.Where(pg => pg.PeliculaId == pelicula.Id)
				.Select(pg => pg.GeneroId)
				.ToListAsync();

			var newRelations = allGeneros
				.Where(g => genreNames.Contains(g.Nombre) && !existingRelations.Contains(g.Id))
				.Select(g => new PeliculaGenero { PeliculaId = pelicula.Id, GeneroId = g.Id });

			_context.PeliculaGeneros.AddRange(newRelations);
		}

		/// <summary>
		/// Crea las plataformas que no existen en la base de datos.
		/// </summary>
		/// <param name="platforms">Plataformas obtenidas de WatchMode</param>
		/// <param name="existingPlatforms">Plataformas que ya existen en la base de datos</param>
		/// <returns>Lista de nuevas plataformas creadas</returns>
		private async Task<List<Plataforma>> CreateMissingPlatformsAsync(List<PlataformaDTO> platforms, List<Plataforma> existingPlatforms)
		{
			var newPlatforms = new List<Plataforma>();

			foreach (var platform in platforms.Where(p =>
				!existingPlatforms.Any(ep => ep.Nombre.Equals(p.Name, StringComparison.OrdinalIgnoreCase))))
			{
				var platformDetails = await _watchModeService.GetPlatformDetailsAsync(platform.Id);
				newPlatforms.Add(new Plataforma
				{
					Id = platform.Id.ToString(),
					Nombre = platform.Name
				});
			}

			if (newPlatforms.Any())
			{
				await _context.Plataformas.AddRangeAsync(newPlatforms);
				await _context.SaveChangesAsync();
			}

			return newPlatforms;
		}

		/// <summary>
		/// Crea o actualiza las relaciones entre película y plataformas.
		/// </summary>
		/// <param name="platforms">Plataformas obtenidas de WatchMode</param>
		/// <param name="pelicula">Película a asociar</param>
		/// <param name="allPlatforms">Todas las plataformas disponibles en la base de datos</param>
		private async Task CreatePlatformRelationsAsync(List<PlataformaDTO> platforms, Pelicula pelicula, IEnumerable<Plataforma> allPlatforms)
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

				var newPrice = platform.Price ?? await GetPlatformPriceAsync(platform.Id, platform.Type);
				_logger.LogInformation("Procesando plataforma {Platform} de tipo {Type}",
					platform.Name, platform.Type);

				if (!existingRelations.ContainsKey(dbPlatform.Id))
				{
					newRelations.Add(new PeliculaPlataforma
					{
						PeliculaId = pelicula.Id,
						PlataformaId = dbPlatform.Id,
						Precio = newPrice,
						Enlace = platform.Url,
						Tipo = MapPlatformType(platform.Type)
					});
				}
				else
				{
					var relation = existingRelations[dbPlatform.Id];
					if (newPrice != relation.Precio)
						relation.Precio = newPrice;
				}
			}

			if (newRelations.Any())
			{
				_context.PeliculaPlataformas.AddRange(newRelations);
				await _context.SaveChangesAsync();
			}
		}

		/// <summary>
		/// Obtiene el precio de una plataforma, ya sea desde la API o usando valores por defecto.
		/// </summary>
		/// <param name="platformId">ID de la plataforma</param>
		/// <param name="platformType">Tipo de plataforma (free, sub, rent, buy)</param>
		/// <returns>Precio de la plataforma</returns>
		private async Task<decimal> GetPlatformPriceAsync(int platformId, string platformType)
		{
			try
			{
				var platformDetails = await _watchModeService.GetPlatformDetailsAsync(platformId);
				return platformDetails?.Price ?? GetDefaultPrice(platformType, platformDetails?.Name);
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Error obteniendo precio para plataforma {Platform}", platformId);
				return GetDefaultPrice(platformType, null);
			}
		}

		/// <summary>
		/// Ejecuta una operación dentro de una transacción de base de datos con manejo de errores.
		/// </summary>
		/// <param name="operation">Operación a ejecutar</param>
		/// <param name="errorMessage">Mensaje de error personalizado</param>
		/// <exception cref="SyncException">Se lanza cuando la operación falla</exception>
		private async Task ExecuteInTransactionAsync(Func<Task> operation, string errorMessage)
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				await operation();
				await transaction.CommitAsync();
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, errorMessage);
				throw new SyncException(errorMessage, ex);
			}
		}

		#endregion

		#region Métodos Privados - Mapeo y Precios

		/// <summary>
		/// Obtiene el precio por defecto según el tipo de plataforma y nombre.
		/// </summary>
		/// <param name="platformType">Tipo de plataforma (free, sub, rent, buy)</param>
		/// <param name="platformName">Nombre de la plataforma (opcional)</param>
		/// <returns>Precio por defecto</returns>
		private decimal GetDefaultPrice(string platformType, string? platformName) =>
			platformType switch
			{
				"free" => 0m,
				"sub" => GetDefaultSubscriptionPrice(platformName),
				"rent" => 3.99m,
				"buy" => 9.99m,
				_ => 0m
			};

		/// <summary>
		/// Obtiene el precio por defecto de suscripción según el nombre de la plataforma.
		/// </summary>
		/// <param name="platformName">Nombre de la plataforma</param>
		/// <returns>Precio de suscripción por defecto</returns>
		private decimal GetDefaultSubscriptionPrice(string? platformName)
		{
			return platformName?.ToLower() switch
			{
				"netflix" => 12.99m,
				"amazon prime video" => 8.99m,
				"disney+" => 8.99m,
				"hbo max" => 9.99m,
				"apple tv+" => 6.99m,
				"paramount+" => 7.99m,
				_ => 9.99m
			};
		}

		/// <summary>
		/// Mapea el tipo de plataforma de WatchMode al enum interno de la aplicación.
		/// </summary>
		/// <param name="watchModeType">Tipo de plataforma de WatchMode</param>
		/// <returns>Tipo de plataforma mapeado al enum interno</returns>
		private TipoPlataforma MapPlatformType(string watchModeType) =>
			watchModeType switch
			{
				"Gratis" => TipoPlataforma.Gratis,
				"Suscripción" => TipoPlataforma.Suscripción,
				"Alquiler" => TipoPlataforma.Alquiler,
				"Compra" => TipoPlataforma.Compra,
				_ => TipoPlataforma.Otro
			};

		#endregion

		/// <summary>
		/// Excepción personalizada para errores de sincronización.
		/// </summary>
		public class SyncException : Exception
		{
			public SyncException(string message, Exception inner) : base(message, inner) { }
		}
	}
}
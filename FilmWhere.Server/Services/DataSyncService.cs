using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Server.DTOs;
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
		private async Task ProcessPlatformsAsync(List<PlataformaDTO> platforms, Pelicula pelicula)
		{
			if (!platforms.Any())
			{
				_logger.LogInformation("No hay plataformas disponibles para la película: {Title}", pelicula.Titulo);
				return;
			}

			_logger.LogInformation("Procesando {Count} plataformas para: {Title}", platforms.Count, pelicula.Titulo);

			try
			{
				// Obtener plataformas existentes
				var platformNames = platforms.Select(p => p.Name).ToList();
				var existingPlatforms = await _context.Plataformas
					.Where(p => platformNames.Contains(p.Nombre))
					.ToListAsync();

				// Crear nuevas plataformas que no existen
				var newPlatforms = new List<Plataforma>();
				foreach (var watchModePlatform in platforms)
				{
					if (!existingPlatforms.Any(ep => ep.Nombre.Equals(watchModePlatform.Name, StringComparison.OrdinalIgnoreCase)))
					{
						// Obtener detalles adicionales de la plataforma
						var platformDetails = await _watchModeService.GetPlatformDetailsAsync(watchModePlatform.Name);

						var newPlatform = new Plataforma
						{
							Nombre = watchModePlatform.Name,
							Enlace = !string.IsNullOrEmpty(watchModePlatform.Url)
								? watchModePlatform.Url
								: platformDetails?.WebUrl ?? "",
							Tipo = MapPlatformType(watchModePlatform.Type)
						};

						newPlatforms.Add(newPlatform);
						_logger.LogDebug("Nueva plataforma creada: {Name} ({Type})", newPlatform.Nombre, newPlatform.Tipo);
					}
				}

				// Guardar nuevas plataformas
				if (newPlatforms.Any())
				{
					await _context.Plataformas.AddRangeAsync(newPlatforms);
					await _context.SaveChangesAsync();
					_logger.LogInformation("Guardadas {Count} nuevas plataformas", newPlatforms.Count);
				}

				// Crear relaciones película-plataforma
				var allPlatforms = existingPlatforms.Concat(newPlatforms).ToList();
				var relationsAdded = 0;

				foreach (var platform in platforms)
				{
					var dbPlatform = allPlatforms.FirstOrDefault(p =>
						p.Nombre.Equals(platform.Name, StringComparison.OrdinalIgnoreCase));

					if (dbPlatform == null) continue;

					// Verificar si la relación ya existe
					var existingRelation = await _context.PeliculaPlataformas
						.FirstOrDefaultAsync(pp => pp.PeliculaId == pelicula.Id && pp.PlataformaId == dbPlatform.Id);

					if (existingRelation == null)
					{
						var peliculaPlataforma = new PeliculaPlataforma
						{
							PeliculaId = pelicula.Id,
							PlataformaId = dbPlatform.Id,
							Precio = platform.Price ?? await GetPlatformPriceAsync(platform.Name, platform.Type),
						};

						_context.PeliculaPlataformas.Add(peliculaPlataforma);
						relationsAdded++;
					}
					else
					{
						// Actualizar precio si es diferente
						var newPrice = platform.Price ?? await GetPlatformPriceAsync(platform.Name, platform.Type);
						if (newPrice != existingRelation.Precio)
						{
							existingRelation.Precio = newPrice;
							_logger.LogDebug("Precio actualizado para {Platform}: {OldPrice} -> {NewPrice}",
								platform.Name, existingRelation.Precio, newPrice);
						}
					}
				}

				if (relationsAdded > 0)
				{
					await _context.SaveChangesAsync();
					_logger.LogInformation("Creadas {Count} nuevas relaciones película-plataforma para: {Title}",
						relationsAdded, pelicula.Titulo);
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error procesando plataformas para: {Title}", pelicula.Titulo);
				throw;
			}
		}
		private async Task<decimal> GetPlatformPriceAsync(string platformName, string platformType)
		{
			try
			{
				var platformDetails = await _watchModeService.GetPlatformDetailsAsync(platformName);

				if (platformDetails?.Price.HasValue == true)
				{
					return platformDetails.Price.Value;
				}

				// Precios por defecto basados en el tipo
				return platformType switch
				{
					"free" => 0m,
					"sub" => GetDefaultSubscriptionPrice(platformName),
					"rent" => 3.99m,
					"buy" => 9.99m,
					_ => 0m
				};
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Error obteniendo precio para {Platform}, usando precio por defecto", platformName);
				return platformType == "free" ? 0m : 3.99m;
			}
		}
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
		public async Task SyncMovieByTmdbIdAsync(int tmdbId, string region = "ES")
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				_logger.LogInformation("Iniciando sincronización para TMDB ID: {TmdbId}", tmdbId);

				// 1. Verificar si la película ya existe
				var existingMovie = await _context.Peliculas
					.FirstOrDefaultAsync(p => p.IdApiTmdb == tmdbId);

				if (existingMovie != null)
				{
					_logger.LogInformation("Película ya existe, actualizando plataformas: TMDB ID {TmdbId}", tmdbId);
					await UpdateMoviePlatformsAsync(existingMovie, region);
					await transaction.CommitAsync();
					return;
				}

				// 2. Obtener detalles de TMDB
				var movieDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId);
				if (movieDetails == null)
				{
					_logger.LogWarning("No se pudieron obtener detalles de TMDB para ID: {TmdbId}", tmdbId);
					return;
				}

				// 3. Crear película
				var pelicula = new Pelicula
				{
					Id = tmdbId.ToString(),
					Titulo = movieDetails.Title,
					Sinopsis = movieDetails.Overview,
					Año = movieDetails.GetReleaseDate()?.Year,
					IdApiTmdb = tmdbId,
					PosterUrl = movieDetails.Poster_Path?.TrimStart('/') // Limpiar URL
				};

				// 4. Procesar géneros
				await ProcessGenerosAsync(movieDetails.Genres, pelicula);

				// 5. Guardar película
				await _context.Peliculas.AddAsync(pelicula);
				await _context.SaveChangesAsync();

				// 6. Obtener y procesar plataformas
				var plataformas = await _watchModeService.GetStreamingSourcesAsync(tmdbId, region);
				await ProcessPlatformsAsync(plataformas, pelicula);

				await transaction.CommitAsync();
				_logger.LogInformation("Película sincronizada exitosamente por TMDB ID: {TmdbId} - {Title} con {PlatformCount} plataformas",
					tmdbId, pelicula.Titulo, plataformas.Count);
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, "Error sincronizando película por TMDB ID: {TmdbId}", tmdbId);
				throw new SyncException($"Error sincronizando película con TMDB ID '{tmdbId}'", ex);
			}
		}
		public async Task<bool> IsMovieSyncedAsync(string peliculaId)
		{
			try
			{
				return await _context.Peliculas.AnyAsync(p => p.Id == peliculaId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error verificando si película está sincronizada: {PeliculaId}", peliculaId);
				return false;
			}
		}

		public async Task<List<Pelicula>> GetMostReviewedMoviesAsync(int limit = 50)
		{
			try
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
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo películas más reseñadas");
				return new List<Pelicula>();
			}
		}

		// Método para sincronización masiva de películas más populares (opcional)
		public async Task SyncPopularMoviesAsync(int pages = 3, string region = "ES")
		{
			try
			{
				_logger.LogInformation("Iniciando sincronización de películas populares - {Pages} páginas", pages);
				var syncedCount = 0;

				for (int page = 1; page <= pages; page++)
				{
					var popularMovies = await _tmdbService.GetPopularMoviesAsync(page);
					if (popularMovies?.Results == null || !popularMovies.Results.Any())
						break;

					foreach (var movie in popularMovies.Results)
					{
						try
						{
							var existingMovie = await _context.Peliculas
								.FirstOrDefaultAsync(p => p.IdApiTmdb == movie.Id);

							if (existingMovie == null)
							{
								await SyncMovieByTmdbIdAsync(movie.Id, region);
								syncedCount++;

								// Pequeña pausa para no sobrecargar las APIs
								await Task.Delay(200);
							}
						}
						catch (Exception ex)
						{
							_logger.LogWarning(ex, "Error sincronizando película popular: {Title} (ID: {TmdbId})",
								movie.Title, movie.Id);
							// Continuar con la siguiente película
						}
					}
				}

				_logger.LogInformation("Sincronización de películas populares completada. {SyncedCount} películas sincronizadas",
					syncedCount);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error en sincronización masiva de películas populares");
				throw;
			}
		}
		public async Task SyncMovieByTitleAsync(string movieTitle, string region = "ES")
		{
			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				_logger.LogInformation("Iniciando sincronización para: {Title}", movieTitle);

				// 1. Verificar si la película ya existe
				var existingMovie = await _context.Peliculas
					.FirstOrDefaultAsync(p => p.Titulo.Equals(movieTitle, StringComparison.OrdinalIgnoreCase));

				if (existingMovie != null)
				{
					_logger.LogInformation("Película ya existe, actualizando plataformas: {Title}", movieTitle);
					await UpdateMoviePlatformsAsync(existingMovie, region);
					await transaction.CommitAsync();
					return;
				}

				// 2. Buscar en TMDB
				var searchResult = await _tmdbService.SearchMoviesAsync(movieTitle);
				var tmdbMovie = searchResult?.Results?.FirstOrDefault();

				if (tmdbMovie == null)
				{
					_logger.LogWarning("Película no encontrada en TMDB: {Title}", movieTitle);
					return;
				}

				// 3. Obtener detalles completos
				var movieDetails = await _tmdbService.GetMovieDetailsAsync(tmdbMovie.Id);
				if (movieDetails == null)
				{
					_logger.LogWarning("No se pudieron obtener detalles de TMDB para ID: {TmdbId}", tmdbMovie.Id);
					return;
				}

				// 4. Crear película
				var pelicula = new Pelicula
				{
					Id = tmdbMovie.Id.ToString(),
					Titulo = movieDetails.Title,
					Sinopsis = movieDetails.Overview,
					Año = movieDetails.GetReleaseDate()?.Year,
					IdApiTmdb = tmdbMovie.Id,
					PosterUrl = movieDetails.Poster_Path?.TrimStart('/') // Limpiar URL
				};

				// 5. Procesar géneros
				await ProcessGenerosAsync(movieDetails.Genres, pelicula);

				// 6. Guardar película
				await _context.Peliculas.AddAsync(pelicula);
				await _context.SaveChangesAsync();

				// 7. Obtener y procesar plataformas
				var plataformas = await _watchModeService.GetStreamingSourcesAsync(tmdbMovie.Id, region);
				await ProcessPlatformsAsync(plataformas, pelicula);

				await transaction.CommitAsync();
				_logger.LogInformation("Película sincronizada exitosamente: {Title} con {PlatformCount} plataformas",
					pelicula.Titulo, plataformas.Count);
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
			try
			{
				if (pelicula.IdApiTmdb == null)
				{
					_logger.LogWarning("No se puede actualizar plataformas sin TMDB ID para: {Title}", pelicula.Titulo);
					return;
				}

				var plataformas = await _watchModeService.GetStreamingSourcesAsync(pelicula.IdApiTmdb, region);
				await ProcessPlatformsAsync(plataformas, pelicula);

				_context.Peliculas.Update(pelicula);
				await _context.SaveChangesAsync();

				_logger.LogInformation("Plataformas actualizadas para: {Title}", pelicula.Titulo);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error actualizando plataformas para: {Title}", pelicula.Titulo);
				throw;
			}
		}
		public async Task SyncAvailablePlatformsAsync(string region = "ES")
		{
			try
			{
				_logger.LogInformation("Sincronizando plataformas disponibles para región: {Region}", region);

				var availablePlatforms = await _watchModeService.GetAvailablePlatformsAsync(region);
				var syncedCount = 0;

				foreach (var platform in availablePlatforms)
				{
					var existingPlatform = await _context.Plataformas
						.FirstOrDefaultAsync(p => p.Nombre.Equals(platform.Name, StringComparison.OrdinalIgnoreCase));

					if (existingPlatform == null)
					{
						var newPlatform = new Plataforma
						{
							Nombre = platform.Name,
							Enlace = platform.WebUrl,
							Tipo = MapPlatformType(platform.Type)
						};

						_context.Plataformas.Add(newPlatform);
						syncedCount++;
					}
				}

				if (syncedCount > 0)
				{
					await _context.SaveChangesAsync();
					_logger.LogInformation("Sincronizadas {Count} nuevas plataformas", syncedCount);
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error sincronizando plataformas disponibles");
				throw;
			}
		}

		private TipoPlataforma MapPlatformType(string watchModeType)
		{
			return watchModeType switch
			{
				"sub" => TipoPlataforma.Suscripción,
				"rent" => TipoPlataforma.Alquiler,
				"buy" => TipoPlataforma.Compra,
				"free" => TipoPlataforma.Gratis, // "free" puede ser considerado como Otro
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

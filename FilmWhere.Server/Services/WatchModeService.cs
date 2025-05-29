using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using FilmWhere.Models;
using FilmWhere.Server.DTOs;
using Microsoft.Extensions.Logging;

namespace FilmWhere.Services
{
	public class WatchModeService
	{
		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly ILogger<WatchModeService> _logger;
		private const string BaseUrl = "https://api.watchmode.com/v1/";
		public WatchModeService(HttpClient httpClient, IConfiguration config,
			ILogger<WatchModeService> logger)
		{
			_httpClient = httpClient;
			_apiKey = config["WatchMode:ApiKey"];
			_logger = logger;

			_httpClient.BaseAddress = new Uri(BaseUrl);
			_httpClient.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		public async Task<List<PlataformaDTO>> GetStreamingSourcesAsync(
			int tmdbId,
			string region = "ES")
		{
			try
			{
				var searchResponse = await _httpClient.GetFromJsonAsync<WatchModeSearchResponse>(
					$"search/?apiKey={_apiKey}&search_field=tmdb_movie_id&search_value={tmdbId}");
				_logger.LogInformation("Buscando plataformas para TMDB ID: {TmdbId}", searchResponse);
				

				var movie = searchResponse.Title_Results.First();
				var watchModeId = movie.Id;

				var sourcesUrl = $"title/{watchModeId}/sources/?apiKey={_apiKey}&regions={region}";
				var httpResponse = await _httpClient.GetAsync(sourcesUrl);
				var jsonContent = await httpResponse.Content.ReadAsStringAsync();

				var jsonOptions = new JsonSerializerOptions
				{
					PropertyNameCaseInsensitive = true
				};

				var sources = JsonSerializer.Deserialize<List<WatchModeSource>>(jsonContent, jsonOptions);

				if (sources == null || !sources.Any())
				{
					_logger.LogWarning("No se encontraron fuentes para WatchMode ID: {WatchModeId}", watchModeId);
					return new List<PlataformaDTO>();
				}

				// Filtrar y categorizar todas las plataformas disponibles
				var platforms = sources
					.Where(s => !string.IsNullOrEmpty(s.Name))
					.GroupBy(s => s.Name) // Evitar duplicados por plataforma
					.Select(g => g.OrderBy(s => GetTypePriority(s.Type)).First())
					.Select(source => new PlataformaDTO
					{
						Id = source.Source_Id,
						Name = source.Name,
						Type = MapWatchModeTypeToSpanish(source.Type),
						Price = source.Price,
						Url = source.Web_Url ?? ""
					})
					.ToList();


				_logger.LogInformation("Encontradas {Count} plataformas para TMDB ID: {TmdbId}",
					platforms.Count, tmdbId);

				return platforms;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo plataformas para ID: {TmdbId}", tmdbId);
				return new List<PlataformaDTO>();
			}
		}
		private string MapWatchModeTypeToSpanish(string watchModeType)
		{
			return watchModeType?.ToLower() switch
			{
				"sub" => "Suscripción",
				"rent" => "Alquiler",
				"buy" => "Compra",
				"free" => "Gratis",
				_ => "Otro"
			};
		}

		// NUEVO: Método para buscar película por título y obtener ID interno de WatchMode
		public async Task<int?> SearchMovieAsync(string title, int? year = null)
		{
			try
			{
				var searchUrl = $"search/?apiKey={_apiKey}&search_field=name&search_value={Uri.EscapeDataString(title)}";
				if (year.HasValue)
				{
					searchUrl += $"&year={year}";
				}

				var response = await _httpClient.GetFromJsonAsync<WatchModeSearchResponse>(searchUrl);

				var movie = response?.Title_Results?.FirstOrDefault();
				if (movie != null)
				{
					_logger.LogInformation("Película encontrada en WatchMode: {Title} (ID: {Id})",
						movie.Name, movie.Id);
					return movie.Id;
				}

				_logger.LogWarning("No se encontró la película '{Title}' en WatchMode", title);
				return null;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error buscando película: {Title}", title);
				return null;
			}
		}

		//Obtener precios detallados
		public async Task<WatchModePlatformDetails?> GetPlatformDetailsAsync(string platformName)
		{
			try
			{
				// Primero obtener la lista de todas las plataformas disponibles
				var sourcesResponse = await _httpClient.GetFromJsonAsync<WatchModeSourcesListResponse>(
					$"sources/?apiKey={_apiKey}");

				var platform = sourcesResponse?.Sources?.FirstOrDefault(s =>
					s.Name.Equals(platformName, StringComparison.OrdinalIgnoreCase));

				if (platform != null)
				{
					return new WatchModePlatformDetails
					{
						Id = platform.Id,
						Name = platform.Name,
						Type = platform.Type,
						Region = platform.Region,
						AndroidUrl = platform.AndroidUrl,
						IosUrl = platform.IosUrl,
						WebUrl = platform.WebUrl
					};
				}

				return null;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo detalles para plataforma: {Platform}", platformName);
				return null;
			}
		}

		// NUEVO: Obtener todas las plataformas disponibles en una región
		public async Task<List<WatchModePlatformDetails>> GetAvailablePlatformsAsync(string region = "ES")
		{
			try
			{
				var response = await _httpClient.GetFromJsonAsync<WatchModeSourcesListResponse>(
					$"sources/?apiKey={_apiKey}&regions={region}");

				return response?.Sources?.Select(s => new WatchModePlatformDetails
				{
					Id = s.Id,
					Name = s.Name,
					Type = s.Type,
					Region = s.Region,
					AndroidUrl = s.AndroidUrl,
					IosUrl = s.IosUrl,
					WebUrl = s.WebUrl
				}).ToList() ?? new List<WatchModePlatformDetails>();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo plataformas disponibles para región: {Region}", region);
				return new List<WatchModePlatformDetails>();
			}
		}

		// MEJORADO: Disponibilidad global con más detalles
		public async Task<WatchModeAvailability> GetGlobalAvailabilityAsync(int tmdbId)
		{
			try
			{
				return await _httpClient.GetFromJsonAsync<WatchModeAvailability>(
						   $"title/{tmdbId}/availability/?apiKey={_apiKey}")
					   ?? new WatchModeAvailability();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo disponibilidad ID: {TmdbId}", tmdbId);
				return new WatchModeAvailability();
			}
		}

		private int GetTypePriority(string type)
		{
			return type switch
			{
				"sub" => 1,      // Suscripción (más prioritario)
				"free" => 2,     // Gratis
				"rent" => 3,     // Alquiler
				"buy" => 4,      // Compra
				_ => 5           // Otros
			};
		}
		//DTOs
		public class WatchModeSourcesResponse
		{
			public List<WatchModeSource> Sources { get; set; } = new();
		}

		public class WatchModeSource
		{
			public int Source_Id { get; set; }
			public string Name { get; set; } = "";
			public string Type { get; set; } = "";
			public string Region { get; set; } = "";
			public string Web_Url { get; set; } = "";
			public string Format { get; set; } = "";
			public decimal? Price { get; set; }
		}

		public class WatchModeSearchResponse
		{
			public List<WatchModeSearchResult> Title_Results { get; set; } = new();
		}

		public class WatchModeSearchResult
		{
			public int Id { get; set; }
			public string Name { get; set; } = "";
			public int? Year { get; set; }
			public string Type { get; set; } = "";
		}

		public class WatchModeAvailability
		{
			public List<string> Countries { get; set; } = new();
			public DateTime? First_Available { get; set; }
			public List<WatchModeSource> Sources { get; set; } = new();
		}

		public class WatchModeSourcesListResponse
		{
			public List<WatchModePlatformDetails> Sources { get; set; } = new();
		}

		public class WatchModePlatformDetails
		{
			public int Id { get; set; }
			public string Name { get; set; } = "";
			public string Type { get; set; } = "";
			public string Region { get; set; } = "";
			public string WebUrl { get; set; } = "";
			public string AndroidUrl { get; set; } = "";
			public string IosUrl { get; set; } = "";
			public decimal? Price { get; set; }
		}


	}

}


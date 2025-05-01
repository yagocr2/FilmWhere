using System.Net.Http.Headers;
using FilmWhere.Models;

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

			// Configurar cliente
			_httpClient.BaseAddress = new Uri(BaseUrl);
			_httpClient.DefaultRequestHeaders.Accept.Add(
				new MediaTypeWithQualityHeaderValue("application/json"));
		}

		// Plataformas de streaming por ID de TMDB
		public async Task<List<WatchModePlatform>> GetStreamingSourcesAsync(
			int tmdbId,
			string region = "ES")
		{
			try
			{
				var response = await _httpClient.GetFromJsonAsync<WatchModeSourcesResponse>(
					$"title/{tmdbId}/sources/?apiKey={_apiKey}&regions={region}");

				return response?.Sources
					.Where(s => s.Type == "sub")
					.ToList() ?? new List<WatchModePlatform>();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo plataformas para ID: {TmdbId}", tmdbId);
				return new List<WatchModePlatform>();
			}
		}

		//Precios por plataforma
		public async Task<decimal?> GetPlatformPricingAsync(string platformName)
		{
			try
			{
				var response = await _httpClient.GetFromJsonAsync<WatchModePricingResponse>(
					$"source_details/?apiKey={_apiKey}&source={Uri.EscapeDataString(platformName)}");

				return response?.Price;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo precios para: {Platform}", platformName);
				return null;
			}
		}

		// Método 3: Disponibilidad global
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

		//DTOs
		public class WatchModeSourcesResponse
		{
			public List<WatchModePlatform> Sources { get; set; } = new();
		}

		public class WatchModePlatform
		{
			public string Name { get; set; } = "";
			public string WebUrl { get; set; } = "";
			public string Type { get; set; } = "";
		}

		public class WatchModePricingResponse
		{
			public decimal? Price { get; set; }
		}

		public class WatchModeAvailability
		{
			public List<string> Countries { get; set; } = new();
			public DateTime? First_Available { get; set; }
		}
	}

}


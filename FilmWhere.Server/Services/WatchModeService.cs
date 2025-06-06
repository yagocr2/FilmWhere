using System.Net.Http.Headers;
using System.Text.Json;
using FilmWhere.Server.DTOs;
using static FilmWhere.Server.DTOs.WatchModeDTO;

namespace FilmWhere.Services
{
	public class WatchModeService
	{
		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly ILogger<WatchModeService> _logger;
		private readonly JsonSerializerOptions _jsonOptions;

		public WatchModeService(HttpClient httpClient, IConfiguration config, ILogger<WatchModeService> logger)
		{
			_httpClient = httpClient;
			_apiKey = config["WatchMode:ApiKey"];
			_logger = logger;
			_jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

			_httpClient.BaseAddress = new Uri("https://api.watchmode.com/v1/");
			_httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
		}

		public async Task<List<PlataformaDTO>> GetStreamingSourcesAsync(int tmdbId, string region = "ES")
		{
			try
			{
				var searchResponse = await GetWatchModeIdAsync(tmdbId);
				var watchModeId = searchResponse?.Title_Results?.FirstOrDefault()?.Id;

				if (watchModeId == null) return new List<PlataformaDTO>();

				var sources = await GetSourcesAsync(watchModeId.Value, region);
				var platforms = ProcessSources(sources);

				_logger.LogInformation("Encontradas {Count} plataformas para TMDB ID: {TmdbId}", platforms.Count, tmdbId);
				return platforms;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo plataformas para ID: {TmdbId}", tmdbId);
				return new List<PlataformaDTO>();
			}
		}

		public async Task<WatchModePlatformDetailsDTO?> GetPlatformDetailsAsync(int platformId)
		{
			try
			{
				var sources = await GetAllSourcesAsync();
				return sources.FirstOrDefault(s => s.Id == platformId)?.ToDetails();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo detalles para plataforma: {Platform}", platformId);
				return null;
			}
		}

		public async Task<List<WatchModePlatformDetailsDTO>> GetAvailablePlatformsAsync(string region = "ES")
		{
			try
			{
				var sources = await GetAllSourcesAsync();
				return sources.Where(s => s.Region == region).Select(s => s.ToDetails()).ToList();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error obteniendo plataformas disponibles para región: {Region}", region);
				return new List<WatchModePlatformDetailsDTO>();
			}
		}

		private async Task<WatchModeSearchResponseDTO?> GetWatchModeIdAsync(int tmdbId)
		{
			return await _httpClient.GetFromJsonAsync<WatchModeSearchResponseDTO>(
				$"search/?apiKey={_apiKey}&search_field=tmdb_movie_id&search_value={tmdbId}");
		}

		private async Task<List<WatchModeSourceDTO>> GetSourcesAsync(int watchModeId, string region)
		{
			var response = await _httpClient.GetAsync($"title/{watchModeId}/sources/?apiKey={_apiKey}&regions={region}");
			var jsonContent = await response.Content.ReadAsStringAsync();

			return JsonSerializer.Deserialize<List<WatchModeSourceDTO>>(jsonContent, _jsonOptions)
				   ?? new List<WatchModeSourceDTO>();
		}

		private async Task<List<WatchModePlatformSourceDTO>> GetAllSourcesAsync()
		{
			var response = await _httpClient.GetAsync($"sources/?apiKey={_apiKey}");
			var jsonContent = await response.Content.ReadAsStringAsync();

			return JsonSerializer.Deserialize<List<WatchModePlatformSourceDTO>>(jsonContent, _jsonOptions)
				   ?? new List<WatchModePlatformSourceDTO>();
		}

		private List<PlataformaDTO> ProcessSources(List<WatchModeSourceDTO> sources)
		{
			return sources
				.Where(s => !string.IsNullOrEmpty(s.Name))
				.GroupBy(s => s.Name)
				.Select(g => g.OrderBy(s => GetTypePriority(s.Type)).First())
				.Select(s => s.ToPlataformaDTO())
				.ToList();
		}

		private static int GetTypePriority(string type) => type switch
		{
			"sub" => 1,
			"free" => 2,
			"rent" => 3,
			"buy" => 4,
			_ => 5
		};
	}
}
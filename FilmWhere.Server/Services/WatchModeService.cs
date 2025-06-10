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

		/// <summary>
		/// Constructor de la clase WatchModeService, se encarga de inicializar el HttpClient y la clave de API de WatchMode, 
		/// además de configurar los headers necesarios para las peticiones a la API de WatchMode.
		/// </summary>
		/// <param name="httpClient">Clase la cual nos permite mandar y recibir HTTP requests y responses</param>
		/// <param name="config">Atributo que sirve para recibir los valores del appsettings.json</param>
		/// <param name="logger">Interfaz la cual nos va a permitir mandar mensajes al log de la aplicación</param>
		public WatchModeService(HttpClient httpClient, IConfiguration config, ILogger<WatchModeService> logger)
		{
			_httpClient = httpClient;
			_apiKey = config["WatchMode:ApiKey"];
			_logger = logger;
			_jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

			_httpClient.BaseAddress = new Uri("https://api.watchmode.com/v1/");
			_httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
		}

		/// <summary>
		/// Obtiene las plataformas de streaming disponibles para una película específica por su ID de TMDB.
		/// </summary>
		/// <param name="tmdbId">ID de TMDB de la película</param>
		/// <param name="region">Región para filtrar las plataformas disponibles, por defecto es "ES"</param>
		/// <returns>Lista de plataformas donde está disponible la película</returns>
		public async Task<List<PlataformaDTO>> GetStreamingSourcesAsync(int tmdbId, string region = "ES")
		{
			try
			{
				var searchResponse = await GetAsync<WatchModeSearchResponseDTO>(
					$"search/?search_field=tmdb_movie_id&search_value={tmdbId}",
					$"Error buscando película por TMDB ID: {tmdbId}");

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

		/// <summary>
		/// Obtiene los detalles específicos de una plataforma por su ID.
		/// </summary>
		/// <param name="platformId">ID de la plataforma en WatchMode</param>
		/// <returns>Detalles de la plataforma o null si no se encuentra</returns>
		public async Task<WatchModePlatformDetailsDTO?> GetPlatformDetailsAsync(int platformId)
		{
			var sources = await GetAsync<List<WatchModePlatformSourceDTO>>("sources/",
				$"Error obteniendo detalles para plataforma: {platformId}");

			return sources?.FirstOrDefault(s => s.Id == platformId)?.ToDetails();
		}
		/// <summary>
		/// Obtiene las fuentes de streaming para un título específico de WatchMode en una región determinada.
		/// </summary>
		/// <param name="watchModeId">ID del título en WatchMode</param>
		/// <param name="region">Región para filtrar las fuentes disponibles</param>
		/// <returns>Lista de fuentes de streaming disponibles</returns>
		private async Task<List<WatchModeSourceDTO>> GetSourcesAsync(int watchModeId, string region)
		{
			return await GetAsync<List<WatchModeSourceDTO>>(
				$"title/{watchModeId}/sources/?regions={region}",
				$"Error obteniendo fuentes para título: {watchModeId}") ?? new List<WatchModeSourceDTO>();
		}

		/// <summary>
		/// Procesa y filtra las fuentes de streaming, eliminando duplicados y priorizando por tipo de acceso.
		/// </summary>
		/// <param name="sources">Lista de fuentes sin procesar</param>
		/// <returns>Lista procesada de plataformas DTO</returns>
		private List<PlataformaDTO> ProcessSources(List<WatchModeSourceDTO> sources)
		{
			return sources
				.Where(s => !string.IsNullOrEmpty(s.Name))
				.GroupBy(s => s.Name)
				.Select(g => g.OrderBy(s => GetTypePriority(s.Type)).First())
				.Select(s => s.ToPlataformaDTO())
				.ToList();
		}

		/// <summary>
		/// Determina la prioridad de los tipos de plataforma para el procesamiento.
		/// </summary>
		/// <param name="type">Tipo de plataforma (sub, free, rent, buy)</param>
		/// <returns>Valor numérico de prioridad (menor valor = mayor prioridad)</returns>
		private static int GetTypePriority(string type) => type switch
		{
			"sub" => 1,   // Suscripción (mayor prioridad)
			"free" => 2,  // Gratis
			"rent" => 3,  // Alquiler
			"buy" => 4,   // Compra
			_ => 5        // Otros tipos
		};

		/// <summary>
		/// Función que simplifica la manera de llamar a la API de WatchMode y maneja errores de manera centralizada,
		/// así reduciendo la cantidad de código que se escribe teniendo en cuenta que todas las llamadas a la API de WatchMode siguen el mismo patrón.
		/// </summary>
		/// <typeparam name="T">Tipo genérico para poder manejar distintas respuestas</typeparam>
		/// <param name="endpoint">URL de la que se va a obtener el JSON con los datos</param>
		/// <param name="errorMessage">Mensaje de error personalizado para el log</param>
		/// <returns>Retorna el cuerpo del JSON deserializado de manera asíncrona según el tipo genérico que se le pase a la función</returns>
		private async Task<T?> GetAsync<T>(string endpoint, string errorMessage) where T : class
		{
			try
			{
				var fullEndpoint = $"{endpoint}{(endpoint.Contains('?') ? '&' : '?')}apiKey={_apiKey}";

				var response = await _httpClient.GetAsync(fullEndpoint);
				var jsonContent = await response.Content.ReadAsStringAsync();

				return JsonSerializer.Deserialize<T>(jsonContent, _jsonOptions);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, errorMessage);
				return null;
			}
		}
	}
}
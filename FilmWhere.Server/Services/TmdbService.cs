using System.Net.Http.Headers;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Services
{
	public class TmdbService
	{
		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly ILogger<TmdbService> _logger;
		/// <summary>
		/// Constructor de la clase TmdbService, se encarga de inicializar el HttpClient y la clave de API de TMDB, ademas de configurar los headers necesarios para las peticiones a la API de TMDB.
		/// </summary>
		/// <param name="httpClient">Clase la cual nos permite mandar y recivir HTTP requests y responses</param>
		/// <param name="config">Atributo que sirve para recibir los valores del appsetings.json</param>
		/// <param name="logger">Interfaz la cual nos va a permitir mandar mensajes al log de la aplicación</param>
		public TmdbService(HttpClient httpClient, IConfiguration config, ILogger<TmdbService> logger)
		{
			_httpClient = httpClient;
			_apiKey = config["Tmdb:ApiKey"];
			_logger = logger;

			_httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
			_httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
			_httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		}
		/// <summary>
		/// Obtendra los datos de una búsqueda de películas en TMDB según el query proporcionado, con la posibilidad de paginar los resultados.
		/// </summary>
		/// <param name="query">titulo de película el cual queremos buscar</param>
		/// <param name="page">Cantidad de paginas que queremso obtener, por defecto es 1</param>
		/// <param name="language">Idioma por el que queremos obtener la película</param>
		/// <returns></returns>
		public async Task<TmdbSearchResponse?> SearchMoviesAsync(string query, int page = 1, string language = "es-ES")
			=> await GetAsync<TmdbSearchResponse>($"search/movie?query={Uri.EscapeDataString(query)}&page={page}&language={language}&api_key={_apiKey}",
				$"Error buscando: {query}");
		/// <summary>
		/// Obtiene los detalles de una película por su ID, incluyendo créditos si se especifica.
		/// </summary>
		/// <param name="movieId">Id de TMDB por el que vamos a buscar la pelicula</param>
		/// <param name="includeCredits"></param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbMovieDetails?> GetMovieDetailsAsync(int movieId, bool includeCredits = false)
		{
			var append = includeCredits ? "&append_to_response=credits" : "";
			return await GetAsync<TmdbMovieDetails>($"movie/{movieId}?language=es-ES{append}&api_key={_apiKey}",
				$"Error obteniendo detalles ID: {movieId}");
		}
		/// <summary>
		/// Obtiene las películas populares de TMDB
		/// </summary>
		/// <param name="page">Cantidad de paginas que queremso obtener, por defecto es 1</param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbSearchResponse?> GetPopularMoviesAsync(int page = 1)
			=> await GetAsync<TmdbSearchResponse>($"movie/popular?page={page}&language=es-ES&api_key={_apiKey}",
				"Error obteniendo populares");
		/// <summary>
		/// Obtiene las películas mejor valoradas de TMDB
		/// </summary>
		/// <param name="page">Entero el cual nos va a marcar cuantas paginas queremos obtener, por defecto es 1</param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbSearchResponse?> GetTopRatedMoviesAsync(int page = 1)
			=> await GetAsync<TmdbSearchResponse>(
				$"discover/movie?include_adult=false&include_video=false&language=es-ES&page={page}&sort_by=vote_average.desc&without_genres=99,10755&vote_count.gte=200",
				"Error obteniendo películas mejor valoradas");
		/// <summary>
		/// Obtiene las películas por género
		/// </summary>
		/// <param name="genreId">Id del genero el cual queremos obtener</param>
		/// <param name="page">Cantidad de paginas que queremso obtener, por defecto es 1</param>
		/// <param name="language"></param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbSearchResponse?> GetMoviesByGenreAsync(int genreId, int page = 1, string language = "es-ES")
			=> await GetAsync<TmdbSearchResponse>(
				$"discover/movie?include_adult=false&with_genres={genreId}&page={page}&language={language}&sort_by=popularity.desc&api_key={_apiKey}",
				$"Error obteniendo películas por género: {genreId}");
		/// <summary>
		/// Obtiene los géneros de películas de TMDB
		/// </summary>
		/// <param name="language"></param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbGenresResponse?> GetGenresAsync(string language = "es-ES")
			=> await GetAsync<TmdbGenresResponse>($"genre/movie/list?language={language}&api_key={_apiKey}",
				"Error obteniendo géneros de TMDB");
		/// <summary>
		/// Obtiene películas por año de lanzamiento
		/// </summary>
		/// <param name="year">Entero el cual marca el año que estamos buscando</param>
		/// <param name="pages">Cantidad de paginas que queremso obtener, por defecto es 1</param>
		/// <returns>Retornara el JSON ya deserializado, según el tipo de respuesta</returns>
		public async Task<TmdbSearchResponse?> GetMoviesByYearAsync(int year = 2025, int pages = 1)
			=> await GetAsync<TmdbSearchResponse>($"movie?laguage=es-ES&api_key={_apiKey}&primary_release_year={year}&page={pages}",
				"Error obteniendo géneros de TMDB");
		/// <summary>
		/// Funcion que simplifica la manera de llamar a la API de TMDB y maneja errores de manera centralizada, 
		/// asi reduciendo la cantidad de odigo que se escribe teniendo en cuenta que todas las llamadas a la API de TMDB siguen el mismo patrón.
		/// </summary>
		/// <typeparam name="T">Tipo generico para poder mandar distintas respuestas</typeparam>
		/// <param name="endpoint">Url de la que se va a obtener el JSON con los datos</param>
		/// <param name="errorMessage"></param>
		/// <returns>
		/// Retorna el cuerpo del JSON deserializado de manera asincrona
		/// según el tipo generico que se le pase a la funcion</returns>
		/// </returns>
		private async Task<T?> GetAsync<T>(string endpoint, string errorMessage) where T : class
		{
			try
			{
				return await _httpClient.GetFromJsonAsync<T>(endpoint);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, errorMessage);
				return null;
			}
		}
	}
}
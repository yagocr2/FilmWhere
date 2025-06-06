using System.Net.Http.Headers;
using static FilmWhere.Server.DTOs.TmdbDTO;

namespace FilmWhere.Services
{
	public class TmdbService
	{
		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly ILogger<TmdbService> _logger;

		public TmdbService(HttpClient httpClient, IConfiguration config, ILogger<TmdbService> logger)
		{
			_httpClient = httpClient;
			_apiKey = config["Tmdb:ApiKey"];
			_logger = logger;

			_httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
			_httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
			_httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		}

		public async Task<TmdbSearchResponse?> SearchMoviesAsync(string query, int page = 1, string language = "es-ES")
			=> await GetAsync<TmdbSearchResponse>($"search/movie?query={Uri.EscapeDataString(query)}&page={page}&language={language}&api_key={_apiKey}",
				$"Error buscando: {query}");

		public async Task<TmdbMovieDetails?> GetMovieDetailsAsync(int movieId, bool includeCredits = false)
		{
			var append = includeCredits ? "&append_to_response=credits" : "";
			return await GetAsync<TmdbMovieDetails>($"movie/{movieId}?language=es-ES{append}&api_key={_apiKey}",
				$"Error obteniendo detalles ID: {movieId}");
		}
		public async Task<TmdbSearchResponse?> GetPopularMoviesAsync(int page = 1)
			=> await GetAsync<TmdbSearchResponse>($"movie/popular?page={page}&language=es-ES&api_key={_apiKey}",
				"Error obteniendo populares");

		public async Task<TmdbSearchResponse?> GetTopRatedMoviesAsync(int page = 1)
			=> await GetAsync<TmdbSearchResponse>(
				$"discover/movie?include_adult=false&include_video=false&language=es-ES&page={page}&sort_by=vote_average.desc&without_genres=99,10755&vote_count.gte=200",
				"Error obteniendo películas mejor valoradas");

		public async Task<TmdbSearchResponse?> GetMoviesByGenreAsync(int genreId, int page = 1, string language = "es-ES")
			=> await GetAsync<TmdbSearchResponse>(
				$"discover/movie?with_genres={genreId}&page={page}&language={language}&sort_by=popularity.desc&api_key={_apiKey}",
				$"Error obteniendo películas por género: {genreId}");

		public async Task<TmdbGenresResponse?> GetGenresAsync(string language = "es-ES")
			=> await GetAsync<TmdbGenresResponse>($"genre/movie/list?language={language}&api_key={_apiKey}",
				"Error obteniendo géneros de TMDB");
        public async Task<TmdbSearchResponse?> GetMoviesByYearAsync(int year = 2025, int pages = 1)
            => await GetAsync<TmdbSearchResponse>($"movie?laguage=es-ES&api_key={_apiKey}&primary_release_year={year}&page={pages}",
                "Error obteniendo géneros de TMDB");

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
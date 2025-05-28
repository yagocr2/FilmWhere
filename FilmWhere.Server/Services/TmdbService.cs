using FilmWhere.Models;
using System.Net.Http.Headers;
using System.Text.Json;

namespace FilmWhere.Services
{
    public class TmdbService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<TmdbService> _logger;
        private const string BaseUrl = "https://api.themoviedb.org/3/";


        public TmdbService(HttpClient httpClient, IConfiguration config, ILogger<TmdbService> logger)
        {
            _httpClient = httpClient;
            _apiKey = config["Tmdb:ApiKey"];
            _logger = logger;

            // Configurar cliente
            _httpClient.BaseAddress = new Uri(BaseUrl);
            _httpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        // Búsqueda por título
        public async Task<TmdbSearchResponse?> SearchMoviesAsync(
            string query,
            int page = 1,
            string language = "es-ES")
        {
            try
            {
                return await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                    $"search/movie?query={Uri.EscapeDataString(query)}" +
                    $"&page={page}&language={language}&api_key={_apiKey}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error buscando: {Query}", query);
                return null;
            }
        }

        // Detalles completos de película
        public async Task<TmdbMovieDetails?> GetMovieDetailsAsync(
            int movieId,
            bool includeCredits = false)
        {
            try
            {
                var append = includeCredits ? "&append_to_response=credits" : "";
                return await _httpClient.GetFromJsonAsync<TmdbMovieDetails>(
                    $"movie/{movieId}?language=es-ES{append}&api_key={_apiKey}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo detalles ID: {MovieId}", movieId);
                return null;
            }
        }
        // Peliculas populares
        public async Task<TmdbSearchResponse?> GetPopularMoviesAsync(int page = 1)
        {
            try
            {
                return await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                    $"movie/popular?page={page}&language=es-ES&api_key={_apiKey}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo populares");
                return null;
            }

        }
        public async Task<TmdbSearchResponse?> GetTopRatedMoviesAsync(int page = 1)
        {
            try
            {
                return await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                    $"discover/movie?include_adult=false&include_video=false&language=es-ES&page={page}&sort_by=vote_average.desc&without_genres=99,10755&vote_count.gte=200");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo películas mejor valoradas");
                return null;
            }
        }
        public async Task<TmdbSearchResponse?> GetMoviesByGenreAsync(
            int genreId,
            int page = 1,
            string language = "es-ES")
        {
            try
            {
                return await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                    $"discover/movie?with_genres={genreId}" +
                    $"&page={page}&language={language}" +
                    $"&sort_by=popularity.desc&api_key={_apiKey}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo películas por género: {GenreId}", genreId);
                return null;
            }
        }

        // Método para obtener lista de géneros de TMDB
        public async Task<TmdbGenresResponse?> GetGenresAsync(string language = "es-ES")
        {
            try
            {
                return await _httpClient.GetFromJsonAsync<TmdbGenresResponse>(
                    $"genre/movie/list?language={language}&api_key={_apiKey}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo géneros de TMDB");
                return null;
            }
        }
        //DTOs
        // DTO para la respuesta de TMDB
        public class TmdbMovieDto
        {
            public int Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public DateTime Release_Date { get; set; }
            public List<TmdbGenre> Genres { get; set; } = new();
            public string Overview { get; set; } = string.Empty;
        }

        public class TmdbSearchResponse
        {
            public int Page { get; set; }
            public List<TmdbSearchResult> Results { get; set; } = new();
            public int Total_Pages { get; set; }
        }
        public class TmdbSearchResult
        {
            public int Id { get; set; }
            public string Title { get; set; } = "";
            public string Poster_Path { get; set; } = "";
            public string Overview { get; set; } = "";
            public decimal Vote_Average { get; set; }
            public DateTime Release_Date { get; set; }
        }
        public class TmdbMovieDetails
        {
            public int Id { get; set; }
            public string Title { get; set; } = "";
            public string Poster_Path { get; set; } = "";
            public string Overview { get; set; } = "";
            public string Release_Date { get; set; } = "";
            public decimal Vote_Average { get; set; }
            public List<TmdbGenre> Genres { get; set; } = new();
            public List<TmdbCastMember> Credits { get; set; } = new();
            public DateTime? GetReleaseDate() => DateTime.TryParse(Release_Date, out var date) ? date : null;

        }
        public class TmdbGenre
        {
            public int Id { get; set; }
            public string Name { get; set; } = "";
        }
        public class TmdbGenresResponse
        {
            public List<TmdbGenre> Genres { get; set; } = new();
        }
        public class TmdbCastMember
        {
            public string Name { get; set; } = "";
            public string Character { get; set; } = "";
        }
    }
}


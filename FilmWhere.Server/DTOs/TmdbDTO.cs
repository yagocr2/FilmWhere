namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// Modelo para respuestas de Tmdb
	/// </summary>
	public static class TmdbDTO
	{
		/// <summary>
		/// Modelo para respuestas de Tmdb
		/// </summary>
		/// <param name="Page">Numero de pagina en la que se encuentra</param>
		/// <param name="Results">Lista de resultados</param>
		/// <param name="Total_Pages">Paginas totales</param>
		public record TmdbSearchResponse(int Page, List<TmdbSearchResult> Results, int Total_Pages);
		/// <summary>
		/// Modelo para respuestas de Tmdb
		/// </summary>
		/// <param name="Id">Identificador</param>
		/// <param name="Title">Titulo de la pelicula</param>
		/// <param name="Poster_Path">URL de la imagen</param>
		/// <param name="Overview">Sinopsis</param>
		/// <param name="Vote_Average">Voto promedio</param>
		/// <param name="Release_Date">Fecha de salida</param>
		public record TmdbSearchResult(int Id, string Title, string Poster_Path, string Overview,
			decimal Vote_Average, DateTime Release_Date);
		/// <summary>
		/// Modelo para respuestas de Tmdb
		/// </summary>
		public class TmdbMovieDetails
		{
			public int Id { get; set; }
			public string Title { get; set; } = "";
			public string Poster_Path { get; set; } = "";
			public string Overview { get; set; } = "";
			public string Release_Date { get; set; } = "";
			public decimal Vote_Average { get; set; }
			public List<TmdbGenre> Genres { get; set; } = new();
			public DateTime? GetReleaseDate() => DateTime.TryParse(Release_Date, out var date) ? date : null;
		}
		/// <summary>
		/// Modelo para respuestas de Tmdb
		/// </summary>
		/// <param name="Id">Identificador del genero</param>
		/// <param name="Name">Nombre del genero</param>
		public record TmdbGenre(int Id, string Name);
		/// <summary>
		/// Lista para respuestas de Tmdb
		/// </summary>
		/// <param name="Genres">Lista de generos</param>
		public record TmdbGenresResponse(List<TmdbGenre> Genres);
	}
}

namespace FilmWhere.Server.DTOs
{
	public static class TmdbDTO
	{
		public record TmdbSearchResponse(int Page, List<TmdbSearchResult> Results, int Total_Pages);

		public record TmdbSearchResult(int Id, string Title, string Poster_Path, string Overview,
			decimal Vote_Average, DateTime Release_Date);

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
		public record TmdbGenre(int Id, string Name);
		public record TmdbGenresResponse(List<TmdbGenre> Genres);
	}
}

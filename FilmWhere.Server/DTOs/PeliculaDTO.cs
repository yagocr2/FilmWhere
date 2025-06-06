using FilmWhere.Server.Controllers;
using System.Text.Json.Serialization;

namespace FilmWhere.Server.DTOs
{
	public class PeliculaDTO
	{
		public string Id { get; set; }
		public string Title { get; set; }
		public string PosterUrl { get; set; }
		public string Overview { get; set; }
		public int Year { get; set; }
		public decimal? Rating { get; set; }
		public List<string> Genres { get; set; } = new List<string>();
		public List<PlataformaDTO> Platforms { get; set; } = new List<PlataformaDTO>();
		public List<ReviewDTO> Reviews { get; set; } = new List<ReviewDTO>();
		public int ReviewCount { get; set; }
		public int TmdbId { get; set; }
	}

}

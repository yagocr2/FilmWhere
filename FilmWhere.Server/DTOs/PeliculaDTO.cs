using FilmWhere.Server.Controllers;
using System.Text.Json.Serialization;

namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// Modelo para respuestas de películas
	/// </summary>
	public class PeliculaDTO
	{
		/// <summary>
		/// Identificador de la película
		/// </summary>
		public string Id { get; set; }
		/// <summary>
		/// Títutlo de la película
		/// </summary>
		public string Title { get; set; }
		/// <summary>
		/// Url de la portada
		/// </summary>
		public string PosterUrl { get; set; }
		/// <summary>
		/// Sinopsis
		/// </summary>
		public string Overview { get; set; }
		/// <summary>
		/// Año
		/// </summary>
		public int Year { get; set; }
		/// <summary>
		/// Calificación
		/// </summary>
		public decimal? Rating { get; set; }
		/// <summary>
		///	Duración
		/// </summary>
		public List<string> Genres { get; set; } = new List<string>();
		/// <summary>
		/// Plataformas en las que se puede ver
		/// </summary>
		public List<PlataformaDTO> Platforms { get; set; } = new List<PlataformaDTO>();
		/// <summary>
		/// Reseñas
		/// </summary>
		public List<ReviewDTO> Reviews { get; set; } = new List<ReviewDTO>();
		/// <summary>
		/// Conteo de reseñas
		/// </summary>
		public int ReviewCount { get; set; }
		/// <summary>
		/// Identificador de TMDB
		/// </summary>
		public int TmdbId { get; set; }
	}

}

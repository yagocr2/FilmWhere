using System.ComponentModel.DataAnnotations;

namespace FilmWhere.Models
{
	public class Pelicula
	{
		public string Id { get; set; }
		[Required]
		[MaxLength(200)]
		public string Titulo { get; set; }
		public string Sinopsis { get; set; }
		public int? Año { get; set; }
		public string PosterUrl { get; set; }
		[Required]
		public int IdApiTmdb { get; set; }

		// Propiedades de navegación
		public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
		public ICollection<Reseña> Reseñas { get; set; } = new List<Reseña>();
		public ICollection<PeliculaGenero> Generos { get; set; } = new List<PeliculaGenero>();
		public ICollection<PeliculaPlataforma> Plataformas { get; set; } = new List<PeliculaPlataforma>();

	}
}

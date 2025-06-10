using System.ComponentModel.DataAnnotations;

namespace FilmWhere.Models
{
	public class Plataforma
	{

		public string Id { get; set; }

		[Required]
		[MaxLength(100)]
		public string Nombre { get; set; }  // Ej: Netflix, Disney+


		// Propiedad de navegación
		public ICollection<PeliculaPlataforma> Peliculas { get; set; } = new List<PeliculaPlataforma>();
	}
}

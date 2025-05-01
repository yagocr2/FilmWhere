using System.ComponentModel.DataAnnotations;

namespace FilmWhere.Models
{
	public class Genero
	{
		public string Id { get; set; }

		[Required]
		[MaxLength(50)]
		public string Nombre { get; set; }
		public ICollection<PeliculaGenero> Peliculas { get; set; } = new List<PeliculaGenero>();
	}
}

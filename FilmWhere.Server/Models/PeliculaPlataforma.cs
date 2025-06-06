using System.ComponentModel.DataAnnotations.Schema;

namespace FilmWhere.Models
{
	public class PeliculaPlataforma
	{
		// Claves foráneas
		public string PeliculaId { get; set; }
		public string PlataformaId { get; set; }

		[Column(TypeName = "decimal(5,2)")]
		public decimal? Precio { get; set; }  // Precio de alquiler/compra
		public string? Enlace { get; set; }  // URL de la plataforma

		// Propiedades de navegación
		public Pelicula Pelicula { get; set; }
		public Plataforma Plataforma { get; set; }
	}
}

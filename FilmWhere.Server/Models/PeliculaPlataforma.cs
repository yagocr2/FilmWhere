using System.ComponentModel.DataAnnotations.Schema;

namespace FilmWhere.Models
{
	public class PeliculaPlataforma
	{
		public enum TipoPlataforma
		{
			Suscripción, // "sub" en WatchMode
			Alquiler,    // "rent"
			Compra,      // "buy"
			Gratis,      // "free"
			Otro         // Para tipos no reconocidos
		}
		// Claves foráneas
		public string PeliculaId { get; set; }
		public string PlataformaId { get; set; }

		[Column(TypeName = "decimal(5,2)")]
		public decimal? Precio { get; set; }  // Precio de alquiler/compra
		public string? Enlace { get; set; }  // URL de la plataforma
		public TipoPlataforma Tipo { get; set; }

		// Propiedades de navegación
		public Pelicula Pelicula { get; set; }
		public Plataforma Plataforma { get; set; }
	}
}

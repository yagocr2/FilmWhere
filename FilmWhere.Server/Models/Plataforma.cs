using System.ComponentModel.DataAnnotations;

namespace FilmWhere.Models
{
	public class Plataforma
	{
		public enum TipoPlataforma
		{
			Suscripción, // "sub" en WatchMode
			Alquiler,    // "rent"
			Compra,      // "buy"
			Gratis,      // "free"
			Otro         // Para tipos no reconocidos
		}
		public string Id { get; set; }

		[Required]
		[MaxLength(100)]
		public string Nombre { get; set; }  // Ej: Netflix, Disney+
		[MaxLength(200)]
		public string? Enlace { get; set; }  // URL de la plataforma
		public TipoPlataforma Tipo { get; set; }

		// Propiedad de navegación
		public ICollection<PeliculaPlataforma> Peliculas { get; set; } = new List<PeliculaPlataforma>();
	}
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmWhere.Models
{
	public class Reseña
	{
		public string Id { get; set; }
		[MaxLength(1000)]
		public string Comentario { get; set; }
		[Range(0,10)]
		public decimal Calificacion { get; set; }
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public DateTime Fecha { get; set; } = DateTime.UtcNow;

		// Propiedades de navegación
		public string UsuarioId { get; set; }
		public string PeliculaId { get; set; }
		public Usuario Usuario { get; set; }
		public Pelicula Pelicula { get; set; }
	}
}

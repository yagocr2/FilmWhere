namespace FilmWhere.Models
{
	public class Favorito
	{
		// Claves foráneas
		public string UsuarioId { get; set; }
		public string PeliculaId { get; set; }

		// Propiedades de navegación
		public Usuario Usuario { get; set; }
		public Pelicula Pelicula { get; set; }
	}
}


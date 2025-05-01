namespace FilmWhere.Models
{
	public class PeliculaGenero
	{
		public string PeliculaId { get; set; }
		public string GeneroId { get; set; }

		// Propiedades de navegación
		public Pelicula Pelicula { get; set; }
		public Genero Genero { get; set; }
	}
}

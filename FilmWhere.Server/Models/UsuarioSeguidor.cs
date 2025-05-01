namespace FilmWhere.Models
{
	public class UsuarioSeguidor
	{
		public string SeguidorId { get; set; }
		public string SeguidoId { get; set; }

		// Propiedades de navegación
		public Usuario Seguidor { get; set; }
		public Usuario Seguido { get; set; }
	}
}

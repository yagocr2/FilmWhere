using FilmWhere.Models;

namespace FilmWhere.Server.Models
{
	public class Denuncia
	{
		public int Id { get; set; }
		public DateTime Fecha { get; set; } = DateTime.UtcNow;

		// Usuario denunciado (el que recibe la denuncia)
		public string UsuarioDenunciadoId { get; set; }
		public Usuario UsuarioDenunciado { get; set; }

		// Usuario denunciante (el que realiza la denuncia)
		public string UsuarioDenuncianteId { get; set; }
		public Usuario UsuarioDenunciante { get; set; }
	}
}

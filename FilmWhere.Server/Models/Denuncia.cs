using FilmWhere.Models;

namespace FilmWhere.Server.Models
{
	public class Denuncia
	{
		public int Id { get; set; }
		public DateTime Fecha { get; set; } = DateTime.UtcNow;
		public Usuario Usuario { get; set; }
	}
}

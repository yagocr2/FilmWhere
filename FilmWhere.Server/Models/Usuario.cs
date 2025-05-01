using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmWhere.Models
{
	public class Usuario : IdentityUser
	{
		[PersonalData]
		[ProtectedPersonalData]
		[Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
		[MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres.")]
		[MaxLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres.")]
		public override string UserName { get; set; }
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

		// Propiedades de navegación
		public ICollection<Reseña> Reseñas { get; set; } = new List<Reseña>();
		public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
		public ICollection<UsuarioSeguidor> Seguidores { get; set; } = new List<UsuarioSeguidor>();
		public ICollection<UsuarioSeguidor> Seguidos { get; set; } = new List<UsuarioSeguidor>();
	}
}

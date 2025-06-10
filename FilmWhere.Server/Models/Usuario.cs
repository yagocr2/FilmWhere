using FilmWhere.Server.Models;
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
		[PersonalData]
		[ProtectedPersonalData]
		[Required(ErrorMessage = "El nombre es obligatorio.")]
		[MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres.")]
		[MaxLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres.")]
		public string Nombre { get; set; }
		[PersonalData]
		[ProtectedPersonalData]
		[Required(ErrorMessage = "El apellido es obligatorio.")]
		[MinLength(2, ErrorMessage = "El apellido debe tener al menos 2 caracteres.")]
		[MaxLength(50, ErrorMessage = "El apellido no puede exceder 50 caracteres.")]
		public string Apellido { get; set; }
		[PersonalData]
		[ProtectedPersonalData]
		[Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
		[Column(TypeName = "date")]
		[DataType(DataType.Date)]
		public DateOnly FechaNacimiento { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
		[MaxLength(500, ErrorMessage = "La URL de la foto de perfil no puede exceder 500 caracteres.")]
		public string? FotoPerfil { get; set; }

		// Propiedades de navegación
		public ICollection<Denuncia> Denuncias { get; set; } = new List<Denuncia>();
		public ICollection<Reseña> Reseñas { get; set; } = new List<Reseña>();
		public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
		public ICollection<UsuarioSeguidor> Seguidores { get; set; } = new List<UsuarioSeguidor>();
		public ICollection<UsuarioSeguidor> Seguidos { get; set; } = new List<UsuarioSeguidor>();
	}
}

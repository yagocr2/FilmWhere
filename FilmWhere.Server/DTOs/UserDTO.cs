using System.ComponentModel.DataAnnotations;

namespace FilmWhere.Server.DTOs
{
	public static class UserDTO
	{
		public class RegisterModel
		{
			[Required]
			[MinLength(2)]
			[MaxLength(20)]
			public string UserName { get; set; }
			[Required]
			public string Nombre { get; set; } = string.Empty;
			[Required]
			public string Apellidos { get; set; } = string.Empty;
			[Required]
			[EmailAddress]
			public string Email { get; set; }
			[Required]
			[DataType(DataType.Date)]
			public DateOnly FechaNacimiento { get; set; }
			[Required]
			[DataType(DataType.Password)]
			public string Password { get; set; }
		}
		public class LoginModel
		{
			[Required]
			public string Identifier { get; set; }

			[Required]
			[DataType(DataType.Password)]
			public string Password { get; set; }
		}
		public class UpdateProfileModel
		{
			[MinLength(3, ErrorMessage = "El nombre de usuario debe tener al menos 3 caracteres")]
			[MaxLength(50, ErrorMessage = "El nombre de usuario no puede exceder 50 caracteres")]
			[RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "El nombre de usuario solo puede contener letras, números y guiones bajos")]
			public string? UserName { get; set; }

			[Required]
			[MinLength(2)]
			[MaxLength(50)]
			public string Nombre { get; set; }

			[Required]
			[MinLength(2)]
			[MaxLength(50)]
			public string Apellido { get; set; }

			[Required]
			[DataType(DataType.Date)]
			public DateOnly FechaNacimiento { get; set; }
		}
	}
}

using Microsoft.AspNetCore.Identity;

namespace FilmWhere.Server.Services.Local
{
	/// <summary>
	/// Servicio encargado de inicializar los roles básicos del sistema de autenticación.
	/// </summary>
	public class InicializadorRoles
	{
		/// <summary>
		/// Roles predefinidos del sistema que serán creados automáticamente.
		/// </summary>
		private static readonly string[] RolesPredefinidos = { "Administrador", "Registrado" };

		/// <summary>
		/// Inicializa los roles básicos del sistema si no existen previamente.
		/// Este método debe ser llamado durante el arranque de la aplicación para garantizar
		/// que los roles necesarios estén disponibles.
		/// </summary>
		/// <param name="roleManager">Administrador de roles de ASP.NET Core Identity</param>
		/// <returns>Task que representa la operación asíncrona de inicialización</returns>
		public static async Task IniciarRoles(RoleManager<IdentityRole> roleManager)
		{
			foreach (var roleName in RolesPredefinidos)
			{
				await CrearRolSiNoExiste(roleManager, roleName);
			}
		}

		/// <summary>
		/// Crea un rol específico si no existe en el sistema.
		/// </summary>
		/// <param name="roleManager">Administrador de roles de ASP.NET Core Identity</param>
		/// <param name="roleName">Nombre del rol a crear</param>
		/// <returns>Task que representa la operación asíncrona de creación del rol</returns>
		private static async Task CrearRolSiNoExiste(RoleManager<IdentityRole> roleManager, string roleName)
		{
			if (!await roleManager.RoleExistsAsync(roleName))
			{
				await roleManager.CreateAsync(new IdentityRole(roleName));
			}
		}
	}
}
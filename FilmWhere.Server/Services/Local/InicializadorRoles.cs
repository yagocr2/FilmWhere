using Microsoft.AspNetCore.Identity;

namespace FilmWhere.Server.Services.Local
{
	public class InicializadorRoles
	{
		public static async Task IniciarRoles(RoleManager<IdentityRole> roleManager)
		{
			string[] roleNames = { "Administrador", "Registrado" };

			foreach (var roleName in roleNames)
			{
				if (!await roleManager.RoleExistsAsync(roleName))
				{
					await roleManager.CreateAsync(new IdentityRole(roleName));
				}
			}
		}
	}
}

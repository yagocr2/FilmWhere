
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using DotNetEnv;
using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Server.Services;
using FilmWhere.Server.Services.Local;
using FilmWhere.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

namespace FilmWhere.Server
{
	public class Program
	{
		public static void Main(string[] args)
		{
			Env.Load();
			var builder = WebApplication.CreateBuilder(args);

			// Add services to the container.
			builder.Services.AddControllers();
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();

			//Configuraci�n de la base de datos
			builder.Services.AddDbContext<MyDbContext>(options =>
				options.UseNpgsql(builder.Configuration
					.GetConnectionString("DefaultConnection")
					//,opt => opt.CommandTimeout(120))
					)
			);

			// Configuraci�n de HttpClient para servicios externos
			ConfigureHttpClients(builder);

			// Servicios personalizados
			builder.Services.AddScoped<TmdbService>();
			builder.Services.AddScoped<WatchModeService>();
			builder.Services.AddScoped<DataSyncService>();
			builder.Services.AddScoped<PeliculasUtilityService>();
			builder.Services.Configure<EmailSettings>(
				builder.Configuration.GetSection("EmailSettings"));
			builder.Services.AddTransient<IEmailSender, EmailSender>();

			// Identity + JWT
			ConfigureIdentityAndJwt(builder);

			// Configuraci�n de CORS
			builder.Services.AddCors(options =>
			{
				options.AddPolicy("ReactPolicy", policy =>
				{
					policy.WithOrigins(
							"https://localhost:56839",
							"https://localhost:7179",
							"http://localhost:5173")
						.AllowAnyHeader()
						.AllowAnyMethod()
						.AllowCredentials();
				});
			});

			var app = builder.Build();

			ConfigureMiddleware(app);

			app.Run();
		}
		private static void ConfigureHttpClients(WebApplicationBuilder builder)
		{
			// Configuraci�n para TMDB
			builder.Services.AddHttpClient<TmdbService>(client =>
			{
				client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
				client.DefaultRequestHeaders.Accept.Add(
					new MediaTypeWithQualityHeaderValue("application/json"));
				client.DefaultRequestHeaders.Authorization =
					new AuthenticationHeaderValue("Bearer", builder.Configuration["Tmdb:ApiKey"]);
			});

			// Configuraci�n para WatchMode
			builder.Services.AddHttpClient<WatchModeService>(client =>
			{
				client.BaseAddress = new Uri("https://api.watchmode.com/v1/");
				client.DefaultRequestHeaders.Accept.Add(
					new MediaTypeWithQualityHeaderValue("application/json"));
			});
		}
		private static void ConfigureIdentityAndJwt(WebApplicationBuilder builder)
		{
			builder.Services.AddIdentity<Usuario, IdentityRole>(options =>
			{
				// Configuraci�n de usuario
				options.User.RequireUniqueEmail = true;

				// Configuraci�n de confirmaci�n de email
				options.SignIn.RequireConfirmedEmail = true;

				// Configuraci�n de tokens
				options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
				// Configuraci�n de lockout
				options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
				options.Lockout.MaxFailedAccessAttempts = 5;
			})
				.AddEntityFrameworkStores<MyDbContext>()
				.AddDefaultTokenProviders();

			// Get the JWT key from configuration
			var secretKey = builder.Configuration["Jwt:Key"];

			// Validate that the key exists
			if (string.IsNullOrEmpty(secretKey))
			{
				throw new InvalidOperationException("JWT:Key is not configured. Check your appsettings.json or environment variables.");
			}

			// Convert the string to bytes properly
			byte[] key;
			try
			{
				key = Encoding.UTF8.GetBytes(secretKey);
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException($"Failed to convert JWT key to bytes: {ex.Message}", ex);
			}

			builder.Services.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
			})
			.AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(key),
					ValidateIssuer = true,
					ValidIssuer = builder.Configuration["Jwt:Issuer"],
					ValidateAudience = true,
					ValidAudience = builder.Configuration["Jwt:Audience"],
					ValidateLifetime = true,
					ClockSkew = TimeSpan.Zero
				};
			});
		}
		private static void ConfigurarArchivoEstaticos(WebApplication builder)
		{

			var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
			if (!Directory.Exists(webRootPath))
			{
				Directory.CreateDirectory(webRootPath);
				Console.WriteLine($"Directorio wwwroot creado en: {webRootPath}");
			}

			// Crear directorios para uploads
			var uploadsPath = Path.Combine(webRootPath, "uploads");
			var profilePicturesPath = Path.Combine(uploadsPath, "profile-pictures");

			if (!Directory.Exists(uploadsPath))
			{
				Directory.CreateDirectory(uploadsPath);
				Console.WriteLine($"Directorio uploads creado en: {uploadsPath}");
			}

			if (!Directory.Exists(profilePicturesPath))
			{
				Directory.CreateDirectory(profilePicturesPath);
				Console.WriteLine($"Directorio profile-pictures creado en: {profilePicturesPath}");
			}

			// Configurar archivos est�ticos
			builder.UseStaticFiles(new StaticFileOptions
			{
				FileProvider = new PhysicalFileProvider(webRootPath),
				RequestPath = "/uploads",
				OnPrepareResponse = ctx =>
				{
					// Opcional: Configurar headers de cache para im�genes
					if (ctx.File.Name.EndsWith(".jpg") || ctx.File.Name.EndsWith(".jpeg") ||
						ctx.File.Name.EndsWith(".png") || ctx.File.Name.EndsWith(".gif"))
					{
						ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=3600");
					}
				}
			});
		}
		private static void ConfigureMiddleware(WebApplication app)
		{
			app.UseCors("ReactPolicy");

			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}

			ConfigurarArchivoEstaticos(app);

			app.UseHttpsRedirection();
			app.UseStaticFiles();

			app.UseAuthentication();
			app.UseAuthorization();

			app.MapControllers();
			app.MapFallbackToFile("/index.html");
		}
	}
}

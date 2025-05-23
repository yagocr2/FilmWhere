
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using DotNetEnv;
using FilmWhere.Context;
using FilmWhere.Models;
using FilmWhere.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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

			//Configuración de la base de datos
			builder.Services.AddDbContext<MyDbContext>(options =>
				options.UseNpgsql(builder.Configuration
					.GetConnectionString("DefaultConnection")
					//,opt => opt.CommandTimeout(120))
					)
			);

			// Configuración de HttpClient para servicios externos
			ConfigureHttpClients(builder);

			// Servicios personalizados
			builder.Services.AddScoped<DataSyncService>();

			// Identity + JWT
			ConfigureIdentityAndJwt(builder);

			// Configuración de CORS
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
			// Configuración para TMDB
			builder.Services.AddHttpClient<TmdbService>(client =>
			{
				client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
				client.DefaultRequestHeaders.Accept.Add(
					new MediaTypeWithQualityHeaderValue("application/json"));
				client.DefaultRequestHeaders.Authorization =
					new AuthenticationHeaderValue("Bearer", builder.Configuration["Tmdb:ApiKey"]);
			});

			// Configuración para WatchMode
			builder.Services.AddHttpClient<WatchModeService>(client =>
			{
				client.BaseAddress = new Uri("https://api.watchmode.com/v1/");
				client.DefaultRequestHeaders.Accept.Add(
					new MediaTypeWithQualityHeaderValue("application/json"));
			});
		}
		private static void ConfigureIdentityAndJwt(WebApplicationBuilder builder)
		{
			builder.Services.AddIdentity<Usuario, IdentityRole>()
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
		private static void ConfigureMiddleware(WebApplication app)
		{
			app.UseCors("ReactPolicy");

			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}

			app.UseHttpsRedirection();
			app.UseStaticFiles();

			app.UseAuthentication();
			app.UseAuthorization();

			app.MapControllers();
			app.MapFallbackToFile("/index.html");
		}
	}
}

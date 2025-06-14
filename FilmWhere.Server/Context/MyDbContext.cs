﻿using FilmWhere.Models;
using FilmWhere.Server.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FilmWhere.Context
{
	/// <summary>
	/// Contexto de mi base de datos
	/// </summary>
	public class MyDbContext : IdentityDbContext<Usuario>
	{
		public DbSet<Usuario> Usuarios { get; set; }
		public DbSet<Denuncia> Denuncias { get; set; }
		public DbSet<UsuarioSeguidor> UsuarioSeguidor { get; set; }
		public DbSet<Pelicula> Peliculas { get; set; }
		public DbSet<Reseña> Reseñas { get; set; }
		public DbSet<Plataforma> Plataformas { get; set; }
		public DbSet<Genero> Generos { get; set; }
		public DbSet<Favorito> Favoritos { get; set; }
		public DbSet<PeliculaPlataforma> PeliculaPlataformas { get; set; }
		public DbSet<PeliculaGenero> PeliculaGeneros { get; set; }
		public MyDbContext(DbContextOptions<MyDbContext> options) : base(options)
		{
		}
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
			// ---- Configuración de Usuario ----
			modelBuilder.Entity<Usuario>()
				.HasIndex(u => u.Email)
				.IsUnique();

			modelBuilder.Entity<Reseña>()
				.HasIndex(r => new { r.UsuarioId, r.PeliculaId })
				.IsUnique();

			// Relación Reseña -> Usuario (CASCADE: se borran reseñas al borrar usuario)
			modelBuilder.Entity<Reseña>()
				.HasOne(r => r.Usuario)
				.WithMany(u => u.Reseñas)
				.HasForeignKey(r => r.UsuarioId)
				.OnDelete(DeleteBehavior.Cascade);

			// Relación Reseña -> Pelicula
			modelBuilder.Entity<Reseña>()
				.HasOne(r => r.Pelicula)
				.WithMany(p => p.Reseñas)
				.HasForeignKey(r => r.PeliculaId)
				.OnDelete(DeleteBehavior.Restrict);

			// ---- Configuración de Favorito ----
			modelBuilder.Entity<Favorito>()
				.HasKey(f => new { f.UsuarioId, f.PeliculaId });

			// Configuración de eliminación para Favorito (CASCADE: se borran favoritos al borrar usuario)
			modelBuilder.Entity<Favorito>()
				.HasOne(f => f.Usuario)
				.WithMany(u => u.Favoritos)
				.HasForeignKey(f => f.UsuarioId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<Favorito>()
				.HasOne(f => f.Pelicula)
				.WithMany(p => p.Favoritos)
				.HasForeignKey(f => f.PeliculaId)
				.OnDelete(DeleteBehavior.Restrict);

			// ---- Configuración de UsuarioSeguidor ----
			modelBuilder.Entity<UsuarioSeguidor>()
				.HasKey(us => new { us.SeguidorId, us.SeguidoId });

			// CASCADE: se borran relaciones de seguimiento al borrar usuario (como seguidor)
			modelBuilder.Entity<UsuarioSeguidor>()
				.HasOne(us => us.Seguidor)
				.WithMany(u => u.Seguidos)
				.HasForeignKey(us => us.SeguidorId)
				.OnDelete(DeleteBehavior.Cascade);

			// CASCADE: se borran relaciones de seguimiento al borrar usuario (como seguido)
			modelBuilder.Entity<UsuarioSeguidor>()
				.HasOne(us => us.Seguido)
				.WithMany(u => u.Seguidores)
				.HasForeignKey(us => us.SeguidoId)
				.OnDelete(DeleteBehavior.Cascade);

			// ---- Configuración de Denuncias ----
			// CASCADE: se borran denuncias recibidas al borrar usuario denunciado
			modelBuilder.Entity<Denuncia>()
				.HasOne(d => d.UsuarioDenunciado)
				.WithMany(u => u.DenunciasRecibidas)
				.HasForeignKey(d => d.UsuarioDenunciadoId)
				.OnDelete(DeleteBehavior.Cascade);

			// CASCADE: se borran denuncias realizadas al borrar usuario denunciante
			modelBuilder.Entity<Denuncia>()
				.HasOne(d => d.UsuarioDenunciante)
				.WithMany(u => u.DenunciasRealizadas)
				.HasForeignKey(d => d.UsuarioDenuncianteId)
				.OnDelete(DeleteBehavior.Cascade);

			// ---- Configuración de PeliculaPlataforma ----
			modelBuilder.Entity<PeliculaPlataforma>()
				.HasKey(pp => new { pp.PeliculaId, pp.PlataformaId });

			modelBuilder.Entity<PeliculaPlataforma>()
				.HasOne(pp => pp.Pelicula)
				.WithMany(p => p.Plataformas)
				.HasForeignKey(pp => pp.PeliculaId);

			modelBuilder.Entity<PeliculaPlataforma>()
				.HasOne(pp => pp.Plataforma)
				.WithMany(p => p.Peliculas)
				.HasForeignKey(pp => pp.PlataformaId);

			// ---- Configuración de PeliculaGenero ----
			modelBuilder.Entity<PeliculaGenero>()
				.HasKey(pg => new { pg.PeliculaId, pg.GeneroId });

			modelBuilder.Entity<PeliculaGenero>()
				.HasOne(pg => pg.Pelicula)
				.WithMany(p => p.Generos)
				.HasForeignKey(pg => pg.PeliculaId);

			modelBuilder.Entity<PeliculaGenero>()
				.HasOne(pg => pg.Genero)
				.WithMany(g => g.Peliculas)
				.HasForeignKey(pg => pg.GeneroId);
		}
	}
}
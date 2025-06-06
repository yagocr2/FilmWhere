using FilmWhere.Context;
using FilmWhere.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmWhere.Server.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	public class SeguidorController : ControllerBase
	{
		private readonly UserManager<Usuario> _userManager;
		private readonly MyDbContext _context;
		private readonly ILogger<SeguidorController> _logger;

		public SeguidorController(
			UserManager<Usuario> userManager,
			MyDbContext context,
			ILogger<SeguidorController> logger)
		{
			_userManager = userManager;
			_context = context;
			_logger = logger;
		}

		[HttpPost("follow/{userId}")]
		public async Task<IActionResult> FollowUser(string userId)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(currentUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				if (currentUserId == userId)
				{
					return BadRequest(new { Message = "No puedes seguirte a ti mismo" });
				}

				var userToFollow = await _userManager.FindByIdAsync(userId);
				if (userToFollow == null)
				{
					return NotFound(new { Message = "Usuario no encontrado" });
				}

				var existingFollow = await _context.UsuarioSeguidor
					.FirstOrDefaultAsync(us => us.SeguidorId == currentUserId && us.SeguidoId == userId);

				if (existingFollow != null)
				{
					return BadRequest(new { Message = "Ya sigues a este usuario" });
				}

				var follow = new UsuarioSeguidor
				{
					SeguidorId = currentUserId,
					SeguidoId = userId
				};

				_context.UsuarioSeguidor.Add(follow);
				await _context.SaveChangesAsync();

				return Ok(new { Message = "Usuario seguido exitosamente" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al seguir usuario");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpDelete("unfollow/{userId}")]
		public async Task<IActionResult> UnfollowUser(string userId)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(currentUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var follow = await _context.UsuarioSeguidor
					.FirstOrDefaultAsync(us => us.SeguidorId == currentUserId && us.SeguidoId == userId);

				if (follow == null)
				{
					return BadRequest(new { Message = "No sigues a este usuario" });
				}

				_context.UsuarioSeguidor.Remove(follow);
				await _context.SaveChangesAsync();

				return Ok(new { Message = "Has dejado de seguir al usuario" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al dejar de seguir usuario");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("is-following/{userId}")]
		public async Task<IActionResult> IsFollowing(string userId)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(currentUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var isFollowing = await _context.UsuarioSeguidor
					.AnyAsync(us => us.SeguidorId == currentUserId && us.SeguidoId == userId);

				return Ok(new { isFollowing });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al verificar seguimiento");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("followers")]
		public async Task<IActionResult> GetFollowers()
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(currentUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var followers = await _context.UsuarioSeguidor
					.Where(us => us.SeguidoId == currentUserId)
					.Select(us => new
					{
						us.Seguidor.Id,
						us.Seguidor.UserName,
						us.Seguidor.Nombre,
						us.Seguidor.Apellido,
						us.Seguidor.FotoPerfil
					})
					.ToListAsync();

				return Ok(followers);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener seguidores");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("following")]
		public async Task<IActionResult> GetFollowing()
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(currentUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var following = await _context.UsuarioSeguidor
					.Where(us => us.SeguidorId == currentUserId)
					.Select(us => new
					{
						us.Seguido.Id,
						us.Seguido.UserName,
						us.Seguido.Nombre,
						us.Seguido.Apellido,
						us.Seguido.FotoPerfil
					})
					.ToListAsync();

				return Ok(following);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener usuarios seguidos");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}

		[HttpGet("stats/{userId?}")]
		public async Task<IActionResult> GetFollowStats(string? userId = null)
		{
			try
			{
				var targetUserId = userId ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

				if (string.IsNullOrEmpty(targetUserId))
				{
					return Unauthorized(new { Message = "Token inválido" });
				}

				var followersCount = await _context.UsuarioSeguidor
					.CountAsync(us => us.SeguidoId == targetUserId);

				var followingCount = await _context.UsuarioSeguidor
					.CountAsync(us => us.SeguidorId == targetUserId);

				return Ok(new
				{
					followersCount,
					followingCount
				});
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error al obtener estadísticas de seguimiento");
				return StatusCode(500, new { Message = "Error interno del servidor" });
			}
		}
	}
}
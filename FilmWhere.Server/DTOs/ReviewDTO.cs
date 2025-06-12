namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// DTO para respuestas de Review
	/// </summary>
	public class ReviewDTO
	{
		/// <summary>
		/// Identificador
		/// </summary>
		public string Id { get; set; }
		/// <summary>
		/// Comentario
		/// </summary>
		public string Comment { get; set; }
		/// <summary>
		/// Puntuación
		/// </summary>
		public decimal Rating { get; set; }
		/// <summary>
		/// Fecha
		/// </summary>
		public DateTime Date { get; set; }
		/// <summary>
		/// Identificador del usuario
		/// </summary>
		public string UserName { get; set; }
		/// <summary>
		/// Identificador del usuario
		/// </summary>
		public string UserId { get; set; }
	}
}

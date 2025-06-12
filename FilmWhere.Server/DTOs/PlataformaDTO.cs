namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// DTO para respuestas de Plataforma
	/// </summary>
	public class PlataformaDTO
	{
		/// <summary>
		/// Id de la plataforma
		/// </summary>
		public int Id { get; set; }
		/// <summary>
		///	Nombre de la plataforma
		/// </summary>
		public string Name { get; set; }
		/// <summary>
		/// Tipo de la plataforma
		/// </summary>
		public string Type { get; set; }
		/// <summary>
		/// Precio de la plataforma
		/// </summary>
		public decimal? Price { get; set; }
		/// <summary>
		/// Url de la plataforma
		/// </summary>
		public string Url { get; set; }
	}
}

namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// Modelo para respuestas paginadas
	/// </summary>
	/// <typeparam name="T">Tipo de datos que se van a paginar</typeparam>
	public class PaginatedResponse<T>
	{
		/// <summary>
		/// Lista de elementos de la página actual
		/// </summary>
		public List<T> Data { get; set; } = new List<T>();

		/// <summary>
		/// Número de página actual
		/// </summary>
		public int CurrentPage { get; set; }

		/// <summary>
		/// Total de páginas disponibles
		/// </summary>
		public int TotalPages { get; set; }

		/// <summary>
		/// Total de elementos en toda la colección
		/// </summary>
		public int TotalItems { get; set; }

		/// <summary>
		/// Número de elementos por página
		/// </summary>
		public int ItemsPerPage { get; set; }

		/// <summary>
		/// Indica si existe una página siguiente
		/// </summary>
		public bool HasNextPage { get; set; }

		/// <summary>
		/// Indica si existe una página anterior
		/// </summary>
		public bool HasPreviousPage { get; set; }

		/// <summary>
		/// Número de la primera página (siempre 1)
		/// </summary>
		public int FirstPage => 1;

		/// <summary>
		/// Número de la última página
		/// </summary>
		public int LastPage => TotalPages;

		/// <summary>
		/// Número de elementos en la página actual
		/// </summary>
		public int ItemsInCurrentPage => Data?.Count ?? 0;
	}
}
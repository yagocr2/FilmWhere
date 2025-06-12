using System.Text.Json.Serialization;

namespace FilmWhere.Server.DTOs
{
	/// <summary>
	/// DTO para respuestas de WatchMode
	/// </summary>
	public static class WatchModeDTO
	{
		/// <summary>
		/// 
		/// </summary>
		/// <param name="Id"></param>
		/// <param name="Name"></param>
		/// <param name="Year"></param>
		/// <param name="Type"></param>
		public record WatchModeSearchResultDTO(int Id, string Name, int? Year, string Type);
		/// <summary>
		/// 
		/// </summary>
		/// <param name="Title_Results"></param>
		public record WatchModeSearchResponseDTO(List<WatchModeSearchResultDTO> Title_Results);
		/// <summary>
		/// 
		/// </summary>
		public class WatchModeSourceDTO
		{
			public int Source_Id { get; set; }
			public string Name { get; set; } = "";
			public string Type { get; set; } = "";
			public string Region { get; set; } = "";
			public string Web_Url { get; set; } = "";
			public string Format { get; set; } = "";
			public decimal? Price { get; set; }
			/// <summary>
			/// Converts the current instance to a <see cref="PlataformaDTO"/> object.
			/// </summary>
			/// <remarks>This method maps the properties of the current instance to a <see cref="PlataformaDTO"/>
			/// object, including translating the <c>Type</c> property to its Spanish equivalent and ensuring the <c>Url</c>
			/// property is never null.</remarks>
			/// <returns>A <see cref="PlataformaDTO"/> object containing the mapped properties of the current instance.</returns>
			public PlataformaDTO ToPlataformaDTO() => new()
			{
				Id = Source_Id,
				Name = Name,
				Type = MapTypeToSpanish(Type),
				Price = Price,
				Url = Web_Url ?? ""
			};
			/// <summary>
			/// Maps an English type identifier to its corresponding Spanish translation.
			/// </summary>
			/// <param name="type">The type identifier to map. Common values include "sub", "rent", "buy", "free".</param>
			/// <returns>A string containing the Spanish translation of the provided type identifier.  Returns "Suscripción" for "sub",
			/// "Alquiler" for "rent", "Compra" for "buy", "Gratis" for "free",  and "Otro" for any unrecognized or null input.</returns>
			private static string MapTypeToSpanish(string type) => type?.ToLower() switch
			{
				"sub" => "Suscripción",
				"rent" => "Alquiler",
				"buy" => "Compra",
				"free" => "Gratis",
				_ => "Otro"
			};
		}
	}
}

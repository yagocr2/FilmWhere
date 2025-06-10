using System.Text.Json.Serialization;

namespace FilmWhere.Server.DTOs
{
	public static class WatchModeDTO
	{
		public record WatchModeSearchResultDTO(int Id, string Name, int? Year, string Type);
		public record WatchModeSearchResponseDTO(List<WatchModeSearchResultDTO> Title_Results);

		public class WatchModeSourceDTO
		{
			public int Source_Id { get; set; }
			public string Name { get; set; } = "";
			public string Type { get; set; } = "";
			public string Region { get; set; } = "";
			public string Web_Url { get; set; } = "";
			public string Format { get; set; } = "";
			public decimal? Price { get; set; }

			public PlataformaDTO ToPlataformaDTO() => new()
			{
				Id = Source_Id,
				Name = Name,
				Type = MapTypeToSpanish(Type),
				Price = Price,
				Url = Web_Url ?? ""
			};

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

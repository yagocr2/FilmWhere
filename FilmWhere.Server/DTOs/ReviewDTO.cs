namespace FilmWhere.Server.DTOs
{
	public class ReviewDTO
	{
		public string Id { get; set; }
		public string Comment { get; set; }
		public decimal Rating { get; set; }
		public DateTime Date { get; set; }
		public string UserName { get; set; }
		public string UserId { get; set; }
	}
}

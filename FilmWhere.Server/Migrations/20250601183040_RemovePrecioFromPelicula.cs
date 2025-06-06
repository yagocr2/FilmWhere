using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemovePrecioFromPelicula : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Precio",
                table: "Peliculas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Precio",
                table: "Peliculas",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class actualizarPelis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sinopsis",
                table: "Peliculas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sinopsis",
                table: "Peliculas");
        }
    }
}

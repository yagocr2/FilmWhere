using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class AjusteRelacionPlataformas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Precio",
                table: "Plataformas");

            migrationBuilder.AddColumn<string>(
                name: "Enlace",
                table: "PeliculaPlataformas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Enlace",
                table: "PeliculaPlataformas");

            migrationBuilder.AddColumn<decimal>(
                name: "Precio",
                table: "Plataformas",
                type: "numeric",
                nullable: true);
        }
    }
}

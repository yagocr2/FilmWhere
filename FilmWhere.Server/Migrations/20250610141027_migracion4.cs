using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class migracion4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Enlace",
                table: "Plataformas");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Plataformas");

            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "PeliculaPlataformas",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "PeliculaPlataformas");

            migrationBuilder.AddColumn<string>(
                name: "Enlace",
                table: "Plataformas",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "Plataformas",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}

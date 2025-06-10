using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class denuncias2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioId",
                table: "Denuncias");

            migrationBuilder.DropIndex(
                name: "IX_Denuncias_UsuarioId",
                table: "Denuncias");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Denuncias");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioDenunciadoId",
                table: "Denuncias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioDenuncianteId",
                table: "Denuncias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_UsuarioDenunciadoId",
                table: "Denuncias",
                column: "UsuarioDenunciadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_UsuarioDenuncianteId",
                table: "Denuncias",
                column: "UsuarioDenuncianteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenunciadoId",
                table: "Denuncias",
                column: "UsuarioDenunciadoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenuncianteId",
                table: "Denuncias",
                column: "UsuarioDenuncianteId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenunciadoId",
                table: "Denuncias");

            migrationBuilder.DropForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenuncianteId",
                table: "Denuncias");

            migrationBuilder.DropIndex(
                name: "IX_Denuncias_UsuarioDenunciadoId",
                table: "Denuncias");

            migrationBuilder.DropIndex(
                name: "IX_Denuncias_UsuarioDenuncianteId",
                table: "Denuncias");

            migrationBuilder.DropColumn(
                name: "UsuarioDenunciadoId",
                table: "Denuncias");

            migrationBuilder.DropColumn(
                name: "UsuarioDenuncianteId",
                table: "Denuncias");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "Denuncias",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_UsuarioId",
                table: "Denuncias",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioId",
                table: "Denuncias",
                column: "UsuarioId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}

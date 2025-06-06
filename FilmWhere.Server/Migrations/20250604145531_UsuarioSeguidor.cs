using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class UsuarioSeguidor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidoId",
                table: "UsuarioSeguidor");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidorId",
                table: "UsuarioSeguidor");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UsuarioSeguidor",
                table: "UsuarioSeguidor");

            migrationBuilder.RenameTable(
                name: "UsuarioSeguidor",
                newName: "UsuarioSegidor");

            migrationBuilder.RenameIndex(
                name: "IX_UsuarioSeguidor_SeguidoId",
                table: "UsuarioSegidor",
                newName: "IX_UsuarioSegidor_SeguidoId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UsuarioSegidor",
                table: "UsuarioSegidor",
                columns: new[] { "SeguidorId", "SeguidoId" });

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSegidor_AspNetUsers_SeguidoId",
                table: "UsuarioSegidor",
                column: "SeguidoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSegidor_AspNetUsers_SeguidorId",
                table: "UsuarioSegidor",
                column: "SeguidorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSegidor_AspNetUsers_SeguidoId",
                table: "UsuarioSegidor");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSegidor_AspNetUsers_SeguidorId",
                table: "UsuarioSegidor");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UsuarioSegidor",
                table: "UsuarioSegidor");

            migrationBuilder.RenameTable(
                name: "UsuarioSegidor",
                newName: "UsuarioSeguidor");

            migrationBuilder.RenameIndex(
                name: "IX_UsuarioSegidor_SeguidoId",
                table: "UsuarioSeguidor",
                newName: "IX_UsuarioSeguidor_SeguidoId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UsuarioSeguidor",
                table: "UsuarioSeguidor",
                columns: new[] { "SeguidorId", "SeguidoId" });

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidoId",
                table: "UsuarioSeguidor",
                column: "SeguidoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidorId",
                table: "UsuarioSeguidor",
                column: "SeguidorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

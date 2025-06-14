using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmWhere.Server.Migrations
{
    /// <inheritdoc />
    public partial class borrado_en_cascada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenunciadoId",
                table: "Denuncias");

            migrationBuilder.DropForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenuncianteId",
                table: "Denuncias");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidoId",
                table: "UsuarioSeguidor");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidorId",
                table: "UsuarioSeguidor");

            migrationBuilder.AddForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenunciadoId",
                table: "Denuncias",
                column: "UsuarioDenunciadoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Denuncias_AspNetUsers_UsuarioDenuncianteId",
                table: "Denuncias",
                column: "UsuarioDenuncianteId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidoId",
                table: "UsuarioSeguidor",
                column: "SeguidoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidorId",
                table: "UsuarioSeguidor",
                column: "SeguidorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidoId",
                table: "UsuarioSeguidor");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioSeguidor_AspNetUsers_SeguidorId",
                table: "UsuarioSeguidor");

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

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImportJobItemDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category_name",
                table: "import_job_items",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_350_url",
                table: "import_job_items",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "import_job_items",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "import_job_items",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tags",
                table: "import_job_items",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "category_name",
                table: "import_job_items");

            migrationBuilder.DropColumn(
                name: "image_350_url",
                table: "import_job_items");

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "import_job_items");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "import_job_items");

            migrationBuilder.DropColumn(
                name: "tags",
                table: "import_job_items");
        }
    }
}

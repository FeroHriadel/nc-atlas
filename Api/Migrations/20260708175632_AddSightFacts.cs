using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSightFacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sight_fact_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    sight_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    previous_job_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    feedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    result = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    error_message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    saved_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sight_fact_jobs", x => x.id);
                    table.ForeignKey(
                        name: "FK_sight_fact_jobs_sight_fact_jobs_previous_job_id",
                        column: x => x.previous_job_id,
                        principalTable: "sight_fact_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sight_fact_jobs_sights_sight_id",
                        column: x => x.sight_id,
                        principalTable: "sights",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sight_facts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    sight_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sight_facts", x => x.id);
                    table.ForeignKey(
                        name: "FK_sight_facts_sights_sight_id",
                        column: x => x.sight_id,
                        principalTable: "sights",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sight_fact_jobs_previous_job_id",
                table: "sight_fact_jobs",
                column: "previous_job_id");

            migrationBuilder.CreateIndex(
                name: "IX_sight_fact_jobs_sight_id_created_at",
                table: "sight_fact_jobs",
                columns: new[] { "sight_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_sight_facts_sight_id",
                table: "sight_facts",
                column: "sight_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sight_fact_jobs");

            migrationBuilder.DropTable(
                name: "sight_facts");
        }
    }
}

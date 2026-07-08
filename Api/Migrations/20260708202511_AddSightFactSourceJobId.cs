using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSightFactSourceJobId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "source_job_id",
                table: "sight_facts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_sight_facts_source_job_id",
                table: "sight_facts",
                column: "source_job_id");

            migrationBuilder.AddForeignKey(
                name: "FK_sight_facts_sight_fact_jobs_source_job_id",
                table: "sight_facts",
                column: "source_job_id",
                principalTable: "sight_fact_jobs",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sight_facts_sight_fact_jobs_source_job_id",
                table: "sight_facts");

            migrationBuilder.DropIndex(
                name: "IX_sight_facts_source_job_id",
                table: "sight_facts");

            migrationBuilder.DropColumn(
                name: "source_job_id",
                table: "sight_facts");
        }
    }
}

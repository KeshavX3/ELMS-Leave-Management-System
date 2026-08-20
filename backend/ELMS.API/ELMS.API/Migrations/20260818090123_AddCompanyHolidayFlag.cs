using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyHolidayFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCompanyHoliday",
                table: "Holidays",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Holidays_Name_Date",
                table: "Holidays",
                columns: new[] { "Name", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Holidays_Name_Date",
                table: "Holidays");

            migrationBuilder.DropColumn(
                name: "IsCompanyHoliday",
                table: "Holidays");
        }
    }
}

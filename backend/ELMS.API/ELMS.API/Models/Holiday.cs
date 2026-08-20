using System.ComponentModel.DataAnnotations;

namespace ELMS.API.Models
{
    public class Holiday
    {
        public int Id { get; set; }

        [Required, MaxLength(120)]
        public string Name { get; set; } = "";

        public DateTime Date { get; set; }

        public bool IsOptional { get; set; }

        // False = Government/Public holiday
        // True = Company-specific holiday
        public bool IsCompanyHoliday { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
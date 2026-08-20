using System.ComponentModel.DataAnnotations;

namespace ELMS.API.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = "";

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property
        public ICollection<Employee> Employees { get; set; }
            = new List<Employee>();
    }
}
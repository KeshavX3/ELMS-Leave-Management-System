using System.ComponentModel.DataAnnotations;

namespace ELMS.API.Models
{
    public class Employee
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string EmployeeCode { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = "";

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = "";

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = "";

        [Required]
        public string PasswordHash { get; set; } = "";

        public DateTime? DateOfBirth { get; set; }

        public DateTime JoiningDate { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Gender { get; set; } = "";

        public int? DepartmentId { get; set; }

        public int? ManagerId { get; set; }

        [Required]
        public string Role { get; set; } = "Employee";

        [Required]
        public string Status { get; set; } = "Active";

        public string? ProfileImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties

        public Department? Department { get; set; }

        public Employee? Manager { get; set; }

        public ICollection<Employee> Subordinates { get; set; }
            = new List<Employee>();
    }
}
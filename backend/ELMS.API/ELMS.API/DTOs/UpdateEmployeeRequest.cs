namespace ELMS.API.DTOs
{
    public class UpdateEmployeeRequest
    {
        public string EmployeeCode { get; set; } = "";

        public string FirstName { get; set; } = "";

        public string LastName { get; set; } = "";

        public string Email { get; set; } = "";

        public string PhoneNumber { get; set; } = "";

        public DateTime? DateOfBirth { get; set; }

        public DateTime JoiningDate { get; set; }

        public string Gender { get; set; } = "";

        public int? DepartmentId { get; set; }

        public int? ManagerId { get; set; }

        public string Role { get; set; } = "Employee";

        public string Status { get; set; } = "Active";

        public string? ProfileImageUrl { get; set; }
    }
}
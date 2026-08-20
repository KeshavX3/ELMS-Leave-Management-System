namespace ELMS.API.Models
{
    public class LeaveBalance
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        public int LeaveTypeId { get; set; }

        public int AllocatedDays { get; set; }

        public int UsedDays { get; set; }

        public int RemainingDays { get; set; }

        public int Year { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties

        public Employee? Employee { get; set; }

        public LeaveType? LeaveType { get; set; }
    }
}
namespace ELMS.API.Models
{
    public class LeaveRequest
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        public int LeaveTypeId { get; set; }

        public DateTime FromDate { get; set; }

        public DateTime ToDate { get; set; }

        public int TotalDays { get; set; }

        public string Reason { get; set; } = "";

        public string Status { get; set; } = "Pending";

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public int? ApprovedById { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public string? RejectionReason { get; set; }

        // Navigation properties

        public Employee? Employee { get; set; }

        public LeaveType? LeaveType { get; set; }

        public Employee? ApprovedBy { get; set; }
    }
}
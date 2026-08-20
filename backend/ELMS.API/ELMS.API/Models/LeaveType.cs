namespace ELMS.API.Models
{
    public class LeaveType
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";

        public string Code { get; set; } = "";

        public string? Description { get; set; }

        public int DefaultDays { get; set; }

        public bool IsPaid { get; set; }

        public bool RequiresApproval { get; set; } = true;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
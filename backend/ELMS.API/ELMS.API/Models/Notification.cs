using System.ComponentModel.DataAnnotations;

namespace ELMS.API.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // Employee who should receive the notification
        public int EmployeeId { get; set; }

        [Required, MaxLength(200)]
        public string Message { get; set; } = "";

        [MaxLength(50)]
        public string Type { get; set; } = "General";

        // Optional reference to a leave request
        public int? LeaveRequestId { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Employee? Employee { get; set; }

        public LeaveRequest? LeaveRequest { get; set; }
    }
}
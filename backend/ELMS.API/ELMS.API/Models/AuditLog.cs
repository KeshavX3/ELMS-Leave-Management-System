using System.ComponentModel.DataAnnotations;

namespace ELMS.API.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [Required, MaxLength(80)]
        public string Action { get; set; } = "";

        [Required, MaxLength(80)]
        public string EntityType { get; set; } = "";

        public int? EntityId { get; set; }

        public int? PerformedById { get; set; }

        [MaxLength(600)]
        public string Details { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Employee? PerformedBy { get; set; }
    }
}

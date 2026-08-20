using ELMS.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Controllers
{
    [ApiController, Route("api/audit-logs"), Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AuditLogsController(AppDbContext context) => _context = context;
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
        {
            page = Math.Max(page, 1); pageSize = Math.Clamp(pageSize, 5, 100);
            var query = _context.AuditLogs.Include(log => log.PerformedBy).AsQueryable();
            if (!string.IsNullOrWhiteSpace(search)) query = query.Where(log => log.Action.Contains(search) || log.EntityType.Contains(search) || log.Details.Contains(search));
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(log => log.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).Select(log => new { log.Id, log.Action, log.EntityType, log.EntityId, log.Details, log.CreatedAt, performedBy = log.PerformedBy == null ? "System" : log.PerformedBy.FirstName + " " + log.PerformedBy.LastName }).ToListAsync();
            return Ok(new { items, total, page, pageSize });
        }
    }
}

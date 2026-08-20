using ELMS.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Controllers
{
    [ApiController, Route("api/reports"), Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReportsController(AppDbContext context) => _context = context;
        [HttpGet("leave-summary")]
        public async Task<IActionResult> LeaveSummary([FromQuery] int? year)
        {
            var selectedYear = year ?? DateTime.UtcNow.Year;
            var requests = _context.LeaveRequests.Where(r => r.FromDate.Year == selectedYear);
            return Ok(new { year = selectedYear, totalRequests = await requests.CountAsync(), totalDays = await requests.Where(r => r.Status == "Approved").SumAsync(r => (int?)r.TotalDays) ?? 0, byStatus = await requests.GroupBy(r => r.Status).Select(group => new { status = group.Key, count = group.Count() }).ToListAsync(), byLeaveType = await requests.Include(r => r.LeaveType).GroupBy(r => r.LeaveType!.Name).Select(group => new { leaveType = group.Key, days = group.Where(r => r.Status == "Approved").Sum(r => r.TotalDays) }).ToListAsync() });
        }
    }
}

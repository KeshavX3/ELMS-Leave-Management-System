using ELMS.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController, Route("api/dashboard"), Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DashboardController(AppDbContext context) => _context = context;
        private int? EmployeeId() => int.TryParse(User.FindFirstValue("EmployeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

        [HttpGet("admin"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Admin() => Ok(new {
            employees = await _context.Employees.CountAsync(e => e.Status == "Active"),
            departments = await _context.Departments.CountAsync(d => d.IsActive),
            leaveTypes = await _context.LeaveTypes.CountAsync(t => t.IsActive),
            pendingRequests = await _context.LeaveRequests.CountAsync(r => r.Status == "Pending")
        });

        [HttpGet("manager"), Authorize(Roles = "Manager")]
        public async Task<IActionResult> Manager()
        {
            var id = EmployeeId(); if (id == null) return Unauthorized();
            var team = _context.Employees.Where(e => e.ManagerId == id && e.Status == "Active");
            return Ok(new { teamMembers = await team.CountAsync(), pendingRequests = await _context.LeaveRequests.CountAsync(r => r.Status == "Pending" && r.Employee!.ManagerId == id), outThisWeek = await _context.LeaveRequests.CountAsync(r => r.Status == "Approved" && r.Employee!.ManagerId == id && r.FromDate <= DateTime.UtcNow.AddDays(7) && r.ToDate >= DateTime.UtcNow.Date) });
        }

        [HttpGet("employee"), Authorize(Roles = "Employee")]
        public async Task<IActionResult> Employee()
        {
            var id = EmployeeId(); if (id == null) return Unauthorized();
            var year = DateTime.UtcNow.Year;
            return Ok(new { pendingRequests = await _context.LeaveRequests.CountAsync(r => r.EmployeeId == id && r.Status == "Pending"), approvedRequests = await _context.LeaveRequests.CountAsync(r => r.EmployeeId == id && r.Status == "Approved"), remainingDays = await _context.LeaveBalances.Where(b => b.EmployeeId == id && b.Year == year).SumAsync(b => (int?)b.RemainingDays) ?? 0 });
        }
    }
}

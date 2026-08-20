using ELMS.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/manager")]
    [Authorize(Roles = "Manager")]
    public class ManagerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ManagerController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET MY TEAM
        // =========================================================

        [HttpGet("team")]
        public async Task<IActionResult> GetMyTeam()
        {
            var managerId = GetEmployeeId();

            if (managerId == null)
            {
                return Unauthorized(new
                {
                    message = "Manager identity not found."
                });
            }

            var employees = await _context.Employees
                .Where(e =>
                    e.ManagerId == managerId.Value &&
                    e.Status == "Active")
                .Include(e => e.Department)
                .OrderBy(e => e.FirstName)
                .Select(e => new
                {
                    e.Id,
                    e.EmployeeCode,
                    e.FirstName,
                    e.LastName,
                    e.Email,
                    e.PhoneNumber,
                    e.Status,
                    e.Role,

                    Department = e.Department == null
                        ? null
                        : new
                        {
                            e.Department.Id,
                            e.Department.Name,
                            e.Department.Code
                        }
                })
                .ToListAsync();

            return Ok(employees);
        }

        // =========================================================
        // GET TEAM LEAVE BALANCES
        // =========================================================

        [HttpGet("team-balances")]
        public async Task<IActionResult> GetTeamBalances()
        {
            var managerId = GetEmployeeId();

            if (managerId == null)
            {
                return Unauthorized(new
                {
                    message = "Manager identity not found."
                });
            }

            var year = DateTime.UtcNow.Year;

            var balances = await _context.LeaveBalances
                .Include(lb => lb.Employee)
                .Include(lb => lb.LeaveType)
                .Where(lb =>
                    lb.Employee!.ManagerId == managerId.Value &&
                    lb.Year == year)
                .Select(lb => new
                {
                    lb.Id,

                    Employee = new
                    {
                        lb.Employee!.Id,
                        lb.Employee.EmployeeCode,
                        lb.Employee.FirstName,
                        lb.Employee.LastName
                    },

                    LeaveType = lb.LeaveType == null
                        ? null
                        : new
                        {
                            lb.LeaveType.Id,
                            lb.LeaveType.Name,
                            lb.LeaveType.Code
                        },

                    lb.AllocatedDays,
                    lb.UsedDays,
                    lb.RemainingDays,
                    lb.Year
                })
                .OrderBy(x => x.Employee.FirstName)
                .ToListAsync();

            return Ok(balances);
        }

        // =========================================================
        // GET CURRENT MANAGER ID FROM JWT
        // =========================================================

        private int? GetEmployeeId()
        {
            var claim =
                User.FindFirst("EmployeeId") ??
                User.FindFirst(ClaimTypes.NameIdentifier);

            return int.TryParse(
                claim?.Value,
                out var employeeId)
                ? employeeId
                : null;
        }
    }
}
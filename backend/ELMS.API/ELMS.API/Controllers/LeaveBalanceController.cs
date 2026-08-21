using ELMS.API.Data;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/leave-balances")]
    [Authorize]
    public class LeaveBalanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveBalanceController(
            AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET CURRENT EMPLOYEE BALANCES
        // ============================================

        [HttpGet("employee/{employeeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetEmployeeBalances(
            int employeeId)
        {
            var balances = await _context.LeaveBalances
                .Include(lb => lb.LeaveType)
                .Where(lb =>
                    lb.EmployeeId == employeeId &&
                    lb.Year == DateTime.UtcNow.Year)
                .OrderBy(lb => lb.LeaveType!.Name)
                .Select(lb => new
                {
                    lb.Id,
                    lb.EmployeeId,
                    lb.LeaveTypeId,

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
                .ToListAsync();

            return Ok(balances);
        }

        // ============================================
        // GET ALL BALANCES
        // ADMIN
        // ============================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllBalances()
        {
            var balances = await _context.LeaveBalances
                .Include(lb => lb.Employee)
                .Include(lb => lb.LeaveType)
                .Where(lb =>
                    lb.Year == DateTime.UtcNow.Year)
                .OrderBy(lb => lb.Employee!.FirstName)
                .ThenBy(lb => lb.LeaveType!.Name)
                .Select(lb => new
                {
                    lb.Id,

                    Employee = lb.Employee == null
                        ? null
                        : new
                        {
                            lb.Employee.Id,
                            lb.Employee.EmployeeCode,
                            lb.Employee.FirstName,
                            lb.Employee.LastName,
                            lb.Employee.Email
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
                .ToListAsync();

            return Ok(balances);
        }

        // ============================================
        // GENERATE BALANCES FOR EMPLOYEE
        // ============================================

        [HttpPost("generate/{employeeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateBalances(
            int employeeId)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e =>
                    e.Id == employeeId &&
                    e.Status != "Inactive");

            if (employee == null)
            {
                return NotFound(new
                {
                    message =
                        "Active employee not found."
                });
            }

            var leaveTypes = await _context.LeaveTypes
                .Where(lt => lt.IsActive)
                .ToListAsync();

            if (!leaveTypes.Any())
            {
                return BadRequest(new
                {
                    message =
                        "No active leave types exist."
                });
            }

            var currentYear = DateTime.UtcNow.Year;

            foreach (var leaveType in leaveTypes)
            {
                var alreadyExists =
                    await _context.LeaveBalances
                        .AnyAsync(lb =>
                            lb.EmployeeId == employeeId &&
                            lb.LeaveTypeId == leaveType.Id &&
                            lb.Year == currentYear);

                if (alreadyExists)
                {
                    continue;
                }

                var balance = new LeaveBalance
                {
                    EmployeeId = employeeId,

                    LeaveTypeId = leaveType.Id,

                    AllocatedDays =
                        leaveType.DefaultDays,

                    UsedDays = 0,

                    RemainingDays =
                        leaveType.DefaultDays,

                    Year = currentYear,

                    CreatedAt = DateTime.UtcNow
                };

                _context.LeaveBalances.Add(balance);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave balances generated successfully.",

                employeeId,

                year = currentYear
            });
        }

        // ============================================
        // UPDATE BALANCE
        // ADMIN
        // ============================================

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBalance(
            int id,
            [FromBody] UpdateLeaveBalanceRequest request)
        {
            var balance = await _context.LeaveBalances
                .FindAsync(id);

            if (balance == null)
            {
                return NotFound(new
                {
                    message =
                        "Leave balance not found."
                });
            }

            if (request.AllocatedDays < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Allocated days cannot be negative."
                });
            }

            if (request.UsedDays < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Used days cannot be negative."
                });
            }

            if (request.UsedDays >
                request.AllocatedDays)
            {
                return BadRequest(new
                {
                    message =
                        "Used days cannot exceed allocated days."
                });
            }

            balance.AllocatedDays =
                request.AllocatedDays;

            balance.UsedDays =
                request.UsedDays;

            balance.RemainingDays =
                request.AllocatedDays -
                request.UsedDays;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave balance updated successfully."
            });
        }
        [HttpGet("my")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyBalance()
        {
            var employeeIdClaim = User.FindFirst("EmployeeId") ??
                User.FindFirst(ClaimTypes.NameIdentifier);

            if (!int.TryParse(employeeIdClaim?.Value, out int employeeId))
            {
                return Unauthorized(new
                {
                    message = "Invalid employee identity."
                });
            }

            // Backfill the current year for existing employees created before
            // automatic balance generation was introduced.
            var currentYear = DateTime.UtcNow.Year;
            var activeLeaveTypes = await _context.LeaveTypes
                .Where(leaveType => leaveType.IsActive)
                .ToListAsync();

            var existingLeaveTypeIds = await _context.LeaveBalances
                .Where(balance => balance.EmployeeId == employeeId &&
                    balance.Year == currentYear)
                .Select(balance => balance.LeaveTypeId)
                .ToListAsync();

            foreach (var leaveType in activeLeaveTypes
                .Where(leaveType => !existingLeaveTypeIds.Contains(leaveType.Id)))
            {
                _context.LeaveBalances.Add(new LeaveBalance
                {
                    EmployeeId = employeeId,
                    LeaveTypeId = leaveType.Id,
                    AllocatedDays = leaveType.DefaultDays,
                    UsedDays = 0,
                    RemainingDays = leaveType.DefaultDays,
                    Year = currentYear,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            var balances =
                await _context.LeaveBalances
                    .Include(lb => lb.LeaveType)
                    .Where(lb =>
                        lb.EmployeeId == employeeId &&
                        lb.Year == currentYear)
                    .Select(lb => new
                    {
                        lb.Id,
                        lb.EmployeeId,
                        lb.LeaveTypeId,

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
                    .ToListAsync();

            return Ok(balances);
        }
    }

    // ============================================
    // UPDATE REQUEST
    // ============================================

    public class UpdateLeaveBalanceRequest
    {
        public int AllocatedDays { get; set; }

        public int UsedDays { get; set; }
    }
}

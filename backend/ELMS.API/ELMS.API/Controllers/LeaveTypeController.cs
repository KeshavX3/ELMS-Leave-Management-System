using ELMS.API.Data;
using ELMS.API.DTOs;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/leave-types")]
    [Authorize]
    public class LeaveTypeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveTypeController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET ALL LEAVE TYPES
        // ============================================

        [HttpGet]
        public async Task<IActionResult> GetLeaveTypes()
        {
            var leaveTypes = await _context.LeaveTypes
                .Where(l => l.IsActive)
                .OrderBy(l => l.Name)
                .Select(l => new
                {
                    l.Id,
                    l.Name,
                    l.Code,
                    l.Description,
                    l.DefaultDays,
                    l.IsPaid,
                    l.RequiresApproval,
                    l.IsActive
                })
                .ToListAsync();

            return Ok(leaveTypes);
        }

        // ============================================
        // GET LEAVE TYPE BY ID
        // ============================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLeaveType(int id)
        {
            var leaveType = await _context.LeaveTypes
                .Where(l => l.Id == id)
                .Select(l => new
                {
                    l.Id,
                    l.Name,
                    l.Code,
                    l.Description,
                    l.DefaultDays,
                    l.IsPaid,
                    l.RequiresApproval,
                    l.IsActive
                })
                .FirstOrDefaultAsync();

            if (leaveType == null)
            {
                return NotFound(new
                {
                    message = "Leave type not found."
                });
            }

            return Ok(leaveType);
        }

        // ============================================
        // CREATE LEAVE TYPE
        // ============================================

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateLeaveType(
            LeaveType leaveType)
        {
            if (leaveType.DefaultDays < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Default leave days cannot be negative."
                });
            }

            var nameExists = await _context.LeaveTypes
                .AnyAsync(l =>
                    l.Name == leaveType.Name &&
                    l.IsActive);

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "A leave type with this name already exists."
                });
            }

            var codeExists = await _context.LeaveTypes
                .AnyAsync(l =>
                    l.Code == leaveType.Code &&
                    l.IsActive);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message =
                        "A leave type with this code already exists."
                });
            }

            leaveType.Id = 0;
            leaveType.IsActive = true;
            leaveType.CreatedAt = DateTime.UtcNow;

            _context.LeaveTypes.Add(leaveType);

            await _context.SaveChangesAsync();

            // A new leave type should also be available to employees who
            // already exist, not only to employees created later.
            var employeeIds = await _context.Employees
                .Where(employee => employee.Status != "Inactive")
                .Select(employee => employee.Id)
                .ToListAsync();

            var currentYear = DateTime.UtcNow.Year;
            foreach (var employeeId in employeeIds)
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

            return Ok(new
            {
                message =
                    "Leave type created successfully.",

                leaveTypeId = leaveType.Id
            });
        }

        // ============================================
        // UPDATE LEAVE TYPE
        // ============================================

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateLeaveType(
            int id,
            UpdateLeaveTypeRequest request)
        {
            var leaveType = await _context.LeaveTypes
                .FindAsync(id);

            if (leaveType == null)
            {
                return NotFound(new
                {
                    message =
                        "Leave type not found."
                });
            }

            if (request.DefaultDays < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Default leave days cannot be negative."
                });
            }

            var nameExists = await _context.LeaveTypes
                .AnyAsync(l =>
                    l.Name == request.Name &&
                    l.Id != id &&
                    l.IsActive);

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another leave type already uses this name."
                });
            }

            var codeExists = await _context.LeaveTypes
                .AnyAsync(l =>
                    l.Code == request.Code &&
                    l.Id != id &&
                    l.IsActive);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another leave type already uses this code."
                });
            }

            leaveType.Name = request.Name;

            leaveType.Code = request.Code;

            leaveType.Description =
                request.Description;

            leaveType.DefaultDays =
                request.DefaultDays;

            leaveType.IsPaid =
                request.IsPaid;

            leaveType.RequiresApproval =
                request.RequiresApproval;

            leaveType.IsActive =
                request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave type updated successfully."
            });
        }

        // ============================================
        // DEACTIVATE LEAVE TYPE
        // ============================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteLeaveType(
            int id)
        {
            var leaveType = await _context.LeaveTypes
                .FindAsync(id);

            if (leaveType == null)
            {
                return NotFound(new
                {
                    message =
                        "Leave type not found."
                });
            }

            leaveType.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave type deactivated successfully."
            });
        }
    }
}

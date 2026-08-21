using ELMS.API.Data;
using ELMS.API.DTOs;
using ELMS.API.Models;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/employees")]
    [Authorize(Roles = "Admin")]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET ALL EMPLOYEES
        // ============================================

        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _context.Employees
                .Where(e => e.Status != "Inactive")
                .Include(e => e.Department)
                .Include(e => e.Manager)
                .OrderBy(e => e.FirstName)
                .Select(e => new
                {
                    e.Id,
                    e.EmployeeCode,
                    e.FirstName,
                    e.LastName,
                    e.Email,
                    e.PhoneNumber,
                    e.DateOfBirth,
                    e.JoiningDate,
                    e.Gender,
                    e.Role,
                    e.Status,

                    Department = e.Department == null
                        ? null
                        : new
                        {
                            e.Department.Id,
                            e.Department.Name,
                            e.Department.Code
                        },

                    Manager = e.Manager == null
                        ? null
                        : new
                        {
                            e.Manager.Id,
                            e.Manager.FirstName,
                            e.Manager.LastName,
                            e.Manager.Email
                        }
                })
                .ToListAsync();

            return Ok(employees);
        }

        // ============================================
        // GET EMPLOYEE BY ID
        // ============================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Manager)
                .Where(e => e.Id == id)
                .Select(e => new
                {
                    e.Id,
                    e.EmployeeCode,
                    e.FirstName,
                    e.LastName,
                    e.Email,
                    e.PhoneNumber,
                    e.DateOfBirth,
                    e.JoiningDate,
                    e.Gender,
                    e.Role,
                    e.Status,

                    Department = e.Department == null
                        ? null
                        : new
                        {
                            e.Department.Id,
                            e.Department.Name,
                            e.Department.Code
                        },

                    Manager = e.Manager == null
                        ? null
                        : new
                        {
                            e.Manager.Id,
                            e.Manager.FirstName,
                            e.Manager.LastName,
                            e.Manager.Email
                        }
                })
                .FirstOrDefaultAsync();

            if (employee == null)
            {
                return NotFound("Employee not found.");
            }

            return Ok(employee);
        }

        // ============================================
        // CREATE EMPLOYEE
        // ============================================

        [HttpPost]
        public async Task<IActionResult> CreateEmployee(Employee employee)
        {
            var emailExists = await _context.Employees
                .AnyAsync(e => e.Email == employee.Email);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "An employee with this email already exists."
                });
            }

            var codeExists = await _context.Employees
                .AnyAsync(e => e.EmployeeCode == employee.EmployeeCode);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message = "Employee code already exists."
                });
            }

            if (employee.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .AnyAsync(d => d.Id == employee.DepartmentId);

                if (!departmentExists)
                {
                    return BadRequest(new
                    {
                        message = "Selected department does not exist."
                    });
                }
            }

            if (employee.ManagerId.HasValue)
            {
                var managerExists = await _context.Employees
                    .AnyAsync(e =>
                        e.Id == employee.ManagerId &&
                        e.Role == "Manager" &&
                        e.Status == "Active");

                if (!managerExists)
                {
                    return BadRequest(new
                    {
                        message = "Selected reporting manager is not active or does not exist."
                    });
                }
            }

            employee.Id = 0;
            employee.CreatedAt = DateTime.UtcNow;
            employee.Status = "Active";

            // Hash the password before persisting — never store plain-text.
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(employee.PasswordHash);

            _context.Employees.Add(employee);

            await _context.SaveChangesAsync();

            // Give every new active employee the allowance configured on
            // each active leave type for the current year.
            var leaveTypes = await _context.LeaveTypes
                .Where(leaveType => leaveType.IsActive)
                .ToListAsync();

            var currentYear = DateTime.UtcNow.Year;
            foreach (var leaveType in leaveTypes)
            {
                _context.LeaveBalances.Add(new LeaveBalance
                {
                    EmployeeId = employee.Id,
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
                message = "Employee created successfully.",
                employeeId = employee.Id,
                balancesGenerated = leaveTypes.Count
            });
        }

        // ============================================
        // UPDATE EMPLOYEE
        // ============================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(
            int id,
            UpdateEmployeeRequest request)
        {
            var employee = await _context.Employees
                .FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            // Check duplicate email
            var emailExists = await _context.Employees
                .AnyAsync(e =>
                    e.Email == request.Email &&
                    e.Id != id);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Another employee already uses this email."
                });
            }

            // Check duplicate employee code
            var codeExists = await _context.Employees
                .AnyAsync(e =>
                    e.EmployeeCode == request.EmployeeCode &&
                    e.Id != id);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message = "Another employee already uses this employee code."
                });
            }

            // Check department
            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .AnyAsync(d => d.Id == request.DepartmentId);

                if (!departmentExists)
                {
                    return BadRequest(new
                    {
                        message = "Selected department does not exist."
                    });
                }
            }

            if (request.ManagerId == id)
            {
                return BadRequest(new
                {
                    message = "An employee cannot be their own reporting manager."
                });
            }

            if (request.ManagerId.HasValue)
            {
                var managerExists = await _context.Employees
                    .AnyAsync(e =>
                        e.Id == request.ManagerId &&
                        e.Role == "Manager" &&
                        e.Status == "Active");

                if (!managerExists)
                {
                    return BadRequest(new
                    {
                        message = "Selected reporting manager is not active or does not exist."
                    });
                }
            }

            // Update employee information
            employee.EmployeeCode = request.EmployeeCode;

            employee.FirstName = request.FirstName;

            employee.LastName = request.LastName;

            employee.Email = request.Email;

            employee.PhoneNumber = request.PhoneNumber;

            employee.DateOfBirth = request.DateOfBirth;

            employee.JoiningDate = request.JoiningDate;

            employee.Gender = request.Gender;

            employee.DepartmentId = request.DepartmentId;

            employee.ManagerId = request.ManagerId;

            employee.Role = request.Role;

            employee.Status = request.Status;

            employee.ProfileImageUrl = request.ProfileImageUrl;

            // IMPORTANT:
            // PasswordHash is intentionally NOT changed here.

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Employee updated successfully."
            });
        }

        // ============================================
        // DEACTIVATE EMPLOYEE
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _context.Employees
                .FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            // Soft delete
            employee.Status = "Inactive";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Employee deactivated successfully."
            });
        }

        // ============================================
        // CHANGE PASSWORD
        // ============================================

        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(
            int id,
            [FromBody] ChangePasswordRequest request)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
            {
                return NotFound(new { message = "Employee not found." });
            }

            // Verify the current password first.
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, employee.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }
    }
}

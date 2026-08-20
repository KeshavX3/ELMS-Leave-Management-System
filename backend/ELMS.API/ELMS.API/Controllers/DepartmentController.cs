using ELMS.API.Data;
using ELMS.API.DTOs;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/departments")]
    [Authorize(Roles = "Admin")]
    public class DepartmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET ALL DEPARTMENTS
        // ============================================

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            var departments = await _context.Departments
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Code,
                    d.Description,
                    d.IsActive
                })
                .ToListAsync();

            return Ok(departments);
        }

        // ============================================
        // GET DEPARTMENT BY ID
        // ============================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Code,
                    d.Description,
                    d.IsActive
                })
                .FirstOrDefaultAsync();

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            return Ok(department);
        }

        // ============================================
        // CREATE DEPARTMENT
        // ============================================

        [HttpPost]
        public async Task<IActionResult> CreateDepartment(
            Department department)
        {
            var nameExists = await _context.Departments
                .AnyAsync(d =>
                    d.Name == department.Name &&
                    d.IsActive);

            if (nameExists)
            {
                return BadRequest(new
                {
                    message = "A department with this name already exists."
                });
            }

            var codeExists = await _context.Departments
                .AnyAsync(d =>
                    d.Code == department.Code &&
                    d.IsActive);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message = "A department with this code already exists."
                });
            }

            department.Id = 0;
            department.IsActive = true;

            _context.Departments.Add(department);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department created successfully.",
                departmentId = department.Id
            });
        }

        // ============================================
        // UPDATE DEPARTMENT
        // ============================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(
            int id,
            UpdateDepartmentRequest request)
        {
            var department = await _context.Departments
                .FindAsync(id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            var nameExists = await _context.Departments
                .AnyAsync(d =>
                    d.Name == request.Name &&
                    d.Id != id &&
                    d.IsActive);

            if (nameExists)
            {
                return BadRequest(new
                {
                    message = "Another department already uses this name."
                });
            }

            var codeExists = await _context.Departments
                .AnyAsync(d =>
                    d.Code == request.Code &&
                    d.Id != id &&
                    d.IsActive);

            if (codeExists)
            {
                return BadRequest(new
                {
                    message = "Another department already uses this code."
                });
            }

            department.Name = request.Name;
            department.Code = request.Code;
            department.Description = request.Description;
            department.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department updated successfully."
            });
        }

        // ============================================
        // DEACTIVATE DEPARTMENT
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments
                .FindAsync(id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            // Check if employees are assigned
            var hasEmployees = await _context.Employees
                .AnyAsync(e =>
                    e.DepartmentId == id &&
                    e.Status != "Inactive");

            if (hasEmployees)
            {
                return BadRequest(new
                {
                    message =
                        "This department has active employees. Reassign them before deactivating the department."
                });
            }

            // Soft delete
            department.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department deactivated successfully."
            });
        }
    }
}
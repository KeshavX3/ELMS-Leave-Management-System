using ELMS.API.Data;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/holidays")]
    [Authorize]
    public class HolidayController : ControllerBase
    {
        private readonly AppDbContext _context;
        public HolidayController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? year)
        {
            var selectedYear = year ?? DateTime.UtcNow.Year;
            return Ok(await _context.Holidays.Where(h => h.Date.Year == selectedYear)
                .OrderBy(h => h.Date).ToListAsync());
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(Holiday holiday)
        {
            holiday.Id = 0;
            holiday.Date = holiday.Date.Date;
            if (await _context.Holidays.AnyAsync(h => h.Date == holiday.Date))
                return BadRequest(new { message = "A holiday already exists on this date." });
            _context.Holidays.Add(holiday);
            await Log("Created", "Holiday", null, holiday.Name);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Holiday added successfully.", holiday });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var holiday = await _context.Holidays.FindAsync(id);
            if (holiday == null) return NotFound(new { message = "Holiday not found." });
            _context.Holidays.Remove(holiday);
            await Log("Deleted", "Holiday", id, holiday.Name);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Holiday removed successfully." });
        }

        private Task Log(string action, string type, int? entityId, string details)
        {
            var actor = User.FindFirstValue("EmployeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            _context.AuditLogs.Add(new AuditLog { Action = action, EntityType = type, EntityId = entityId, Details = details, PerformedById = int.TryParse(actor, out var id) ? id : null });
            return Task.CompletedTask;
        }
    }
}

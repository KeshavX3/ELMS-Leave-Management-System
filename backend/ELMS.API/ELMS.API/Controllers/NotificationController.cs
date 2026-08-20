using ELMS.API.Data;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET MY NOTIFICATIONS
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var employeeId = GetEmployeeId();

            if (employeeId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid employee identity."
                });
            }

            var notifications =
                await _context.Notifications
                    .Where(n =>
                        n.EmployeeId == employeeId.Value)
                    .OrderByDescending(
                        n => n.CreatedAt)
                    .Select(n => new
                    {
                        n.Id,
                        n.Message,
                        n.Type,
                        n.LeaveRequestId,
                        n.IsRead,
                        n.CreatedAt
                    })
                    .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // GET UNREAD COUNT
        // =========================================================

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var employeeId = GetEmployeeId();

            if (employeeId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid employee identity."
                });
            }

            var count =
                await _context.Notifications
                    .CountAsync(n =>
                        n.EmployeeId ==
                            employeeId.Value &&
                        !n.IsRead);

            return Ok(new
            {
                count
            });
        }

        // =========================================================
        // MARK ONE NOTIFICATION AS READ
        // =========================================================

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(
            int id)
        {
            var employeeId = GetEmployeeId();

            if (employeeId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid employee identity."
                });
            }

            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(n =>
                        n.Id == id &&
                        n.EmployeeId ==
                            employeeId.Value);

            if (notification == null)
            {
                return NotFound(new
                {
                    message =
                        "Notification not found."
                });
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Notification marked as read."
            });
        }

        // =========================================================
        // MARK ALL AS READ
        // =========================================================

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var employeeId = GetEmployeeId();

            if (employeeId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid employee identity."
                });
            }

            var notifications =
                await _context.Notifications
                    .Where(n =>
                        n.EmployeeId ==
                            employeeId.Value &&
                        !n.IsRead)
                    .ToListAsync();

            foreach (var notification
                in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "All notifications marked as read."
            });
        }

        // =========================================================
        // GET EMPLOYEE ID FROM JWT
        // =========================================================

        private int? GetEmployeeId()
        {
            var claim =
                User.FindFirst("EmployeeId") ??
                User.FindFirst(
                    ClaimTypes.NameIdentifier);

            return int.TryParse(
                claim?.Value,
                out var employeeId)
                ? employeeId
                : null;
        }
    }
}
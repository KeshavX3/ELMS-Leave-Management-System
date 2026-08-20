using ELMS.API.Data;
using ELMS.API.DTOs;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/leave-requests")]
    [Authorize]
    public class LeaveRequestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveRequestController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL LEAVE REQUESTS
        // ADMIN
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .Include(lr => lr.LeaveType)
                .Include(lr => lr.ApprovedBy)
                .OrderByDescending(lr => lr.AppliedAt)
                .Select(lr => new
                {
                    lr.Id,

                    Employee = lr.Employee == null
                        ? null
                        : new
                        {
                            lr.Employee.Id,
                            lr.Employee.EmployeeCode,
                            lr.Employee.FirstName,
                            lr.Employee.LastName,
                            lr.Employee.Email
                        },

                    LeaveType = lr.LeaveType == null
                        ? null
                        : new
                        {
                            lr.LeaveType.Id,
                            lr.LeaveType.Name,
                            lr.LeaveType.Code
                        },

                    lr.FromDate,
                    lr.ToDate,
                    lr.TotalDays,
                    lr.Reason,
                    lr.Status,
                    lr.AppliedAt,

                    ApprovedBy = lr.ApprovedBy == null
                        ? null
                        : new
                        {
                            lr.ApprovedBy.Id,
                            lr.ApprovedBy.FirstName,
                            lr.ApprovedBy.LastName
                        },

                    lr.ApprovedAt,
                    lr.RejectionReason
                })
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // GET SINGLE REQUEST
        // =========================================================

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetRequest(int id)
        {
            if (User.IsInRole("Manager") &&
                !await IsDirectReportRequest(id))
            {
                return Forbid();
            }

            var request = await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .Include(lr => lr.LeaveType)
                .Include(lr => lr.ApprovedBy)
                .Where(lr => lr.Id == id)
                .Select(lr => new
                {
                    lr.Id,

                    Employee = lr.Employee == null
                        ? null
                        : new
                        {
                            lr.Employee.Id,
                            lr.Employee.EmployeeCode,
                            lr.Employee.FirstName,
                            lr.Employee.LastName
                        },

                    LeaveType = lr.LeaveType == null
                        ? null
                        : new
                        {
                            lr.LeaveType.Id,
                            lr.LeaveType.Name,
                            lr.LeaveType.Code
                        },

                    lr.FromDate,
                    lr.ToDate,
                    lr.TotalDays,
                    lr.Reason,
                    lr.Status,
                    lr.AppliedAt,
                    lr.ApprovedAt,
                    lr.RejectionReason
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Leave request not found."
                });
            }

            return Ok(request);
        }

        // =========================================================
        // GET EMPLOYEE REQUESTS
        // ADMIN
        // =========================================================

        [HttpGet("employee/{employeeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetEmployeeRequests(
            int employeeId)
        {
            var requests = await _context.LeaveRequests
                .Include(lr => lr.LeaveType)
                .Where(lr => lr.EmployeeId == employeeId)
                .OrderByDescending(lr => lr.AppliedAt)
                .Select(lr => new
                {
                    lr.Id,

                    LeaveType = lr.LeaveType == null
                        ? null
                        : new
                        {
                            lr.LeaveType.Id,
                            lr.LeaveType.Name,
                            lr.LeaveType.Code
                        },

                    lr.FromDate,
                    lr.ToDate,
                    lr.TotalDays,
                    lr.Reason,
                    lr.Status,
                    lr.AppliedAt,
                    lr.ApprovedAt,
                    lr.RejectionReason
                })
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // GET PENDING REQUESTS
        // ADMIN / MANAGER
        // =========================================================

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var query = _context.LeaveRequests
                .Include(lr => lr.Employee)
                .Include(lr => lr.LeaveType)
                .Where(lr => lr.Status == "Pending");

            if (User.IsInRole("Manager"))
            {
                var managerId = GetEmployeeId();

                if (managerId == null)
                {
                    return Unauthorized(new
                    {
                        message = "Manager identity not found."
                    });
                }

                query = query.Where(lr =>
                    lr.Employee!.ManagerId == managerId.Value);
            }

            var requests = await query
                .OrderBy(lr => lr.AppliedAt)
                .Select(lr => new
                {
                    lr.Id,

                    Employee = lr.Employee == null
                        ? null
                        : new
                        {
                            lr.Employee.Id,
                            lr.Employee.EmployeeCode,
                            lr.Employee.FirstName,
                            lr.Employee.LastName,
                            lr.Employee.Email
                        },

                    LeaveType = lr.LeaveType == null
                        ? null
                        : new
                        {
                            lr.LeaveType.Id,
                            lr.LeaveType.Name,
                            lr.LeaveType.Code
                        },

                    lr.FromDate,
                    lr.ToDate,
                    lr.TotalDays,
                    lr.Reason,
                    lr.Status,
                    lr.AppliedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // CREATE LEAVE REQUEST
        // EMPLOYEE / ADMIN
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Employee,Admin")]
        public async Task<IActionResult> CreateRequest(
            CreateLeaveRequest request)
        {
            // Employee can only create a request for themselves
            if (User.IsInRole("Employee"))
            {
                var employeeId = GetEmployeeId();

                if (employeeId == null)
                {
                    return Unauthorized(new
                    {
                        message = "Employee identity not found."
                    });
                }

                request.EmployeeId = employeeId.Value;
            }

            // Validate dates
            if (request.FromDate.Date >
                request.ToDate.Date)
            {
                return BadRequest(new
                {
                    message =
                        "From date cannot be after to date."
                });
            }

            // Validate reason
            if (string.IsNullOrWhiteSpace(
                request.Reason))
            {
                return BadRequest(new
                {
                    message =
                        "Leave reason is required."
                });
            }

            // Find employee
            var employee =
                await _context.Employees
                    .FirstOrDefaultAsync(e =>
                        e.Id == request.EmployeeId &&
                        e.Status != "Inactive");

            if (employee == null)
            {
                return NotFound(new
                {
                    message =
                        "Active employee not found."
                });
            }

            // Find leave type
            var leaveType =
                await _context.LeaveTypes
                    .FirstOrDefaultAsync(lt =>
                        lt.Id == request.LeaveTypeId &&
                        lt.IsActive);

            if (leaveType == null)
            {
                return NotFound(new
                {
                    message =
                        "Active leave type not found."
                });
            }

            // =====================================================
            // CALCULATE WORKING DAYS
            // EXCLUDES:
            // 1. Saturday
            // 2. Sunday
            // 3. Public holidays
            // 4. Company holidays
            // =====================================================

            int totalDays = await CalculateWorkingDays(
                request.FromDate.Date,
                request.ToDate.Date);

            if (totalDays <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Selected dates contain no working days."
                });
            }

            // =====================================================
            // CHECK OVERLAPPING REQUEST
            // =====================================================

            var hasOverlap =
                await _context.LeaveRequests
                    .AnyAsync(lr =>
                        lr.EmployeeId ==
                            request.EmployeeId &&

                        lr.Status != "Rejected" &&
                        lr.Status != "Cancelled" &&

                        request.FromDate.Date <=
                            lr.ToDate.Date &&

                        request.ToDate.Date >=
                            lr.FromDate.Date);

            if (hasOverlap)
            {
                return BadRequest(new
                {
                    message =
                        "You already have a leave request overlapping these dates."
                });
            }

            // =====================================================
            // GET LEAVE BALANCE
            // =====================================================

            var currentYear =
                request.FromDate.Year;

            var balance =
                await _context.LeaveBalances
                    .FirstOrDefaultAsync(lb =>
                        lb.EmployeeId ==
                            request.EmployeeId &&

                        lb.LeaveTypeId ==
                            request.LeaveTypeId &&

                        lb.Year ==
                            currentYear);

            if (balance == null)
            {
                return BadRequest(new
                {
                    message =
                        "Leave balance has not been generated for this employee."
                });
            }

            // =====================================================
            // CHECK BALANCE
            // =====================================================

            if (balance.RemainingDays <
                totalDays)
            {
                return BadRequest(new
                {
                    message =
                        $"Insufficient leave balance. Remaining days: {balance.RemainingDays}."
                });
            }

            // =====================================================
            // CREATE LEAVE REQUEST
            // =====================================================

            var leaveRequest =
                new LeaveRequest
                {
                    EmployeeId =
                        request.EmployeeId,

                    LeaveTypeId =
                        request.LeaveTypeId,

                    FromDate =
                        request.FromDate.Date,

                    ToDate =
                        request.ToDate.Date,

                    TotalDays =
                        totalDays,

                    Reason =
                        request.Reason.Trim(),

                    Status =
                        "Pending",

                    AppliedAt =
                        DateTime.UtcNow
                };

            _context.LeaveRequests.Add(leaveRequest);

            await _context.SaveChangesAsync();

            // Notify the employee's manager
            if (employee.ManagerId.HasValue)
            {
                var notification = new Notification
                {
                    EmployeeId = employee.ManagerId.Value,

                    Message =
                        $"{employee.FirstName} {employee.LastName} submitted a new leave request.",

                    Type = "LeaveRequest",

                    LeaveRequestId = leaveRequest.Id,

                    IsRead = false,

                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);

                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message =
                    "Leave request submitted successfully.",

                requestId =
                    leaveRequest.Id,

                totalDays,

                status =
                    leaveRequest.Status
            });
        }

        // =========================================================
        // APPROVE LEAVE REQUEST
        // ADMIN / MANAGER
        // =========================================================

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ApproveRequest(
            int id)
        {
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var request =
                    await _context.LeaveRequests
                        .FirstOrDefaultAsync(lr =>
                            lr.Id == id);

                if (request == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Leave request not found."
                    });
                }

                if (request.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            $"This request is already {request.Status}."
                    });
                }

                // Manager can only approve direct reports
                if (User.IsInRole("Manager") &&
                    !await IsDirectReportRequest(request.Id))
                {
                    return Forbid();
                }

                var balance =
                    await _context.LeaveBalances
                        .FirstOrDefaultAsync(lb =>
                            lb.EmployeeId ==
                                request.EmployeeId &&

                            lb.LeaveTypeId ==
                                request.LeaveTypeId &&

                            lb.Year ==
                                request.FromDate.Year);

                if (balance == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Leave balance not found."
                    });
                }

                if (balance.RemainingDays <
                    request.TotalDays)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Insufficient balance. Remaining days: {balance.RemainingDays}."
                    });
                }

                // Update balance
                balance.UsedDays +=
                    request.TotalDays;

                balance.RemainingDays =
                    balance.AllocatedDays -
                    balance.UsedDays;

                // Update request
                request.Status =
                    "Approved";

                request.ApprovedAt =
                    DateTime.UtcNow;
                var approvalNotification = new Notification
                {
                    EmployeeId = request.EmployeeId,

                    Message =
        "Your leave request has been approved.",

                    Type = "LeaveApproved",

                    LeaveRequestId = request.Id,

                    IsRead = false,

                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(
                    approvalNotification);

                request.ApprovedById =
                    GetEmployeeId();

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Leave request approved successfully.",

                    requestId =
                        request.Id,

                    usedDays =
                        balance.UsedDays,

                    remainingDays =
                        balance.RemainingDays,

                    status =
                        request.Status
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while approving the leave request."
                });
            }
        }

        // =========================================================
        // REJECT LEAVE REQUEST
        // ADMIN / MANAGER
        // =========================================================

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RejectRequest(
            int id,
            RejectLeaveRequest request)
        {
            var leaveRequest =
                await _context.LeaveRequests
                    .FirstOrDefaultAsync(lr =>
                        lr.Id == id);

            if (leaveRequest == null)
            {
                return NotFound(new
                {
                    message =
                        "Leave request not found."
                });
            }

            if (leaveRequest.Status != "Pending")
            {
                return BadRequest(new
                {
                    message =
                        $"This request is already {leaveRequest.Status}."
                });
            }

            // Manager can only reject direct reports
            if (User.IsInRole("Manager") &&
                !await IsDirectReportRequest(leaveRequest.Id))
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(
                request.RejectionReason))
            {
                return BadRequest(new
                {
                    message =
                        "Rejection reason is required."
                });
            }

            leaveRequest.Status =
                "Rejected";

            leaveRequest.RejectionReason =
                request.RejectionReason.Trim();

            leaveRequest.ApprovedAt =
                DateTime.UtcNow;

            leaveRequest.ApprovedById =
                GetEmployeeId();
            var rejectionNotification = new Notification
            {
                EmployeeId = leaveRequest.EmployeeId,

                Message =
        $"Your leave request has been rejected. Reason: {leaveRequest.RejectionReason}",

                Type = "LeaveRejected",

                LeaveRequestId = leaveRequest.Id,

                IsRead = false,

                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(
                rejectionNotification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave request rejected successfully.",

                requestId =
                    leaveRequest.Id,

                status =
                    leaveRequest.Status
            });
        }

        // =========================================================
        // CANCEL PENDING REQUEST
        // EMPLOYEE / ADMIN
        // =========================================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Employee,Admin")]
        public async Task<IActionResult> CancelRequest(
            int id)
        {
            var request =
                await _context.LeaveRequests
                    .FindAsync(id);

            if (request == null)
            {
                return NotFound(new
                {
                    message =
                        "Leave request not found."
                });
            }

            var currentEmployeeId =
                GetEmployeeId();

            if (User.IsInRole("Employee") &&
                (currentEmployeeId == null ||
                 request.EmployeeId !=
                    currentEmployeeId.Value))
            {
                return Forbid();
            }

            if (request.Status != "Pending")
            {
                return BadRequest(new
                {
                    message =
                        "Only pending leave requests can be cancelled."
                });
            }

            request.Status =
                "Cancelled";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Leave request cancelled successfully."
            });
        }

        // =========================================================
        // GET MY REQUESTS
        // EMPLOYEE
        // =========================================================

        [HttpGet("my")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> GetMyRequests()
        {
            var employeeId =
                GetEmployeeId();

            if (employeeId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid employee identity."
                });
            }

            var requests =
                await _context.LeaveRequests
                    .Include(lr => lr.LeaveType)
                    .Where(lr =>
                        lr.EmployeeId ==
                        employeeId.Value)
                    .OrderByDescending(
                        lr => lr.AppliedAt)
                    .Select(lr => new
                    {
                        lr.Id,

                        LeaveType =
                            lr.LeaveType == null
                                ? null
                                : new
                                {
                                    lr.LeaveType.Id,
                                    lr.LeaveType.Name,
                                    lr.LeaveType.Code
                                },

                        lr.FromDate,
                        lr.ToDate,
                        lr.TotalDays,
                        lr.Reason,
                        lr.Status,
                        lr.AppliedAt,
                        lr.ApprovedAt,
                        lr.RejectionReason
                    })
                    .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // WORKING DAYS CALCULATOR
        // EXCLUDES WEEKENDS + HOLIDAYS
        // =========================================================

        private async Task<int> CalculateWorkingDays(
            DateTime fromDate,
            DateTime toDate)
        {
            // Get holidays between selected dates
            var holidays =
                await _context.Holidays
                    .Where(h =>
                        h.Date.Date >= fromDate.Date &&
                        h.Date.Date <= toDate.Date)
                    .Select(h => h.Date.Date)
                    .ToListAsync();

            // Convert to HashSet for fast lookup
            var holidayDates =
                holidays.ToHashSet();

            int totalDays = 0;

            var currentDate =
                fromDate.Date;

            while (currentDate <=
                   toDate.Date)
            {
                // Saturday / Sunday
                bool isWeekend =
                    currentDate.DayOfWeek ==
                        DayOfWeek.Saturday ||
                    currentDate.DayOfWeek ==
                        DayOfWeek.Sunday;

                // Public or company holiday
                bool isHoliday =
                    holidayDates.Contains(
                        currentDate);

                // Count only working days
                if (!isWeekend &&
                    !isHoliday)
                {
                    totalDays++;
                }

                currentDate =
                    currentDate.AddDays(1);
            }

            return totalDays;
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

        // =========================================================
        // CHECK MANAGER → EMPLOYEE RELATIONSHIP
        // =========================================================

        private async Task<bool> IsDirectReportRequest(
            int requestId)
        {
            var managerId =
                GetEmployeeId();

            return managerId != null &&
                await _context.LeaveRequests
                    .AnyAsync(lr =>
                        lr.Id == requestId &&
                        lr.Employee!.ManagerId ==
                            managerId.Value);
        }
    }
}
using ELMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ELMS.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }

        public DbSet<Department> Departments { get; set; }

        public DbSet<LeaveType> LeaveTypes { get; set; }

        public DbSet<LeaveBalance> LeaveBalances { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Employee → Department
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee → Manager
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Manager)
                .WithMany(e => e.Subordinates)
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee Email must be unique
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Email)
                .IsUnique();

            // Employee Code must be unique
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique();

            // Department Code must be unique
            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Code)
                .IsUnique();

            // LeaveBalance → Employee
            modelBuilder.Entity<LeaveBalance>()
                .HasOne(lb => lb.Employee)
                .WithMany()
                .HasForeignKey(lb => lb.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // LeaveBalance → LeaveType
            modelBuilder.Entity<LeaveBalance>()
                .HasOne(lb => lb.LeaveType)
                .WithMany()
                .HasForeignKey(lb => lb.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // One balance per Employee + LeaveType + Year
            modelBuilder.Entity<LeaveBalance>()
                .HasIndex(lb => new
                {
                    lb.EmployeeId,
                    lb.LeaveTypeId,
                    lb.Year
                })
                .IsUnique();
            // LeaveRequest → Employee
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.Employee)
                .WithMany()
                .HasForeignKey(lr => lr.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Holiday>()
                .HasIndex(holiday => holiday.Date)
                .IsUnique();

            modelBuilder.Entity<AuditLog>()
                .HasOne(log => log.PerformedBy)
                .WithMany()
                .HasForeignKey(log => log.PerformedById)
                .OnDelete(DeleteBehavior.SetNull);

            // LeaveRequest → LeaveType
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.LeaveType)
                .WithMany()
                .HasForeignKey(lr => lr.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // LeaveRequest → ApprovedBy Employee
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.ApprovedBy)
                .WithMany()
                .HasForeignKey(lr => lr.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Holiday>()
    .HasIndex(h => new
    {
        h.Name,
        h.Date
    })
    .IsUnique();
            modelBuilder.Entity<Notification>()
    .HasOne(n => n.Employee)
    .WithMany()
    .HasForeignKey(n => n.EmployeeId)
    .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.LeaveRequest)
                .WithMany()
                .HasForeignKey(n => n.LeaveRequestId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

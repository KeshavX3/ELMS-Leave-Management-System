using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ELMS.API.Data;
using ELMS.API.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ELMS.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e =>
                    e.Email == request.Email &&
                    e.PasswordHash == request.Password);

            if (employee == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            if (employee.Status == "Inactive")
            {
                return Unauthorized(new
                {
                    message = "Your account is inactive."
                });
            }

            var jwtSettings =
                _configuration.GetSection("Jwt");

            var key = Encoding.UTF8.GetBytes(
                jwtSettings["Key"]!
            );

            var claims = new List<Claim>
    {
        new Claim(
            ClaimTypes.NameIdentifier,
            employee.Id.ToString()
        ),

        new Claim(
            ClaimTypes.Email,
            employee.Email
        ),

        new Claim(ClaimTypes.Role, employee.Role),

        new Claim(
            "EmployeeId",
            employee.Id.ToString()
        ),

        new Claim(
            "FirstName",
            employee.FirstName
        ),

        new Claim(
            "LastName",
            employee.LastName
        )
    };

            var credentials =
                new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256
                );

            var token =
                new JwtSecurityToken(
                    issuer:
                        jwtSettings["Issuer"],

                    audience:
                        jwtSettings["Audience"],

                    claims:
                        claims,

                    expires:
                        DateTime.UtcNow.AddHours(8),

                    signingCredentials:
                        credentials
                );

            var tokenString =
                new JwtSecurityTokenHandler()
                    .WriteToken(token);

            return Ok(new
            {
                token = tokenString,

                id = employee.Id,

                employeeId = employee.Id,

                firstName = employee.FirstName,

                lastName = employee.LastName,

                email = employee.Email,

                role = employee.Role
            });
        }
    }
}
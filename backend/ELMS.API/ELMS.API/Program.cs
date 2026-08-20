using ELMS.API.Data;
using ELMS.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT CONFIG
var jwtSettings = builder.Configuration.GetSection("Jwt");

var jwtKey = jwtSettings["Key"]
    ?? throw new InvalidOperationException("JWT Key is missing from appsettings.json");

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,

        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],

        IssuerSigningKey =
        new SymmetricSecurityKey(key),

         RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token like: Bearer {your token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SEED USER
using(var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // =========================
    // SEED ADMIN USER
    // =========================

    if (!db.Employees.Any())
    {
        db.Employees.Add(new Employee
        {
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@test.com",
            PasswordHash = "123456",
            Role = "Admin"
        });

        db.SaveChanges();
    }

    // =========================
    // SEED 2026 PUBLIC HOLIDAYS
    // =========================

    if (!db.Holidays.Any(h => h.Date.Year == 2026))
    {
        db.Holidays.AddRange(
            new Holiday
            {
                Name = "Republic Day",
                Date = new DateTime(2026, 1, 26),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Id-ul-Fitr",
                Date = new DateTime(2026, 3, 21),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Mahavir Jayanti",
                Date = new DateTime(2026, 3, 31),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Good Friday",
                Date = new DateTime(2026, 4, 3),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Buddha Purnima",
                Date = new DateTime(2026, 5, 1),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Id-ul-Zuha",
                Date = new DateTime(2026, 5, 27),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Muharram",
                Date = new DateTime(2026, 6, 26),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Independence Day",
                Date = new DateTime(2026, 8, 15),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Milad-un-Nabi",
                Date = new DateTime(2026, 8, 26),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Mahatma Gandhi's Birthday",
                Date = new DateTime(2026, 10, 2),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Dussehra",
                Date = new DateTime(2026, 10, 20),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Diwali",
                Date = new DateTime(2026, 11, 8),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Guru Nanak's Birthday",
                Date = new DateTime(2026, 11, 24),
                IsOptional = false,
                IsCompanyHoliday = false
            },

            new Holiday
            {
                Name = "Christmas Day",
                Date = new DateTime(2026, 12, 25),
                IsOptional = false,
                IsCompanyHoliday = false
            }
        );

        db.SaveChanges();
    }
}

app.Run();
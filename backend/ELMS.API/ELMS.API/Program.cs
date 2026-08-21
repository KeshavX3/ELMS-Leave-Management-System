using ELMS.API.Data;
using ELMS.API.Models;
using BCrypt.Net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

// ── Fix: Npgsql 6+ maps DateTime to 'timestamp with time zone' and rejects
// Kind=Unspecified. This switch restores the legacy behaviour (accept any Kind)
// so existing DateTime values in seed data and models work without changes.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// ── Database ─────────────────────────────────────────────────────────────────
// In production (Render.com), DATABASE_URL env var is set automatically.
// Locally, falls back to the connection string in appsettings.json.
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Render provides a postgres:// URI — convert it to Npgsql connection string.
    // uri.Port returns -1 when the port is not explicitly in the URL, so default to 5432.
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    var host     = uri.Host;
    var port     = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = Uri.UnescapeDataString(userInfo[1]);

    var npgsqlConn = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=True";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(npgsqlConn));
}
else
{
    // Local development: use connection string from appsettings.json
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// ── JWT ───────────────────────────────────────────────────────────────────────
// In production, read JWT key from environment variable (never commit secrets).
// Locally, falls back to appsettings.json value.
var jwtSettings = builder.Configuration.GetSection("Jwt");

var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
    ?? jwtSettings["Key"]
    ?? throw new InvalidOperationException("JWT Key is missing from environment and appsettings.json");

// Sync to configuration so controllers reading from IConfiguration get the same key
builder.Configuration["Jwt:Key"] = jwtKey;

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

// ── CORS ──────────────────────────────────────────────────────────────────────
// AllowedOrigins from appsettings.json + the GitHub Pages URL for production.
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy",
        policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── Seed Data ─────────────────────────────────────────────────────────────────
using(var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Apply any pending migrations automatically on startup (safe for cloud).
    db.Database.Migrate();

    // =========================
    // SEED ADMIN USER
    // =========================

    var admin = db.Employees
        .FirstOrDefault(e => e.Email == "admin@test.com");

    if (admin == null)
    {
        db.Employees.Add(new Employee
        {
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@test.com",
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = "Admin"
        });

        db.SaveChanges();
    }
    else if (!admin.PasswordHash.StartsWith("$2"))
    {
        admin.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword("123456");

        db.SaveChanges();
    }
    // =========================================================
    // FIX OLD PLAIN-TEXT PASSWORDS
    // Development / migration helper
    // =========================================================

    var usersWithPlainTextPasswords = db.Employees
        .Where(e => !e.PasswordHash.StartsWith("$2"))
        .ToList();

    if (usersWithPlainTextPasswords.Any())
    {
        foreach (var user in usersWithPlainTextPasswords)
        {
            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
        }

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
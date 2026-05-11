using backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────
// 1. PostgreSQL через EF Core
// ──────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ──────────────────────────────────────────
// 2. JWT Authentication
// ──────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ──────────────────────────────────────────
// 3. CORS
// ──────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:3000",
                "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// ──────────────────────────────────────────
// 4. Middleware Pipeline
// ──────────────────────────────────────────
app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// Проверочный endpoint
app.MapGet("/", () => new
{
    status = "ok",
    message = "СтудПрогресс API работает",
    database = "Supabase PostgreSQL",
    time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
});

// Render PORT
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";

app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();

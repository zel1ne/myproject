using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers;

// ============================================================
// AUTH
// ============================================================
[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IConfiguration cfg) : ControllerBase
{
    public record LoginDto(string Email, string Password);
    public record LoginResult(string Token, string Role, string FullName, int UserId, int? StudentId);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await db.Пользователи
            .Include(u => u.Студент)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Активен);
        if (user == null) return Unauthorized("Пользователь не найден");

        // Сравнение паролей в открытом виде (без хеширования)
        bool ok = user.ХешПароля == dto.Password;
        if (!ok) return Unauthorized("Неверный пароль");

        // Обновить время последнего входа
        user.ПоследнийВход = DateTime.Now;
        await db.SaveChangesAsync();

        var token = GenerateToken(user);
        return Ok(new LoginResult(token, user.Роль, user.ФИО, user.Id, user.Студент?.Id));
    }

    private string GenerateToken(Пользователь user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Роль),
            new Claim("ФИО", user.ФИО),
        };
        var exp = DateTime.UtcNow.AddHours(cfg.GetValue<int>("Jwt:ExpiresInHours"));
        var token = new JwtSecurityToken(cfg["Jwt:Issuer"], cfg["Jwt:Audience"], claims, expires: exp, signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ============================================================
// STUDENTS
// ============================================================
[ApiController]
[Route("api/students")]
[Authorize]
public class StudentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? groupId)
    {
        var q = db.Студенты
            .Include(s => s.Пользователь)
            .Include(s => s.Группа).ThenInclude(g => g!.Специальность)
            .AsQueryable();
        if (groupId.HasValue) q = q.Where(s => s.ГруппаID == groupId);

        var list = await q.Select(s => new {
            id = s.Id,
            fullName = s.Пользователь!.ФИО,
            groupId = s.ГруппаID,
            groupName = s.Группа!.Название,
            specialty = s.Группа.Специальность!.Название,
            recordBook = s.НомерЗачётки,
            status = s.Статус,
            year = s.ГодПоступления,
        }).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var s = await db.Студенты
            .Include(s => s.Пользователь)
            .Include(s => s.Группа).ThenInclude(g => g!.Специальность)
            .FirstOrDefaultAsync(s => s.Id == id);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateStudentDto dto)
    {
        var user = new Пользователь
        {
            Email = dto.Email,
            ФИО = dto.ФИО,
            Роль = "student",
            ХешПароля = dto.Password ?? "student123"   // без хеширования
        };
        db.Пользователи.Add(user);
        await db.SaveChangesAsync();

        var student = new Студент
        {
            ПользовательID = user.Id,
            ГруппаID = dto.ГруппаID,
            НомерЗачётки = dto.НомерЗачётки,
            ГодПоступления = dto.ГодПоступления
        };
        db.Студенты.Add(student);
        await db.SaveChangesAsync();
        return Ok(new { student.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await db.Студенты.FindAsync(id);
        if (s == null) return NotFound();
        db.Студенты.Remove(s);
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record CreateStudentDto(string ФИО, string Email, string? Password, int ГруппаID, string НомерЗачётки, short? ГодПоступления);
}

// ============================================================
// GROUPS
// ============================================================
[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Группы
            .Include(g => g.Специальность)
            .Include(g => g.Студенты)
            .Select(g => new {
                id = g.Id,
                name = g.Название,
                specialtyId = g.СпециальностьID,
                specialtyName = g.Специальность!.Название,
                year = g.ГодНабора,
                course = g.Курс,
                students = g.Студенты.Count
            }).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
    {
        var g = new Группа { Название = dto.Название, СпециальностьID = dto.СпециальностьID, ГодНабора = dto.ГодНабора, Курс = dto.Курс };
        db.Группы.Add(g);
        await db.SaveChangesAsync();
        return Ok(new { g.Id });
    }

    public record CreateGroupDto(string Название, int СпециальностьID, short ГодНабора, byte Курс);
}

// ============================================================
// SUBJECTS
// ============================================================
[ApiController]
[Route("api/subjects")]
[Authorize]
public class SubjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Дисциплины.Where(d => d.Активна).ToListAsync();
        return Ok(list.Select(d => new { id = d.Id, code = d.Код, name = d.Название, hours = d.ЧасовВсего }));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateSubjectDto dto)
    {
        var d = new Дисциплина { Код = dto.Код, Название = dto.Название, ЧасовВсего = dto.Часы };
        db.Дисциплины.Add(d);
        await db.SaveChangesAsync();
        return Ok(new { d.Id });
    }

    public record CreateSubjectDto(string Код, string Название, short? Часы);
}

// ============================================================
// GRADES
// ============================================================
[ApiController]
[Route("api/grades")]
[Authorize]
public class GradesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? studentId, [FromQuery] int? groupId, [FromQuery] int? subjectId)
    {
        var q = db.Оценки
            .Include(o => o.Студент).ThenInclude(s => s!.Пользователь)
            .Include(o => o.Студент).ThenInclude(s => s!.Группа)
            .Include(o => o.Дисциплина)
            .AsQueryable();
        if (studentId.HasValue) q = q.Where(o => o.СтудентID == studentId);
        if (subjectId.HasValue) q = q.Where(o => o.ДисциплинаID == subjectId);
        if (groupId.HasValue) q = q.Where(o => o.Студент!.ГруппаID == groupId);

        var list = await q.OrderByDescending(o => o.Дата).Select(o => new {
            id = o.Id,
            studentId = o.СтудентID,
            studentName = o.Студент!.Пользователь!.ФИО,
            groupName = o.Студент.Группа!.Название,
            subjectId = o.ДисциплинаID,
            subjectName = o.Дисциплина!.Название,
            type = o.ТипРаботы,
            value = o.ОценкаЗначение,
            date = o.Дата,
            semester = o.Семестр,
            year = o.УчебныйГод,
            comment = o.Комментарий
        }).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "admin,teacher")]
    public async Task<IActionResult> Create([FromBody] CreateGradeDto dto)
    {
        var teacherId = await GetTeacherId();
        var o = new Оценка
        {
            СтудентID = dto.СтудентID,
            ДисциплинаID = dto.ДисциплинаID,
            ПреподавательID = teacherId,
            ТипРаботы = dto.ТипРаботы,
            ОценкаЗначение = dto.Оценка,
            Дата = dto.Дата ?? DateOnly.FromDateTime(DateTime.Today),
            Семестр = dto.Семестр ?? 1,
            УчебныйГод = dto.УчебныйГод ?? "2025/2026",
            Комментарий = dto.Комментарий
        };
        db.Оценки.Add(o);
        await db.SaveChangesAsync();
        return Ok(new { o.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,teacher")]
    public async Task<IActionResult> Delete(int id)
    {
        var o = await db.Оценки.FindAsync(id);
        if (o == null) return NotFound();
        db.Оценки.Remove(o);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<int> GetTeacherId()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var t = await db.Преподаватели.FirstOrDefaultAsync(p => p.ПользовательID == userId);
        return t?.Id ?? 1;
    }

    public record CreateGradeDto(int СтудентID, int ДисциплинаID, string ТипРаботы, byte Оценка,
        DateOnly? Дата, byte? Семестр, string? УчебныйГод, string? Комментарий);
}

// ============================================================
// ATTENDANCE
// ============================================================
[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? studentId, [FromQuery] int? groupId, [FromQuery] int? subjectId)
    {
        var q = db.Посещаемость
            .Include(a => a.Студент).ThenInclude(s => s!.Пользователь)
            .Include(a => a.Студент).ThenInclude(s => s!.Группа)
            .Include(a => a.Дисциплина)
            .AsQueryable();
        if (studentId.HasValue) q = q.Where(a => a.СтудентID == studentId);
        if (subjectId.HasValue) q = q.Where(a => a.ДисциплинаID == subjectId);
        if (groupId.HasValue) q = q.Where(a => a.Студент!.ГруппаID == groupId);

        var list = await q.OrderByDescending(a => a.Дата).Select(a => new {
            id = a.Id,
            studentId = a.СтудентID,
            studentName = a.Студент!.Пользователь!.ФИО,
            groupName = a.Студент.Группа!.Название,
            subjectId = a.ДисциплинаID,
            subjectName = a.Дисциплина!.Название,
            date = a.Дата,
            status = a.Статус
        }).ToListAsync();
        return Ok(list);
    }

    [HttpPut]
    [Authorize(Roles = "admin,teacher")]
    public async Task<IActionResult> Upsert([FromBody] UpsertAttDto dto)
    {
        var teacherId = await GetTeacherId();
        var existing = await db.Посещаемость.FirstOrDefaultAsync(a =>
            a.СтудентID == dto.СтудентID && a.ДисциплинаID == dto.ДисциплинаID && a.Дата == dto.Дата);
        if (existing != null)
        {
            existing.Статус = dto.Статус;
            existing.ПреподавательID = teacherId;
        }
        else
        {
            db.Посещаемость.Add(new Посещаемость
            {
                СтудентID = dto.СтудентID, ДисциплинаID = dto.ДисциплинаID,
                ПреподавательID = teacherId, Дата = dto.Дата, Статус = dto.Статус
            });
        }
        await db.SaveChangesAsync();
        return Ok();
    }

    private async Task<int> GetTeacherId()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var t = await db.Преподаватели.FirstOrDefaultAsync(p => p.ПользовательID == userId);
        return t?.Id ?? 1;
    }

    public record UpsertAttDto(int СтудентID, int ДисциплинаID, DateOnly Дата, string Статус);
}

// ============================================================
// ANALYTICS / DASHBOARD
// ============================================================
[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var totalStudents = await db.Студенты.CountAsync();
        var totalGroups = await db.Группы.CountAsync();
        var totalSubjects = await db.Дисциплины.CountAsync(d => d.Активна);
        var grades = await db.Оценки.ToListAsync();
        var attendance = await db.Посещаемость.ToListAsync();

        var overallAvg = grades.Any() ? grades.Average(g => (double)g.ОценкаЗначение) : 0;
        var attRate = attendance.Any() ? attendance.Count(a => a.Статус == "П" || a.Статус == "У") * 100.0 / attendance.Count : 0;

        // Ежемесячная динамика
        var months = new[] { 8, 9, 10, 11, 0, 1 };
        var monthLabels = new[] { "Сен", "Окт", "Ноя", "Дек", "Янв", "Фев" };
        var monthAvgs = months.Select((m, i) => new {
            label = monthLabels[i],
            avg = grades.Where(g => g.ДатаСоздания.Month - 1 == m || (m == 0 && g.ДатаСоздания.Month == 1))
                        .DefaultIfEmpty().Average(g => g == null ? 0 : (double)g.ОценкаЗначение)
        });

        // Распределение оценок
        var dist = new[] {
            grades.Count(g => g.ОценкаЗначение == 2),
            grades.Count(g => g.ОценкаЗначение == 3),
            grades.Count(g => g.ОценкаЗначение == 4),
            grades.Count(g => g.ОценкаЗначение == 5),
        };

        // Средний балл по группам
        var groupAvgs = await db.Группы.Select(gr => new {
            name = gr.Название,
            avg = gr.Студенты.SelectMany(s => s.Оценки)
                .DefaultIfEmpty().Average(o => o == null ? 0 : (double)o.ОценкаЗначение)
        }).ToListAsync();

        return Ok(new {
            totalStudents, totalGroups, totalSubjects,
            overallAvg = Math.Round(overallAvg, 2),
            attRate = Math.Round(attRate, 1),
            monthlyTrend = monthAvgs,
            gradeDist = dist,
            groupAvgs
        });
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> StudentAnalytics(int studentId)
    {
        var grades = await db.Оценки
            .Include(o => o.Дисциплина)
            .Where(o => o.СтудентID == studentId)
            .ToListAsync();

        var bySubject = grades.GroupBy(o => o.Дисциплина!.Название).Select(g => new {
            subject = g.Key,
            avg = Math.Round(g.Average(o => (double)o.ОценкаЗначение), 2),
            count = g.Count()
        });

        var attRecs = await db.Посещаемость.Where(a => a.СтудентID == studentId).ToListAsync();
        var attRate = attRecs.Any() ? attRecs.Count(a => a.Статус == "П" || a.Статус == "У") * 100.0 / attRecs.Count : 100;

        return Ok(new {
            totalGrades = grades.Count,
            overallAvg = grades.Any() ? Math.Round(grades.Average(g => (double)g.ОценкаЗначение), 2) : 0,
            excellent = grades.Count(g => g.ОценкаЗначение == 5),
            attRate = Math.Round(attRate, 1),
            bySubject
        });
    }
}

// ============================================================
// SPECIALTIES
// ============================================================
[ApiController]
[Route("api/specialties")]
[Authorize]
public class SpecialtiesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Специальности.ToListAsync();
        return Ok(list.Select(s => new { id = s.Id, code = s.Код, name = s.Название }));
    }
}

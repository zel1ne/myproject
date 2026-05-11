using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Специальность> Специальности { get; set; }
    public DbSet<Группа> Группы { get; set; }
    public DbSet<Пользователь> Пользователи { get; set; }
    public DbSet<Преподаватель> Преподаватели { get; set; }
    public DbSet<Студент> Студенты { get; set; }
    public DbSet<Дисциплина> Дисциплины { get; set; }
    public DbSet<Оценка> Оценки { get; set; }
    public DbSet<Посещаемость> Посещаемость { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Специальности
        mb.Entity<Специальность>().Property(e => e.Id).HasColumnName("СпециальностьID");

        // Группы
        mb.Entity<Группа>().Property(e => e.Id).HasColumnName("ГруппаID");
        mb.Entity<Группа>().HasOne(g => g.Специальность)
            .WithMany(s => s.Группы).HasForeignKey(g => g.СпециальностьID);

        // Пользователи
        mb.Entity<Пользователь>().Property(e => e.Id).HasColumnName("ПользовательID");

        // Преподаватели
        mb.Entity<Преподаватель>().Property(e => e.Id).HasColumnName("ПреподавательID");
        mb.Entity<Преподаватель>().HasOne(p => p.Пользователь)
            .WithOne(u => u.Преподаватель).HasForeignKey<Преподаватель>(p => p.ПользовательID);

        // Студенты
        mb.Entity<Студент>().Property(e => e.Id).HasColumnName("СтудентID");
        mb.Entity<Студент>().HasOne(s => s.Пользователь)
            .WithOne(u => u.Студент).HasForeignKey<Студент>(s => s.ПользовательID);
        mb.Entity<Студент>().HasOne(s => s.Группа)
            .WithMany(g => g.Студенты).HasForeignKey(s => s.ГруппаID);

        // Дисциплины
        mb.Entity<Дисциплина>().Property(e => e.Id).HasColumnName("ДисциплинаID");

        // Оценки
        mb.Entity<Оценка>().Property(e => e.Id).HasColumnName("ОценкаID");
        mb.Entity<Оценка>().Property(e => e.ОценкаЗначение).HasColumnName("Оценка");
        mb.Entity<Оценка>().HasOne(o => o.Студент)
            .WithMany(s => s.Оценки).HasForeignKey(o => o.СтудентID);
        mb.Entity<Оценка>().HasOne(o => o.Дисциплина)
            .WithMany().HasForeignKey(o => o.ДисциплинаID);

        // Посещаемость
        mb.Entity<Посещаемость>().Property(e => e.Id).HasColumnName("ПосещаемостьID");
        mb.Entity<Посещаемость>().HasOne(p => p.Студент)
            .WithMany(s => s.Посещаемость).HasForeignKey(p => p.СтудентID);
        mb.Entity<Посещаемость>().HasOne(p => p.Дисциплина)
            .WithMany().HasForeignKey(p => p.ДисциплинаID);
    }
}

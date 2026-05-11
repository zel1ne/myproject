// ============================================================
// МОДЕЛИ ДАННЫХ (Entity Framework)
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("Специальности")]
public class Специальность
{
    [Column("СпециальностьID")] public int Id { get; set; }
    [Column("Код")][MaxLength(20)] public string Код { get; set; } = "";
    [Column("Название")][MaxLength(200)] public string Название { get; set; } = "";
    [Column("Активна")] public bool Активна { get; set; } = true;
    public List<Группа> Группы { get; set; } = [];
}

[Table("Группы")]
public class Группа
{
    [Column("ГруппаID")] public int Id { get; set; }
    [Column("Название")][MaxLength(50)] public string Название { get; set; } = "";
    [Column("СпециальностьID")] public int СпециальностьID { get; set; }
    [Column("ГодНабора")] public short ГодНабора { get; set; }
    [Column("Курс")] public byte Курс { get; set; }
    [Column("Активна")] public bool Активна { get; set; } = true;
    public Специальность? Специальность { get; set; }
    public List<Студент> Студенты { get; set; } = [];
}

[Table("Пользователи")]
public class Пользователь
{
    [Column("ПользовательID")] public int Id { get; set; }
    [Column("Email")][MaxLength(150)] public string Email { get; set; } = "";
    [Column("ХешПароля")][MaxLength(255)] public string ХешПароля { get; set; } = "";
    [Column("Роль")][MaxLength(20)] public string Роль { get; set; } = "student";
    [Column("ФИО")][MaxLength(200)] public string ФИО { get; set; } = "";
    [Column("Телефон")][MaxLength(20)] public string? Телефон { get; set; }
    [Column("Активен")] public bool Активен { get; set; } = true;
    [Column("ДатаСоздания")] public DateTime ДатаСоздания { get; set; } = DateTime.Now;
    [Column("ПоследнийВход")] public DateTime? ПоследнийВход { get; set; }
    public Студент? Студент { get; set; }
    public Преподаватель? Преподаватель { get; set; }
}

[Table("Преподаватели")]
public class Преподаватель
{
    [Column("ПреподавательID")] public int Id { get; set; }
    [Column("ПользовательID")] public int ПользовательID { get; set; }
    [Column("Должность")][MaxLength(100)] public string? Должность { get; set; }
    public Пользователь? Пользователь { get; set; }
}

[Table("Студенты")]
public class Студент
{
    [Column("СтудентID")] public int Id { get; set; }
    [Column("ПользовательID")] public int ПользовательID { get; set; }
    [Column("ГруппаID")] public int ГруппаID { get; set; }
    [Column("НомерЗачётки")][MaxLength(20)] public string НомерЗачётки { get; set; } = "";
    [Column("ДатаРождения")] public DateOnly? ДатаРождения { get; set; }
    [Column("ГодПоступления")] public short? ГодПоступления { get; set; }
    [Column("Статус")][MaxLength(20)] public string Статус { get; set; } = "Активный";
    public Пользователь? Пользователь { get; set; }
    public Группа? Группа { get; set; }
    public List<Оценка> Оценки { get; set; } = [];
    public List<Посещаемость> Посещаемость { get; set; } = [];
}

[Table("Дисциплины")]
public class Дисциплина
{
    [Column("ДисциплинаID")] public int Id { get; set; }
    [Column("Код")][MaxLength(10)] public string Код { get; set; } = "";
    [Column("Название")][MaxLength(200)] public string Название { get; set; } = "";
    [Column("ЧасовВсего")] public short? ЧасовВсего { get; set; }
    [Column("Активна")] public bool Активна { get; set; } = true;
}

[Table("Оценки")]
public class Оценка
{
    [Column("ОценкаID")] public int Id { get; set; }
    [Column("СтудентID")] public int СтудентID { get; set; }
    [Column("ДисциплинаID")] public int ДисциплинаID { get; set; }
    [Column("ПреподавательID")] public int ПреподавательID { get; set; }
    [Column("ТипРаботы")][MaxLength(50)] public string ТипРаботы { get; set; } = "";
    [Column("Оценка")] public byte ОценкаЗначение { get; set; }
    [Column("Дата")] public DateOnly Дата { get; set; }
    [Column("Семестр")] public byte Семестр { get; set; } = 1;
    [Column("УчебныйГод")][MaxLength(9)] public string УчебныйГод { get; set; } = "2025/2026";
    [Column("Комментарий")][MaxLength(500)] public string? Комментарий { get; set; }
    [Column("ДатаСоздания")] public DateTime ДатаСоздания { get; set; } = DateTime.Now;
    public Студент? Студент { get; set; }
    public Дисциплина? Дисциплина { get; set; }
}

[Table("Посещаемость")]
public class Посещаемость
{
    [Column("ПосещаемостьID")] public int Id { get; set; }
    [Column("СтудентID")] public int СтудентID { get; set; }
    [Column("ДисциплинаID")] public int ДисциплинаID { get; set; }
    [Column("ПреподавательID")] public int ПреподавательID { get; set; }
    [Column("Дата")] public DateOnly Дата { get; set; }
    [Column("Статус")][MaxLength(1)] public string Статус { get; set; } = "П";
    [Column("Примечание")][MaxLength(200)] public string? Примечание { get; set; }
    public Студент? Студент { get; set; }
    public Дисциплина? Дисциплина { get; set; }
}

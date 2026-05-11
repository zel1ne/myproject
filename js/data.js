// ============================================================
// MOCK DATA — все данные приложения
// ============================================================

// ---- Временный список студентов для генерации (ОБЯЗАТЕЛЬНО ПЕРВЫМ) ----
const DB_STUDENTS_TEMP = [
    { id: 1, gpa: 4.7 }, { id: 2, gpa: 3.9 }, { id: 3, gpa: 4.5 },
    { id: 4, gpa: 3.4 }, { id: 5, gpa: 4.1 }, { id: 6, gpa: 3.7 },
    { id: 7, gpa: 4.8 }, { id: 8, gpa: 3.2 }, { id: 9, gpa: 4.3 },
    { id: 10, gpa: 4.6 }, { id: 11, gpa: 3.8 }, { id: 12, gpa: 4.0 },
    { id: 13, gpa: 3.5 }, { id: 14, gpa: 4.4 }, { id: 15, gpa: 4.9 },
    { id: 16, gpa: 3.6 }, { id: 17, gpa: 4.2 }, { id: 18, gpa: 3.3 },
];

function randomDate(start, end) {
    const s = new Date(start), e = new Date(end);
    const d = new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime()));
    return d.toISOString().slice(0, 10);
}

function getWorkDays(start, end) {
    const days = [];
    let d = new Date(start);
    const e = new Date(end);
    while (d <= e) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function generateGrades() {
    const types = ['КР', 'ЛР', 'ПР', 'ЗАЧ', 'ЭКЗ'];
    const grades = [];
    let id = 1;
    const subjectIds = [1, 2, 3, 4, 5, 6];

    DB_STUDENTS_TEMP.forEach(s => {
        subjectIds.forEach(subId => {
            const count = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                const base = s.gpa;
                let val = Math.round(base + (Math.random() - 0.5) * 2);
                val = Math.max(2, Math.min(5, val));
                grades.push({
                    id: id++, studentId: s.id, subjectId: subId,
                    type: types[Math.floor(Math.random() * 3)],
                    value: val,
                    date: randomDate('2025-09-01', '2026-02-28')
                });
            }
        });
    });
    return grades;
}

function generateAttendance() {
    const att = [];
    let id = 1;
    const dates = getWorkDays('2025-09-01', '2026-02-28');
    const subjectIds = [1, 2, 3];
    const statuses = ['П', 'П', 'П', 'П', 'П', 'Н', 'Б', 'У'];

    DB_STUDENTS_TEMP.forEach(s => {
        subjectIds.forEach(subId => {
            dates.slice(0, 60).forEach(date => {
                if (Math.random() < 0.6) {
                    const st = statuses[Math.floor(Math.random() * statuses.length)];
                    att.push({ id: id++, studentId: s.id, subjectId: subId, date, status: st });
                }
            });
        });
    });
    return att;
}

// ---- Основной объект БД ----
const DB = {
    users: [
        { id: 1, email: 'admin', password: 'admin', role: 'admin', fullName: 'Крылова Светлана Михайловна', avatar: 'СК' },
        { id: 2, email: 'teacher', password: 'teacher', role: 'teacher', fullName: 'Захаров Андрей Петрович', avatar: 'АЗ' },
        { id: 3, email: 'student', password: 'student', role: 'student', fullName: 'Иванова Мария Сергеевна', avatar: 'ИМ', studentId: 1 },
    ],

    specialties: [
        { id: 1, code: '43.01.01', name: 'Официант, бармен' },
        { id: 2, code: '43.01.09', name: 'Повар, кондитер' },
        { id: 3, code: '38.02.04', name: 'Коммерция (по отраслям)' },
        { id: 4, code: '38.02.05', name: 'Товароведение и экспертиза качества' },
    ],

    groups: [
        { id: 1, name: 'ОБ-21', specialtyId: 1, year: 2021, students: 24 },
        { id: 2, name: 'ОБ-22', specialtyId: 1, year: 2022, students: 22 },
        { id: 3, name: 'ПК-21', specialtyId: 2, year: 2021, students: 26 },
        { id: 4, name: 'ПК-22', specialtyId: 2, year: 2022, students: 25 },
        { id: 5, name: 'КМ-22', specialtyId: 3, year: 2022, students: 20 },
        { id: 6, name: 'ТВ-22', specialtyId: 4, year: 2022, students: 18 },
    ],

    subjects: [
        { id: 1, code: 'МАТ', name: 'Математика', teacherId: 2 },
        { id: 2, code: 'РУС', name: 'Русский язык', teacherId: 2 },
        { id: 3, code: 'ИНФ', name: 'Информатика', teacherId: 2 },
        { id: 4, code: 'ЭКО', name: 'Экономика', teacherId: 2 },
        { id: 5, code: 'ПРФ', name: 'Профессиональный модуль', teacherId: 2 },
        { id: 6, code: 'АНГ', name: 'Английский язык', teacherId: 2 },
        { id: 7, code: 'ХИМ', name: 'Химия', teacherId: 2 },
        { id: 8, code: 'ФИЗ', name: 'Физика', teacherId: 2 },
    ],

    students: [
        { id: 1, fullName: 'Иванова Мария Сергеевна', groupId: 1, recordBook: '222606277', gpa: 4.7 },
        { id: 2, fullName: 'Петров Алексей Николаевич', groupId: 1, recordBook: '222606278', gpa: 3.9 },
        { id: 3, fullName: 'Сидорова Анна Викторовна', groupId: 1, recordBook: '222606279', gpa: 4.5 },
        { id: 4, fullName: 'Козлов Дмитрий Андреевич', groupId: 1, recordBook: '222606280', gpa: 3.4 },
        { id: 5, fullName: 'Новикова Елена Игоревна', groupId: 1, recordBook: '222606281', gpa: 4.1 },
        { id: 6, fullName: 'Морозов Иван Александрович', groupId: 1, recordBook: '222606282', gpa: 3.7 },
        { id: 7, fullName: 'Волкова Ольга Павловна', groupId: 2, recordBook: '222606283', gpa: 4.8 },
        { id: 8, fullName: 'Соколов Кирилл Евгеньевич', groupId: 2, recordBook: '222606284', gpa: 3.2 },
        { id: 9, fullName: 'Лебедева Виктория Романовна', groupId: 2, recordBook: '222606285', gpa: 4.3 },
        { id: 10, fullName: 'Козлова Диана Максимовна', groupId: 3, recordBook: '222606286', gpa: 4.6 },
        { id: 11, fullName: 'Федоров Станислав Олегович', groupId: 3, recordBook: '222606287', gpa: 3.8 },
        { id: 12, fullName: 'Громова Ксения Артёмовна', groupId: 3, recordBook: '222606288', gpa: 4.0 },
        { id: 13, fullName: 'Зайцев Никита Вадимович', groupId: 4, recordBook: '222606289', gpa: 3.5 },
        { id: 14, fullName: 'Орлова Татьяна Сергеевна', groupId: 4, recordBook: '222606290', gpa: 4.4 },
        { id: 15, fullName: 'Дмитриева Полина Юрьевна', groupId: 5, recordBook: '222606291', gpa: 4.9 },
        { id: 16, fullName: 'Романов Артём Борисович', groupId: 5, recordBook: '222606292', gpa: 3.6 },
        { id: 17, fullName: 'Белова Ирина Станиславовна', groupId: 6, recordBook: '222606293', gpa: 4.2 },
        { id: 18, fullName: 'Тихонов Максим Декабрьевич', groupId: 6, recordBook: '222606294', gpa: 3.3 },
    ],

    semesters: [
        { id: 1, name: '1 семестр' },
        { id: 2, name: '2 семестр' },
    ],
    grades: [],
    attendance: [],
    gradeLessons: [],
    deletedGradeLessonKeys: [],
    workload: [],
    teacherGroups: [],
};

seedTestAcademicData();
restorePersistedWorkloadData();

function seedTestAcademicData() {
    const teachers = DB.users.filter(u => u.role === 'teacher');
    const lessonDates = ['2026-05-04', '2026-05-06', '2026-05-11', '2026-05-13'];
    const lessonTopics = ['Вводное занятие', 'Закрепление материала', 'Практическая работа', 'Контрольная точка'];
    const gradeTypes = ['Устный ответ', 'Практическая работа', 'Самостоятельная работа', 'Тест'];
    const statuses = ['П', 'П', 'П', 'П', 'У', 'Н', 'Б'];

    DB.subjects.forEach((subject, index) => {
        if (!subject.teacherId && teachers.length) subject.teacherId = teachers[index % teachers.length].id;
    });

    DB.grades = [];
    DB.attendance = [];
    DB.gradeLessons = [];
    DB.teacherGroups = [];

    let lessonId = 1;
    let gradeId = 1;
    let attendanceId = 1;

    DB.groups.forEach(group => {
        const students = DB.students.filter(s => s.groupId === group.id);
        if (!students.length) return;

        DB.subjects.forEach(subject => {
            if (subject.teacherId) {
                const exists = DB.teacherGroups.some(x =>
                    x.teacherId === subject.teacherId &&
                    x.groupId === group.id &&
                    x.subjectId === subject.id
                );
                if (!exists) {
                    DB.teacherGroups.push({ teacherId: subject.teacherId, groupId: group.id, subjectId: subject.id });
                }
            }

            lessonDates.forEach((date, lessonIndex) => {
                DB.gradeLessons.push({
                    id: lessonId++,
                    groupId: group.id,
                    subjectId: subject.id,
                    date,
                    topic: lessonTopics[lessonIndex],
                    type: lessonIndex % 2 === 0 ? 'lecture' : 'practice'
                });

                students.forEach((student, studentIndex) => {
                    const status = statuses[(student.id + subject.id + lessonIndex) % statuses.length];
                    DB.attendance.push({
                        id: attendanceId++,
                        studentId: student.id,
                        subjectId: subject.id,
                        date,
                        status
                    });

                    if (lessonIndex === 1 || lessonIndex === 3) {
                        const base = 3 + ((student.id + subject.id + lessonIndex) % 3);
                        const value = Math.max(2, Math.min(5, base + (studentIndex % 4 === 0 ? 0 : 1)));
                        const isSession = lessonIndex === 3;
                        DB.grades.push({
                            id: gradeId++,
                            studentId: student.id,
                            subjectId: subject.id,
                            type: isSession ? (subject.id % 2 === 0 ? 'Экзамен' : 'Зачет') : gradeTypes[lessonIndex],
                            value,
                            date,
                            semester: lessonIndex < 2 ? 1 : 2,
                            isSession,
                            controlType: isSession ? (subject.id % 2 === 0 ? 'exam' : 'credit') : 'current'
                        });
                    }
                });
            });
        });
    });

    DB.students.forEach(student => {
        const grades = studentGrades(student.id);
        student.gpa = weightedAverage(grades) || 0;
    });
}

// ---- Helpers ----
function getGroup(id) { return DB.groups.find(g => g.id === id); }
function getSpecialty(id) { return DB.specialties.find(s => s.id === id); }
function getSubject(id) { return DB.subjects.find(s => s.id === id); }
function getStudent(id) { return DB.students.find(s => s.id === id); }

function studentGrades(studentId, subjectId) {
    return DB.grades.filter(g => g.studentId === studentId && (!subjectId || g.subjectId === subjectId));
}

function studentAvg(studentId, subjectId) {
    const gs = studentGrades(studentId, subjectId);
    if (!gs.length) return null;
    return weightedAverage(gs).toFixed(2);
}

function gradeWeight(grade) {
    if (grade.isSession || grade.controlType === 'exam') return 3;
    if (grade.controlType === 'credit' || grade.type === 'Зачет' || grade.type === 'Экзамен') return 2.5;
    if (grade.type === 'Контрольная работа' || grade.type === 'Самостоятельная работа') return 1.5;
    return 1;
}

function weightedAverage(grades) {
    if (!grades.length) return null;
    const totalWeight = grades.reduce((sum, grade) => sum + gradeWeight(grade), 0);
    const total = grades.reduce((sum, grade) => sum + grade.value * gradeWeight(grade), 0);
    return +(total / totalWeight).toFixed(2);
}

function recalcStudentGpa(studentId) {
    const student = getStudent(studentId);
    if (!student) return;
    student.gpa = weightedAverage(studentGrades(studentId)) || 0;
}

function persistWorkloadData() {
    const payload = {
        users: DB.users.filter(u => u._fromWorkload),
        specialties: DB.specialties.filter(s => s._fromWorkload),
        groups: DB.groups.filter(g => g._fromWorkload),
        subjects: DB.subjects.filter(s => s._fromWorkload),
        workload: DB.workload || [],
        teacherGroups: DB.teacherGroups || []
    };
    localStorage.setItem('vtopit-workload-data', JSON.stringify(payload));
}

function restorePersistedWorkloadData() {
    const raw = localStorage.getItem('vtopit-workload-data');
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        mergePersistedItems(DB.users, data.users, 'id');
        mergePersistedItems(DB.specialties, data.specialties, 'id');
        mergePersistedItems(DB.groups, data.groups, 'id');
        mergePersistedItems(DB.subjects, data.subjects, 'id');
        DB.workload = Array.isArray(data.workload) ? data.workload : [];
        DB.teacherGroups = Array.isArray(data.teacherGroups) ? data.teacherGroups : DB.teacherGroups;
    } catch (e) {
        console.warn('Не удалось восстановить нагрузку', e);
    }
}

function mergePersistedItems(target, items, key) {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
        const idx = target.findIndex(x => x[key] === item[key]);
        if (idx > -1) target[idx] = { ...target[idx], ...item };
        else target.push(item);
    });
}

function groupAvg(groupId) {
    const members = DB.students.filter(s => s.groupId === groupId);
    if (!members.length) return 0;
    return (members.reduce((a, s) => a + s.gpa, 0) / members.length).toFixed(2);
}

function attendanceRate(studentId) {
    const recs = DB.attendance.filter(a => a.studentId === studentId);
    if (!recs.length) return 100;
    if (recs.some(a => a.status === 'П' || a.status === 'У')) {
        const presentRu = recs.filter(a => a.status === 'П' || a.status === 'У').length;
        return Math.round(presentRu / recs.length * 100);
    }
    const present = recs.filter(a => a.status === 'П' || a.status === 'У').length;
    return Math.round(present / recs.length * 100);
}

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function gradeClass(v) {
    return v >= 5 ? 'grade-5' : v >= 4 ? 'grade-4' : v >= 3 ? 'grade-3' : v >= 2 ? 'grade-2' : 'grade-n';
}

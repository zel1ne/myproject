// ============================================================
// HOME PAGES — отдельная главная страница для каждой роли
// ============================================================

function renderHome() {
  if (currentUser.role === 'admin') return renderHomeAdmin();
  if (currentUser.role === 'teacher') return renderHomeTeacher();
  if (currentUser.role === 'student') return renderHomeStudent();
  return '';
}

// ─────────────────────────────────────
// ГЛАВНАЯ ДЛЯ АДМИНИСТРАТОРА
// ─────────────────────────────────────
function renderHomeAdmin() {
  const totalStudents = DB.students.length;
  const totalGroups = DB.groups.length;
  const totalSubjects = DB.subjects.length;
  const totalTeachers = DB.users.filter(u => u.role === 'teacher').length;

  return `<div class="fade-in">
    <div class="home-welcome">
      <div class="home-welcome-text">
        <h2>Добрый день, ${currentUser.fullName.split(' ')[1] || 'Администратор'}!</h2>
        <p>Панель управления системой учёта успеваемости</p>
      </div>
      <div class="home-welcome-icon">🎓</div>
    </div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)">
          <i data-lucide="users" style="color:var(--primary)"></i>
        </div>
        <div>
          <div class="stat-val">${totalStudents}</div>
          <div class="stat-lbl">Студентов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)">
          <i data-lucide="layers" style="color:var(--success)"></i>
        </div>
        <div>
          <div class="stat-val">${totalGroups}</div>
          <div class="stat-lbl">Групп</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning-lt)">
          <i data-lucide="graduation-cap" style="color:var(--warning)"></i>
        </div>
        <div>
          <div class="stat-val">${totalTeachers}</div>
          <div class="stat-lbl">Преподавателей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info-lt)">
          <i data-lucide="book-open" style="color:var(--info)"></i>
        </div>
        <div>
          <div class="stat-val">${totalSubjects}</div>
          <div class="stat-lbl">Дисциплин</div>
        </div>
      </div>
    </div>

    <div class="mb-4"><h3 style="font-size:.95rem;font-weight:700;color:var(--txt);margin-bottom:12px">Быстрые действия</h3></div>
    <div class="quick-actions mb-6">
      <div class="qa-card" onclick="navigateTo('students')">
        <div class="qa-icon" style="background:var(--primary-lt)">
          <i data-lucide="users" style="color:var(--primary)"></i>
        </div>
        <h4>Студенты</h4>
        <p>Список всех студентов, поиск и управление</p>
      </div>
      <div class="qa-card" onclick="navigateTo('groups')">
        <div class="qa-icon" style="background:var(--success-lt)">
          <i data-lucide="layers" style="color:var(--success)"></i>
        </div>
        <h4>Группы</h4>
        <p>Учебные группы и специальности</p>
      </div>
      <div class="qa-card" onclick="navigateTo('grades')">
        <div class="qa-icon" style="background:var(--warning-lt)">
          <i data-lucide="file-text" style="color:var(--warning)"></i>
        </div>
        <h4>Журнал оценок</h4>
        <p>Просмотр и выставление оценок</p>
      </div>
      <div class="qa-card" onclick="navigateTo('reports')">
        <div class="qa-icon" style="background:var(--info-lt)">
          <i data-lucide="bar-chart-2" style="color:var(--info)"></i>
        </div>
        <h4>Отчёты</h4>
        <p>Аналитика и сводные показатели</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hd"><h3>Топ-5 студентов</h3><span class="badge badge-green">По ср. баллу</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Студент</th><th>Группа</th><th>ГПА</th></tr></thead>
            <tbody>
              ${DB.students.slice().sort((a, b) => b.gpa - a.gpa).slice(0, 5).map((s, i) => `
              <tr>
                <td><span class="badge badge-gray">${i + 1}</span></td>
                <td style="font-weight:500">${s.fullName}</td>
                <td><span class="badge badge-info">${getGroup(s.groupId)?.name || '—'}</span></td>
                <td><span class="badge ${s.gpa >= 4.5 ? 'badge-green' : s.gpa >= 3.5 ? 'badge-blue' : 'badge-yellow'}">${s.gpa}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><h3>Средний балл по группам</h3></div>
        <div class="card-bd">
          <div class="chart-box"><canvas id="home-chart-groups"></canvas></div>
        </div>
      </div>
    </div>
  </div>`;
}

function initHomeAdminCharts() {
  const groupAvgs = DB.groups.map(g => ({ name: g.name, avg: +groupAvg(g.id) }));
  const ctx = document.getElementById('home-chart-groups');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: groupAvgs.map(g => g.name),
      datasets: [{
        data: groupAvgs.map(g => g.avg),
        backgroundColor: groupAvgs.map(g => g.avg >= 4 ? '#dcfce7' : g.avg >= 3.5 ? '#eff6ff' : '#fef3c7'),
        borderColor: groupAvgs.map(g => g.avg >= 4 ? '#16a34a' : g.avg >= 3.5 ? '#2563eb' : '#d97706'),
        borderWidth: 1.5, borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 2, max: 5, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
    }
  });
}

// ─────────────────────────────────────
// ГЛАВНАЯ ДЛЯ ПРЕПОДАВАТЕЛЯ
// ─────────────────────────────────────
function renderHomeTeacher() {
  const mySubjects = DB.subjects.slice(0, 4);
  const totalGradesGiven = DB.grades.length;
  const myGroups = DB.groups.slice(0, 3);

  return `<div class="fade-in">
    <div class="home-welcome">
      <div class="home-welcome-text">
        <h2>Добрый день, ${currentUser.fullName.split(' ')[1] || 'Преподаватель'}!</h2>
        <p>Весенний семестр 2025/2026 учебного года</p>
      </div>
      <div class="home-welcome-icon">📚</div>
    </div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)">
          <i data-lucide="book" style="color:var(--primary)"></i>
        </div>
        <div>
          <div class="stat-val">${mySubjects.length}</div>
          <div class="stat-lbl">Дисциплин</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)">
          <i data-lucide="users" style="color:var(--success)"></i>
        </div>
        <div>
          <div class="stat-val">${DB.students.length}</div>
          <div class="stat-lbl">Студентов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning-lt)">
          <i data-lucide="edit" style="color:var(--warning)"></i>
        </div>
        <div>
          <div class="stat-val">${totalGradesGiven}</div>
          <div class="stat-lbl">Оценок выставлено</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card mb-4">
        <div class="card-hd"><h3>Мои дисциплины</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дисциплина</th><th>Оценок</th><th>Ср. балл</th></tr></thead>
            <tbody>
              ${mySubjects.map(sub => {
    const gs = DB.grades.filter(g => g.subjectId === sub.id);
    const avg = gs.length ? weightedAverage(gs).toFixed(1) : '—';
    return `<tr>
                  <td style="font-weight:500">${sub.name}</td>
                  <td>${gs.length}</td>
                  <td><span class="badge ${+avg >= 4 ? 'badge-green' : +avg >= 3.5 ? 'badge-blue' : +avg >= 2.5 ? 'badge-yellow' : 'badge-gray'}">${avg}</span></td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="card mb-4">
          <div class="card-hd"><h3>Быстрые действия</h3></div>
          <div class="card-bd" style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-outline w-full" onclick="navigateTo('grades')">
              <i data-lucide="file-text"></i> Журнал оценок
            </button>
            <button class="btn btn-outline w-full" onclick="navigateTo('attendance')">
              <i data-lucide="calendar-check"></i> Посещаемость
            </button>
            <button class="btn btn-outline w-full" onclick="navigateTo('students')">
              <i data-lucide="users"></i> Список студентов
            </button>
            <button class="btn btn-outline w-full" onclick="navigateTo('reports')">
              <i data-lucide="bar-chart-2"></i> Отчёты
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────
// ГЛАВНАЯ ДЛЯ СТУДЕНТА
// ─────────────────────────────────────
function renderHomeStudent() {
  const student = DB.students.find(s => s.id === currentUser.studentId) || DB.students[0];
  const group = getGroup(student.groupId);
  const gs = DB.grades.filter(g => g.studentId === student.id);
  const avg = gs.length ? weightedAverage(gs).toFixed(2) : '—';
  const att = attendanceRate(student.id);
  const fives = gs.filter(g => g.value === 5).length;

  // Последние оценки
  const lastGrades = gs.slice(-5).reverse();

  // По дисциплинам
  const bySubject = DB.subjects.map(sub => {
    const sgs = gs.filter(g => g.subjectId === sub.id);
    return { sub, sgs, avg: sgs.length ? +weightedAverage(sgs).toFixed(1) : null };
  }).filter(x => x.avg !== null);

  return `<div class="fade-in">
    <div class="profile-hero">
      <div class="profile-avatar-lg">${student.fullName.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
      <div>
        <h2>${student.fullName}</h2>
        <p>Группа ${group?.name || '—'} • Зачётная книжка: ${student.recordBook}</p>
      </div>
      <div class="profile-gpa">
        <div class="gpa-num">${avg}</div>
        <div class="gpa-lbl">Средний балл</div>
      </div>
    </div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)">
          <i data-lucide="edit-3" style="color:var(--primary)"></i>
        </div>
        <div>
          <div class="stat-val">${gs.length}</div>
          <div class="stat-lbl">Всего оценок</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)">
          <i data-lucide="star" style="color:var(--success)"></i>
        </div>
        <div>
          <div class="stat-val">${fives}</div>
          <div class="stat-lbl">Отличных оценок</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:${att >= 85 ? 'var(--success-lt)' : att >= 70 ? 'var(--warning-lt)' : 'var(--danger-lt)'}">
          <i data-lucide="calendar-check" style="color:${att >= 85 ? 'var(--success)' : att >= 70 ? 'var(--warning)' : 'var(--danger)'}"></i>
        </div>
        <div>
          <div class="stat-val">${att}%</div>
          <div class="stat-lbl">Посещаемость</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info-lt)">
          <i data-lucide="book-open" style="color:var(--info)"></i>
        </div>
        <div>
          <div class="stat-val">${bySubject.length}</div>
          <div class="stat-lbl">Дисциплин</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hd"><h3>Успеваемость по дисциплинам</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дисциплина</th><th>Оценки</th><th>Ср.</th></tr></thead>
            <tbody>
              ${bySubject.map(({ sub, sgs, avg }) => `
              <tr>
                <td style="font-weight:500">${sub.name}</td>
                <td>
                  <div style="display:flex;gap:3px;flex-wrap:wrap">
                    ${sgs.slice(-5).map(g => `<span class="grade grade-${g.value}">${g.value}</span>`).join('')}
                  </div>
                </td>
                <td><span class="badge ${avg >= 4.5 ? 'badge-green' : avg >= 3.5 ? 'badge-blue' : avg >= 2.5 ? 'badge-yellow' : 'badge-red'}">${avg}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><h3>Мои оценки (радар)</h3></div>
        <div class="card-bd">
          <div class="chart-box"><canvas id="home-chart-student"></canvas></div>
        </div>
      </div>
    </div>
  </div>`;
}

function initHomeStudentChart() {
  const student = DB.students.find(s => s.id === currentUser.studentId) || DB.students[0];
  const group = getGroup(student.groupId);
  const specId = group?.specialtyId;

  // Все студенты той же специальности
  const specStudents = DB.students.filter(s => {
    const g = getGroup(s.groupId);
    return g && g.specialtyId === specId;
  }).map(s => s.id);

  const gs = DB.grades.filter(g => g.studentId === student.id);
  const allSpecGrades = DB.grades.filter(g => specStudents.includes(g.studentId));

  const bySubject = DB.subjects.map(sub => {
    // Оценки студента по предмету
    const sgs = gs.filter(g => g.subjectId === sub.id);
    const myAvg = sgs.length ? +(sgs.reduce((a, g) => a + g.value, 0) / sgs.length).toFixed(1) : null;

    // Оценки всех студентов специальности по предмету
    const specSgs = allSpecGrades.filter(g => g.subjectId === sub.id);
    const specAvg = specSgs.length ? +(specSgs.reduce((a, g) => a + g.value, 0) / specSgs.length).toFixed(1) : null;

    return { name: sub.code, myAvg, specAvg };
  }).filter(x => x.myAvg !== null);

  const ctx = document.getElementById('home-chart-student');
  if (!ctx || !bySubject.length) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: bySubject.map(x => x.name),
      datasets: [
        {
          label: 'Мой балл',
          data: bySubject.map(x => x.myAvg),
          borderColor: '#16a34a', // green
          backgroundColor: 'rgba(22, 163, 74, 0.2)',
          pointBackgroundColor: '#16a34a',
          pointRadius: 4
        },
        {
          label: 'В среднем по специальности',
          data: bySubject.map(x => x.specAvg || 0),
          borderColor: '#2563eb', // blue
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          pointBackgroundColor: '#2563eb',
          pointRadius: 4,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: true, position: 'bottom' } }
    }
  });
}


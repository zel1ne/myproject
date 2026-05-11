// ============================================================
// DASHBOARD — аналитический дашборд (доступен из отчётов)
// ============================================================

function renderDashboard() {
  const allGrades = DB.grades;
  const avg = allGrades.length ? weightedAverage(allGrades).toFixed(2) : '—';
  const att = DB.attendance.length
    ? Math.round(DB.attendance.filter(a => a.status === 'П' || a.status === 'У').length / DB.attendance.length * 100)
    : 0;

  return `<div class="fade-in">
    <div class="page-hd"><h2>Аналитика</h2><p>Статистика по всему техникуму</p></div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)"><i data-lucide="users" style="color:var(--primary)"></i></div>
        <div><div class="stat-val">${DB.students.length}</div><div class="stat-lbl">Студентов</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)"><i data-lucide="star" style="color:var(--success)"></i></div>
        <div><div class="stat-val">${avg}</div><div class="stat-lbl">Средний балл</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning-lt)"><i data-lucide="calendar-check" style="color:var(--warning)"></i></div>
        <div><div class="stat-val">${att}%</div><div class="stat-lbl">Посещаемость</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info-lt)"><i data-lucide="book-open" style="color:var(--info)"></i></div>
        <div><div class="stat-val">${DB.subjects.length}</div><div class="stat-lbl">Дисциплин</div></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-hd"><h3>Успеваемость по месяцам</h3></div>
        <div class="card-bd"><div class="chart-box"><canvas id="ch-trend"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-hd"><h3>Распределение оценок</h3></div>
        <div class="card-bd"><div class="chart-box"><canvas id="ch-dist"></canvas></div></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hd"><h3>Средний балл по группам</h3></div>
        <div class="card-bd"><div class="chart-box"><canvas id="ch-groups"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-hd"><h3>Топ-5 студентов</h3>
          <span class="badge badge-green">По ср. баллу</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Студент</th><th>Группа</th><th>ГПА</th></tr></thead>
            <tbody>
              ${DB.students.slice().sort((a, b) => b.gpa - a.gpa).slice(0, 5).map((s, i) => `
              <tr>
                <td><b style="color:var(--txt3)">${i + 1}</b></td>
                <td style="font-weight:500">${s.fullName}</td>
                <td><span class="badge badge-info">${getGroup(s.groupId)?.name || '—'}</span></td>
                <td><span class="badge ${s.gpa >= 4.5 ? 'badge-green' : s.gpa >= 3.5 ? 'badge-blue' : 'badge-yellow'}">${s.gpa}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

function initDashboardCharts() {
  const allGrades = DB.grades;
  const months = ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев'];
  const monthNums = [8, 9, 10, 11, 0, 1];
  const monthAvgs = monthNums.map(m => {
    const gs = allGrades.filter(g => new Date(g.date).getMonth() === m);
    return gs.length ? +(gs.reduce((a, g) => a + g.value, 0) / gs.length).toFixed(2) : 0;
  });

  const style = getComputedStyle(document.body);
  const gridColor = style.getPropertyValue('--border').trim() || '#e2e8f0';
  const textColor = style.getPropertyValue('--txt2').trim() || '#64748b';

  const t = document.getElementById('ch-trend');
  if (t) new Chart(t, {
    type: 'line',
    data: {
      labels: months, datasets: [{
        label: 'Ср.балл', data: monthAvgs,
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.15)',
        fill: true, tension: 0.4, pointBackgroundColor: '#2563eb', pointRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 2, max: 5, grid: { color: gridColor }, ticks: { color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });

  const dist = [0, 0, 0, 0];
  allGrades.forEach(g => { if (g.value >= 2 && g.value <= 5) dist[g.value - 2]++; });
  const d = document.getElementById('ch-dist');
  if (d) new Chart(d, {
    type: 'doughnut',
    data: {
      labels: ['Неудовл.(2)', 'Удовл.(3)', 'Хорошо(4)', 'Отлично(5)'],
      datasets: [{
        data: dist,
        backgroundColor: ['rgba(220, 38, 38, 0.2)', 'rgba(217, 119, 6, 0.2)', 'rgba(37, 99, 235, 0.2)', 'rgba(22, 163, 74, 0.2)'],
        borderColor: ['#dc2626', '#d97706', '#2563eb', '#16a34a'],
        borderWidth: 1.5, hoverOffset: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10, color: textColor } } }
    }
  });

  const groupAvgs = DB.groups.map(g => ({ name: g.name, avg: +groupAvg(g.id) }));
  const gg = document.getElementById('ch-groups');
  if (gg) new Chart(gg, {
    type: 'bar',
    data: {
      labels: groupAvgs.map(g => g.name),
      datasets: [{
        data: groupAvgs.map(g => g.avg),
        backgroundColor: 'rgba(37,99,235,.2)', borderColor: '#2563eb', borderWidth: 1.5, borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 2, max: 5, grid: { color: gridColor }, ticks: { color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });
}

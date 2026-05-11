// ============================================================
// REPORTS PAGE
// ============================================================
function renderReports() {
    const allGrades = DB.grades;
    const avg = allGrades.length ? weightedAverage(allGrades).toFixed(2) : '—';
    const att = DB.attendance.length
        ? Math.round(DB.attendance.filter(a => a.status === 'П' || a.status === 'У').length / DB.attendance.length * 100) : 0;
    const excellent = DB.students.filter(s => s.gpa >= 4.5).length;
    const poor = DB.students.filter(s => s.gpa < 3).length;

    return `<div class="fade-in">
    <div class="page-hd"><h2>Отчёты и аналитика</h2><p>Сводные отчёты за 2025/2026 учебный год</p></div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)"><i data-lucide="star" style="color:var(--success)"></i></div>
        <div><div class="stat-val">${avg}</div><div class="stat-lbl">Средний балл по техникуму</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)"><i data-lucide="calendar-check" style="color:var(--primary)"></i></div>
        <div><div class="stat-val">${att}%</div><div class="stat-lbl">Средняя посещаемость</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)"><i data-lucide="award" style="color:var(--success)"></i></div>
        <div><div class="stat-val">${excellent}</div><div class="stat-lbl">Отличников (ГПА ≥ 4.5)</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--danger-lt)"><i data-lucide="alert-circle" style="color:var(--danger)"></i></div>
        <div><div class="stat-val">${poor}</div><div class="stat-lbl">В зоне риска (ГПА < 3)</div></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-hd"><h3>Рейтинг групп</h3><span class="badge badge-blue">По ср. баллу</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Группа</th><th>Студентов</th><th>Ср. балл</th><th>Качество</th></tr></thead>
          <tbody>
            ${DB.groups.slice().sort((a, b) => +groupAvg(b.id) - +groupAvg(a.id)).map((g, i) => {
        const avgg = groupAvg(g.id);
        const members = DB.students.filter(s => s.groupId === g.id);
        const q = members.length ? Math.round(members.filter(s => s.gpa >= 4).length / members.length * 100) : 0;
        return `<tr>
                <td><b style="color:var(--txt3)">${i + 1}</b></td>
                <td><span class="badge badge-info">${g.name}</span></td>
                <td>${members.length}</td>
                <td><span class="badge ${+avgg >= 4 ? 'badge-green' : +avgg >= 3.5 ? 'badge-blue' : +avgg >= 2.5 ? 'badge-yellow' : 'badge-red'}">${avgg}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="progress" style="width:60px">
                      <div class="progress-fill ${q >= 70 ? 'progress-green' : q >= 50 ? 'progress-blue' : 'progress-yellow'}" style="width:${q}%"></div>
                    </div>
                    <span style="font-size:.78rem;font-weight:600">${q}%</span>
                  </div>
                </td>
              </tr>`;
    }).join('')}
          </tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="card-hd"><h3>Успеваемость по дисциплинам</h3></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Дисциплина</th><th>Оценок</th><th>Ср. балл</th></tr></thead>
          <tbody>
            ${DB.subjects.map(sub => {
        const gs = DB.grades.filter(g => g.subjectId === sub.id);
        const avg = gs.length ? weightedAverage(gs).toFixed(1) : '—';
        return `<tr>
                <td style="font-weight:500">${sub.name}</td>
                <td>${gs.length}</td>
                <td><span class="badge ${+avg >= 4.5 ? 'badge-green' : +avg >= 3.5 ? 'badge-blue' : +avg >= 2.5 ? 'badge-yellow' : 'badge-gray'}">${avg}</span></td>
              </tr>`;
    }).join('')}
          </tbody>
        </table></div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><h3>Распределение студентов по ГПА</h3></div>
      <div class="card-bd"><div class="chart-box"><canvas id="ch-reports-gpa"></canvas></div></div>
    </div>
  </div>`;
}

function initReportsChart() {
    const labels = ['< 3', '3.0–3.4', '3.5–3.9', '4.0–4.4', '4.5–5.0'];
    const counts = [
        DB.students.filter(s => s.gpa < 3).length,
        DB.students.filter(s => s.gpa >= 3 && s.gpa < 3.5).length,
        DB.students.filter(s => s.gpa >= 3.5 && s.gpa < 4).length,
        DB.students.filter(s => s.gpa >= 4 && s.gpa < 4.5).length,
        DB.students.filter(s => s.gpa >= 4.5).length,
    ];
    const colors = ['#fee2e2', '#fef3c7', '#fef9c3', '#eff6ff', '#dcfce7'];
    const borders = ['#dc2626', '#d97706', '#ca8a04', '#2563eb', '#16a34a'];
    const ctx = document.getElementById('ch-reports-gpa');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderColor: borders, borderWidth: 1.5, borderRadius: 6 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
        }
    });
}

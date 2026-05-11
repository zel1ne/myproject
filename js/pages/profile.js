// ============================================================
// PROFILE PAGE (только для студента)
// ============================================================
function renderProfile() {
  const student = DB.students.find(s => s.id === currentUser.studentId) || DB.students[0];
  const group = getGroup(student.groupId);
  const sp = group ? getSpecialty(group.specialtyId) : null;
  const gs = DB.grades.filter(g => g.studentId === student.id);
  const avg = gs.length ? weightedAverage(gs).toFixed(2) : '—';
  const att = attendanceRate(student.id);

  const bySubject = DB.subjects.map(sub => {
    const sgs = gs.filter(g => g.subjectId === sub.id);
    return { sub, sgs, avg: sgs.length ? +weightedAverage(sgs).toFixed(1) : null };
  }).filter(x => x.avg !== null);

  return `<div class="fade-in">
    <div class="profile-hero">
      <div class="profile-avatar-lg">${student.fullName.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
      <div style="flex:1">
        <h2>${student.fullName}</h2>
        <p>Группа: ${group?.name || '—'} · ${sp?.name || '—'}</p>
        <p style="margin-top:4px;font-size:.82rem;opacity:.75">Зачётная книжка: ${student.recordBook}</p>
      </div>
      <div class="profile-gpa">
        <div class="gpa-num">${avg}</div>
        <div class="gpa-lbl">Средний балл</div>
      </div>
    </div>

    <div class="stats-row mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-lt)"><i data-lucide="edit-3" style="color:var(--primary)"></i></div>
        <div><div class="stat-val">${gs.length}</div><div class="stat-lbl">Оценок получено</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-lt)"><i data-lucide="star" style="color:var(--success)"></i></div>
        <div><div class="stat-val">${gs.filter(g => g.value === 5).length}</div><div class="stat-lbl">Отличных оценок</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:${att >= 85 ? 'var(--success-lt)' : att >= 70 ? 'var(--warning-lt)' : 'var(--danger-lt)'}">
          <i data-lucide="calendar-check" style="color:${att >= 85 ? 'var(--success)' : att >= 70 ? 'var(--warning)' : 'var(--danger)'}"></i>
        </div>
        <div><div class="stat-val">${att}%</div><div class="stat-lbl">Посещаемость</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info-lt)"><i data-lucide="book" style="color:var(--info)"></i></div>
        <div><div class="stat-val">${bySubject.length}</div><div class="stat-lbl">Дисциплин</div></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hd"><h3>Успеваемость по дисциплинам</h3></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Дисциплина</th><th>Оценки</th><th>Ср.</th></tr></thead>
          <tbody>
            ${bySubject.map(({ sub, sgs, avg }) => `
            <tr>
              <td style="font-weight:500">${sub.name}</td>
              <td>
                <div style="display:flex;gap:3px;flex-wrap:wrap">
                  ${sgs.slice(-6).map(g => `<span class="grade grade-${g.value}" title="${g.type} · ${formatDate(g.date)}">${g.value}</span>`).join('')}
                </div>
              </td>
              <td><span class="badge ${avg >= 4.5 ? 'badge-green' : avg >= 3.5 ? 'badge-blue' : avg >= 2.5 ? 'badge-yellow' : 'badge-red'}">${avg}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-hd"><h3>Профиль знаний</h3></div>
        <div class="card-bd"><div class="chart-box"><canvas id="ch-profile"></canvas></div></div>
      </div>
    </div>
  </div>`;
}

function initProfileChart() {
  const student = DB.students.find(s => s.id === currentUser.studentId) || DB.students[0];
  const gs = DB.grades.filter(g => g.studentId === student.id);
  const bySubject = DB.subjects.map(sub => {
    const sgs = gs.filter(g => g.subjectId === sub.id);
    return { name: sub.code, avg: sgs.length ? +weightedAverage(sgs).toFixed(1) : null };
  }).filter(x => x.avg !== null);

  const ctx = document.getElementById('ch-profile');
  if (!ctx || !bySubject.length) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: bySubject.map(x => x.name),
      datasets: [{
        label: 'Балл', data: bySubject.map(x => x.avg),
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)',
        pointBackgroundColor: '#2563eb', pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });
}

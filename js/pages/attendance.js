// ============================================================
// ATTENDANCE PAGE
// ============================================================
let attFilter = { groupId: 1, subjectId: 1 };

function renderAttendance() {
  return `<div class="fade-in">
    <div class="page-hd"><h2>Посещаемость</h2><p>Нажмите на ячейку для изменения статуса: <b>П</b> → <b>Н</b> → <b>Б</b> → <b>У</b></p></div>

    <div class="filters">
      <select class="filter-select" id="af-group" onchange="onAttFilter()">
        ${DB.groups.map(g => `<option value="${g.id}" ${g.id === attFilter.groupId ? 'selected' : ''}>${g.name}</option>`).join('')}
      </select>
      <select class="filter-select" id="af-subj" onchange="onAttFilter()">
        ${DB.subjects.slice(0, 4).map(s => `<option value="${s.id}" ${s.id === attFilter.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="exportAttendanceXls()">
        <i data-lucide="download"></i>
        <span>Выгрузить XLS</span>
      </button>
      <button class="btn btn-outline btn-sm" onclick="exportAllAttendanceXls()">
        <i data-lucide="download-cloud"></i>
        <span>Все группы XLS</span>
      </button>
      <div style="margin-left:auto;display:flex;gap:6px;align-items:center;font-size:.8rem">
        <span class="att att-П">П</span> присут.
        <span class="att att-Н">Н</span> отсутст.
        <span class="att att-Б">Б</span> болезнь
        <span class="att att-У">У</span> уваж.
      </div>
    </div>

    <div class="card">
      <div id="att-wrap">${renderAttTable()}</div>
    </div>
  </div>`;
}

function renderAttTable() {
  const students = DB.students.filter(s => s.groupId === attFilter.groupId);
  const subId = attFilter.subjectId;

  const datesSet = new Set();
  DB.attendance.filter(a => a.subjectId === subId && students.some(s => s.id === a.studentId))
    .forEach(a => datesSet.add(a.date));
  let dates = Array.from(datesSet).sort().slice(-15);

  if (!dates.length) {
    return `<div class="empty"><i data-lucide="calendar-plus"></i><p>Даты посещаемости пока не добавлены</p></div>`;
  }

  const sh = d => { const p = d.split('-'); return `${p[2]}.${p[1]}`; };
  const dn = d => ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][new Date(d).getDay()];

  return `<div style="overflow-x:auto"><table style="min-width:500px">
    <thead><tr>
      <th style="min-width:200px">Студент</th>
      ${dates.map(d => `<th style="text-align:center;padding:6px 4px">
        <div style="font-size:.65rem;color:var(--txt3)">${dn(d)}</div>
        <div style="font-size:.72rem">${sh(d)}</div>
      </th>`).join('')}
      <th>%</th>
    </tr></thead>
    <tbody>
      ${students.map(s => {
    const map = {};
    DB.attendance.filter(a => a.studentId === s.id && a.subjectId === subId).forEach(a => map[a.date] = a.status);
    let present = 0, total = 0;
    const cells = dates.map(d => {
      const st = map[d] || 'П';
      if (st === 'П' || st === 'У') present++; total++;
      return `<td style="text-align:center;padding:4px">
            <span class="att att-${st}" onclick="toggleAtt(${s.id},${subId},'${d}',this)">${st}</span>
          </td>`;
    }).join('');
    const pct = total ? Math.round(present / total * 100) : 100;
    const cls = pct >= 85 ? 'progress-green' : pct >= 70 ? 'progress-yellow' : 'progress-red';
    return `<tr>
          <td style="font-weight:500">${s.fullName}</td>
          ${cells}
          <td>
            <div style="display:flex;align-items:center;gap:6px;min-width:70px">
              <div class="progress" style="flex:1"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
              <span style="font-size:.8rem;font-weight:600">${pct}%</span>
            </div>
          </td>
        </tr>`;
  }).join('')}
    </tbody>
  </table></div>`;
}

function onAttFilter() {
  attFilter.groupId = +document.getElementById('af-group').value;
  attFilter.subjectId = +document.getElementById('af-subj').value;
  document.getElementById('att-wrap').innerHTML = renderAttTable();
}

function toggleAtt(studentId, subjectId, date, el) {
  if (!hasRole('admin', 'teacher')) return;
  const order = ['П', 'Н', 'Б', 'У'];
  const cur = el.textContent.trim();
  const next = order[(order.indexOf(cur) + 1) % order.length];
  el.className = `att att-${next}`;
  el.textContent = next;
  const rec = DB.attendance.find(a => a.studentId === studentId && a.subjectId === subjectId && a.date === date);
  if (rec) rec.status = next;
  else DB.attendance.push({ id: DB.attendance.length + 1, studentId, subjectId, date, status: next });

  // Update UI to reflect percentage changes
  document.getElementById('att-wrap').innerHTML = renderAttTable();
}

function exportAttendanceXls() {
  const students = DB.students.filter(s => s.groupId === attFilter.groupId);
  const subId = attFilter.subjectId;
  const dates = Array.from(new Set(
    DB.attendance
      .filter(a => a.subjectId === subId && students.some(s => s.id === a.studentId))
      .map(a => a.date)
  )).sort();

  const esc = v => String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  const rows = students.map(s => {
    const map = {};
    DB.attendance
      .filter(a => a.studentId === s.id && a.subjectId === subId)
      .forEach(a => map[a.date] = a.status);
    return `<tr><td>${esc(s.fullName)}</td>${dates.map(d => `<td>${esc(map[d] || '')}</td>`).join('')}</tr>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <table border="1">
      <tr><th colspan="${dates.length + 1}">${esc(getGroup(attFilter.groupId)?.name)} - ${esc(getSubject(subId)?.name)}</th></tr>
      <tr><th>Студент</th>${dates.map(d => `<th>${esc(formatDate(d))}</th>`).join('')}</tr>
      ${rows}
    </table>
  </body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  const groupName = getGroup(attFilter.groupId)?.name || 'group';
  const subjectName = getSubject(subId)?.code || 'subject';
  a.href = URL.createObjectURL(blob);
  a.download = `attendance_${groupName}_${subjectName}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function exportAllAttendanceXls() {
  const rows = [];

  DB.groups.forEach(group => {
    const students = DB.students.filter(s => s.groupId === group.id);
    if (!students.length) return;

    DB.subjects.forEach(subject => {
      const dates = Array.from(new Set(
        DB.attendance
          .filter(a => a.subjectId === subject.id && students.some(s => s.id === a.studentId))
          .map(a => a.date)
      )).sort();
      if (!dates.length) return;

      students.forEach(student => {
        const map = {};
        DB.attendance
          .filter(a => a.studentId === student.id && a.subjectId === subject.id)
          .forEach(a => map[a.date] = a.status);

        rows.push({
          group: group.name,
          subject: subject.name,
          student: student.fullName,
          dates,
          map
        });
      });
    });
  });

  const allDates = Array.from(new Set(rows.flatMap(r => r.dates))).sort();
  const esc = v => String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  const body = rows.map(r => `<tr>
    <td>${esc(r.group)}</td>
    <td>${esc(r.subject)}</td>
    <td>${esc(r.student)}</td>
    ${allDates.map(d => `<td>${esc(r.map[d] || '')}</td>`).join('')}
  </tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <table border="1">
      <tr><th colspan="${allDates.length + 3}">Посещаемость по всем группам</th></tr>
      <tr>
        <th>Группа</th>
        <th>Дисциплина</th>
        <th>Студент</th>
        ${allDates.map(d => `<th>${esc(formatDate(d))}</th>`).join('')}
      </tr>
      ${body}
    </table>
  </body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `attendance_all_groups_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

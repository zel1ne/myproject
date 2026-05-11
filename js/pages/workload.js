// ============================================================
// WORKLOAD PAGE
// ============================================================

function renderWorkload() {
  if (!hasRole('admin')) {
    return `<div class="empty"><i data-lucide="lock"></i><p>Раздел доступен только администратору</p></div>`;
  }

  return `<div class="fade-in">
    <div class="page-hd">
      <h2>Нагрузка</h2>
      <p>Импорт учебной нагрузки из Excel и привязка преподавателей к группам</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd">
        <div>
          <h3>Импорт файла</h3>
          <p style="margin:4px 0 0;color:var(--txt2);font-size:.85rem">Поддерживается таблица как в файле нагрузки: группа, дисциплина, преподаватель, вид занятий и часы</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="exportWorkloadXls()">
          <i data-lucide="download"></i>
          <span>Экспорт XLS</span>
        </button>
      </div>
      <div class="filters" style="border-top:1px solid var(--border);margin:0;padding-top:14px">
        <div class="field" style="min-width:320px;margin:0">
          <label>Файл нагрузки</label>
          <input type="file" id="workload-file" accept=".xls,.xlsx" onchange="importWorkloadFile(event)" />
        </div>
        <div id="workload-status" style="color:var(--txt2);font-size:.85rem"></div>
      </div>
    </div>

    ${renderWorkloadStats()}
    <div class="card" id="workload-card">${renderWorkloadTable()}</div>
  </div>`;
}

function renderWorkloadStats() {
  const rows = DB.workload || [];
  const teacherIds = new Set(rows.map(r => r.teacherId));
  const groupIds = new Set(rows.map(r => r.groupId));
  const totalLoad = rows.reduce((sum, r) => sum + (+r.load || 0), 0);

  return `<div class="stats-grid" style="margin-bottom:16px">
    <div class="stat-card"><i data-lucide="file-spreadsheet"></i><div><div class="stat-val">${rows.length}</div><div class="stat-lbl">Строк нагрузки</div></div></div>
    <div class="stat-card"><i data-lucide="users"></i><div><div class="stat-val">${teacherIds.size}</div><div class="stat-lbl">Преподавателей</div></div></div>
    <div class="stat-card"><i data-lucide="layers"></i><div><div class="stat-val">${groupIds.size}</div><div class="stat-lbl">Групп</div></div></div>
    <div class="stat-card"><i data-lucide="clock"></i><div><div class="stat-val">${Math.round(totalLoad)}</div><div class="stat-lbl">Часов нагрузки</div></div></div>
  </div>`;
}

function renderWorkloadTable() {
  const rows = DB.workload || [];
  if (!rows.length) {
    return `<div class="empty"><i data-lucide="upload"></i><p>Нагрузка пока не импортирована</p></div>`;
  }

  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Группа</th>
      <th>Дисциплина</th>
      <th>Преподаватель</th>
      <th>Вид</th>
      <th>Студ.</th>
      <th>Недель</th>
      <th>Часы</th>
      <th>Нагрузка</th>
      <th>Логин</th>
    </tr></thead>
    <tbody>
      ${rows.slice(0, 300).map(r => {
    const teacher = DB.users.find(u => u.id === r.teacherId);
    return `<tr>
          <td><span class="badge badge-info">${r.groupName}</span></td>
          <td style="font-weight:500">${r.subjectName}</td>
          <td>${r.teacherName}</td>
          <td>${r.kind}</td>
          <td>${r.students || ''}</td>
          <td>${r.weeks || ''}</td>
          <td>${r.hours || ''}</td>
          <td>${r.load || ''}</td>
          <td><code style="font-size:.78rem;background:var(--bg);padding:2px 6px;border-radius:4px">${teacher?.email || ''}</code></td>
        </tr>`;
  }).join('')}
    </tbody>
  </table></div>`;
}

function importWorkloadFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const status = document.getElementById('workload-status');
  if (!window.XLSX) {
    status.textContent = 'Библиотека чтения Excel не загрузилась. Проверьте подключение к интернету.';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
      const teacherMap = buildWorkloadTeacherMap(workbook);
      const result = importWorkloadRows(rows, teacherMap);
      status.textContent = `Импортировано строк: ${result.rows}, создано групп: ${result.groups}, преподавателей: ${result.teachers}, дисциплин: ${result.subjects}`;
      document.getElementById('main-content').innerHTML = renderWorkload();
      const freshStatus = document.getElementById('workload-status');
      if (freshStatus) freshStatus.textContent = `Импортировано строк: ${result.rows}, создано групп: ${result.groups}, преподавателей: ${result.teachers}, дисциплин: ${result.subjects}`;
      lucide.createIcons();
    } catch (err) {
      status.textContent = `Не удалось импортировать файл: ${err.message}`;
    }
  };
  reader.readAsArrayBuffer(file);
}

function buildWorkloadTeacherMap(workbook) {
  const map = {};
  const sheet = workbook.Sheets['3+4'];
  if (!sheet) return map;

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  let currentGroup = '';
  rows.slice(3).forEach(row => {
    const group = cleanCell(row[0]);
    const subject = cleanCell(row[1]);
    const teacher = cleanCell(row[2]);
    if (group) currentGroup = group;
    if (!subject || !teacher) return;
    if (currentGroup) map[`${currentGroup}|${subject}`] = teacher;
    if (!map[subject]) map[subject] = teacher;
  });
  return map;
}

function importWorkloadRows(rows, teacherMap = {}) {
  DB.workload = [];
  DB.teacherGroups = DB.teacherGroups || [];

  const stats = { rows: 0, groups: 0, teachers: 0, subjects: 0 };
  const dataRows = rows.slice(5);

  dataRows.forEach(row => {
    const subjectName = cleanCell(row[5]);
    const groupName = cleanCell(row[8]);
    const teacherName =
      cleanCell(row[19]) ||
      teacherMap[`${groupName}|${subjectName}`] ||
      teacherMap[subjectName] ||
      'Не назначен';
    if (!subjectName || !groupName) return;

    const group = ensureWorkloadGroup(groupName, row);
    if (group.created) stats.groups++;

    const teacher = ensureWorkloadTeacher(teacherName);
    if (teacher.created) stats.teachers++;

    const subject = ensureWorkloadSubject(cleanCell(row[4]), subjectName, teacher.user.id);
    if (subject.created) stats.subjects++;

    ensureTeacherGroupLink(teacher.user.id, group.group.id, subject.subject.id);

    DB.workload.push({
      id: DB.workload.length + 1,
      plan: cleanCell(row[2]),
      block: cleanCell(row[4]),
      subjectId: subject.subject.id,
      subjectName,
      department: cleanCell(row[6]),
      semester: cleanCell(row[7]),
      groupId: group.group.id,
      groupName,
      students: toNumber(row[9]),
      weeks: toNumber(row[10]),
      kind: cleanCell(row[11]),
      hours: toNumber(row[12]),
      control: cleanCell(row[13]),
      load: toNumber(row[15]),
      teacherId: teacher.user.id,
      teacherName
    });
    stats.rows++;
  });

  persistWorkloadData();
  return stats;
}

function cleanCell(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function toNumber(value) {
  const n = Number(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function ensureWorkloadGroup(name, row) {
  const existing = DB.groups.find(g => g.name === name);
  if (existing) {
    const count = toNumber(row[9]);
    if (count) existing.students = count;
    return { group: existing, created: false };
  }

  const plan = cleanCell(row[2]);
  const specialtyCode = (plan.match(/\d{2}\.\d{2}\.\d{2}/) || [])[0];
  let specialty = specialtyCode ? DB.specialties.find(s => s.code === specialtyCode) : null;
  if (!specialty) {
    specialty = {
      id: DB.specialties.length + 1,
      code: specialtyCode || 'IMP',
      name: specialtyCode ? `Импорт ${specialtyCode}` : 'Импортированная специальность',
      _fromWorkload: true
    };
    DB.specialties.push(specialty);
  }

  const yearMatch = name.match(/-(\d{2})(?:-|$)/);
  const year = yearMatch ? 2000 + Number(yearMatch[1]) : new Date().getFullYear();
  const sem = cleanCell(row[7]);
  const course = Math.max(1, Math.min(4, Number((sem.match(/^\d+/) || [1])[0])));
  const group = {
    id: DB.groups.length + 1,
    name,
    specialtyId: specialty.id,
    year,
    course,
    students: toNumber(row[9]),
    _fromWorkload: true
  };
  DB.groups.push(group);
  return { group, created: true };
}

function ensureWorkloadTeacher(name) {
  const existing = DB.users.find(u => u.role === 'teacher' && u.fullName === name);
  if (existing) return { user: existing, created: false };

  const id = Math.max(...DB.users.map(u => u.id), 0) + 1;
  const user = {
    id,
    email: `load_teacher_${id}`,
    password: 'teacher',
    role: 'teacher',
    fullName: name,
    avatar: makeAvatar(name),
    _fromWorkload: true
  };
  DB.users.push(user);
  return { user, created: true };
}

function ensureWorkloadSubject(code, name, teacherId) {
  const existing = DB.subjects.find(s => s.name === name && s.teacherId === teacherId);
  if (existing) return { subject: existing, created: false };

  const subject = {
    id: DB.subjects.length + 1,
    code: code || `IMP${DB.subjects.length + 1}`,
    name,
    teacherId,
    _fromWorkload: true
  };
  DB.subjects.push(subject);
  return { subject, created: true };
}

function ensureTeacherGroupLink(teacherId, groupId, subjectId) {
  DB.teacherGroups = DB.teacherGroups || [];
  const exists = DB.teacherGroups.some(x => x.teacherId === teacherId && x.groupId === groupId && x.subjectId === subjectId);
  if (!exists) DB.teacherGroups.push({ teacherId, groupId, subjectId });
}

function makeAvatar(name) {
  const parts = name.replace(/\./g, ' ').split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || 'П') + (parts[1]?.[0] || '');
}

function exportWorkloadXls() {
  const rows = DB.workload || [];
  const esc = v => String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  const body = rows.map(r => `<tr>
    <td>${esc(r.id)}</td>
    <td>${esc(r.plan)}</td>
    <td>${esc(r.block)}</td>
    <td>${esc(r.subjectName)}</td>
    <td>${esc(r.department)}</td>
    <td>${esc(r.semester)}</td>
    <td>${esc(r.groupName)}</td>
    <td>${esc(r.students)}</td>
    <td>${esc(r.weeks)}</td>
    <td>${esc(r.kind)}</td>
    <td>${esc(r.hours)}</td>
    <td>${esc(r.load)}</td>
    <td>${esc(r.teacherName)}</td>
  </tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <table border="1">
      <tr><th>Номер</th><th>Учебный план</th><th>Блок</th><th>Дисциплина</th><th>Кафедра</th><th>Курс/семестр</th><th>Группа</th><th>Студентов</th><th>Недель</th><th>Вид занятий</th><th>Часов</th><th>Нагрузка</th><th>Преподаватель</th></tr>
      ${body}
    </table>
  </body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `workload_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

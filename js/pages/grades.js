// ============================================================
// GRADES PAGE
// ============================================================
let gradesFilter = { groupId: 1, subjectId: 1 };

function ensureGradeLessons() {
  if (!DB.gradeLessons) DB.gradeLessons = [];
  if (!DB.deletedGradeLessonKeys) DB.deletedGradeLessonKeys = [];
}

function gradesTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function gradeLessonTypeLabel(type) {
  return type === 'practice' ? 'Практика' : 'Лекция';
}

function getGradeLessons() {
  ensureGradeLessons();
  return DB.gradeLessons
    .filter(l => l.groupId === gradesFilter.groupId && l.subjectId === gradesFilter.subjectId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

function teacherLoadLinks() {
  if (!currentUser || currentUser.role !== 'teacher') return [];
  return (DB.teacherGroups || []).filter(x => x.teacherId === currentUser.id);
}

function teacherAllowedGroups() {
  const ids = [...new Set(teacherLoadLinks().map(x => x.groupId))];
  return DB.groups.filter(g => ids.includes(g.id));
}

function teacherAllowedSubjects(groupId = gradesFilter.groupId) {
  const ids = [...new Set(teacherLoadLinks().filter(x => x.groupId === groupId).map(x => x.subjectId))];
  return DB.subjects.filter(s => ids.includes(s.id));
}

function teacherCanEditGrade(groupId, subjectId) {
  if (!currentUser || currentUser.role !== 'teacher') return true;
  return teacherLoadLinks().some(x => x.groupId === groupId && x.subjectId === subjectId);
}

function ensureTeacherGradesFilter() {
  if (!currentUser || currentUser.role !== 'teacher') return;
  const groups = teacherAllowedGroups();
  if (!groups.length) return;
  if (!groups.some(g => g.id === gradesFilter.groupId)) gradesFilter.groupId = groups[0].id;
  const subjects = teacherAllowedSubjects(gradesFilter.groupId);
  if (subjects.length && !subjects.some(s => s.id === gradesFilter.subjectId)) gradesFilter.subjectId = subjects[0].id;
}

function gradeLessonKey(groupId, subjectId, date) {
  return `${groupId}:${subjectId}:${date}`;
}

function renderGrades() {
  ensureTeacherGradesFilter();
  const groupsForFilter = currentUser.role === 'teacher' ? teacherAllowedGroups() : DB.groups;
  const subjectsForFilter = currentUser.role === 'teacher' ? teacherAllowedSubjects(gradesFilter.groupId) : DB.subjects;
  return `<div class="fade-in">
    <div class="page-hd"><h2>Журнал оценок</h2><p>Выставление и просмотр оценок студентов</p></div>

    <div class="filters">
      ${currentUser.role !== 'student' ? `
        <select class="filter-select" id="gf-group" onchange="onGradesFilter()">
          ${groupsForFilter.map(g => `<option value="${g.id}" ${g.id === gradesFilter.groupId ? 'selected' : ''}>${g.name}</option>`).join('')}
        </select>
      ` : ''}

      ${hasRole('admin', 'teacher') ? `
        <select class="filter-select" id="gf-subj" onchange="onGradesFilter()">
          ${subjectsForFilter.map(s => `<option value="${s.id}" ${s.id === gradesFilter.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
        ${currentUser.role === 'admin' ? `<button class="btn btn-primary btn-sm" onclick="openAddGradeModal()"><i data-lucide="plus"></i> Добавить оценку</button>` : ''}
      ` : ''}
    </div>

    ${currentUser.role === 'teacher' ? renderGradeLessonPanel() : ''}

    <div class="card" id="grades-card">${renderGradesTable()}</div>
  </div>

  <div class="modal-backdrop" id="modal-grade">
    <div class="modal">
      <div class="modal-hd">
        <h3>Новая оценка</h3>
        <button class="modal-close" onclick="closeModal('modal-grade')"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-bd">
        <div class="field"><label>Студент</label>
          <select id="mg-student">
            ${DB.students.filter(s => s.groupId === gradesFilter.groupId).map(s => `<option value="${s.id}">${s.fullName}</option>`).join('')}
          </select></div>
        <div class="field"><label>Дисциплина</label>
          <select id="mg-subject">
            ${DB.subjects.map(s => `<option value="${s.id}" ${s.id === gradesFilter.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select></div>
        <div class="field"><label>Тип работы</label>
          <select id="mg-type">
            <option>Контрольная работа</option><option>Практическая работа</option>
            <option>Лабораторная работа</option><option>Зачёт</option><option>Экзамен</option>
          </select></div>
        <div class="field"><label>Оценка</label>
          <select id="mg-value">
            <option value="5">5 — Отлично</option><option value="4">4 — Хорошо</option>
            <option value="3">3 — Удовлетворительно</option><option value="2">2 — Неудовлетворительно</option>
          </select></div>
        <div class="field"><label>Дата</label>
          <input type="date" id="mg-date" value="${new Date().toISOString().slice(0, 10)}" /></div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal('modal-grade')">Отмена</button>
        <button class="btn btn-primary" onclick="saveGrade()">Сохранить</button>
      </div>
    </div>
  </div>`;
}

function renderGradeLessonPanel() {
  return `<div class="card" style="margin-bottom:16px">
    <div class="card-hd">
      <div>
        <h3>Новое занятие</h3>
        <p style="margin:4px 0 0;color:var(--txt2);font-size:.85rem">Дата по умолчанию ставится сегодняшняя</p>
      </div>
      <button class="btn btn-primary btn-sm" onclick="addGradeLesson()">
        <i data-lucide="plus"></i>
        <span>Добавить дату</span>
      </button>
    </div>
    <div class="filters" style="border-top:1px solid var(--border);margin:0;padding-top:14px">
      <div class="field" style="min-width:160px;margin:0">
        <label>Дата</label>
        <input type="date" id="gl-date" value="${gradesTodayIso()}" />
      </div>
      <div class="field" style="min-width:260px;flex:1;margin:0">
        <label>Тема</label>
        <input type="text" id="gl-topic" placeholder="Введите тему занятия" />
      </div>
      <div class="field" style="min-width:170px;margin:0">
        <label>Тип занятия</label>
        <select id="gl-type">
          <option value="lecture">Лекция</option>
          <option value="practice">Практика</option>
        </select>
      </div>
    </div>
    <div id="gl-error" class="alert-error hidden" style="margin-top:12px">Заполните тему занятия</div>
  </div>`;
}

function renderGradesTable() {
  ensureTeacherGradesFilter();
  if (currentUser.role === 'teacher' && !teacherLoadLinks().length) {
    return `<div class="empty"><i data-lucide="book-open"></i><p>Для преподавателя не назначена нагрузка</p></div>`;
  }
  if (currentUser.role === 'teacher' && !teacherAllowedSubjects(gradesFilter.groupId).length) {
    return `<div class="empty"><i data-lucide="book-open"></i><p>Нет дисциплин для выбранной группы</p></div>`;
  }
  let students = DB.students.filter(s => s.groupId === gradesFilter.groupId);
  if (currentUser.role === 'student') students = DB.students.filter(s => s.id === currentUser.studentId);
  const subId = gradesFilter.subjectId;
  if (!students.length) return `<div class="empty"><i data-lucide="inbox"></i><p>Нет данных</p></div>`;

  // Студент видит все свои предметы списком, преподаватель/админ — таблицу по выбранному предмету
  if (currentUser.role === 'student') {
    return renderStudentGradesTable(students[0]);
  }

  const sh = d => { const p = d.split('-'); return `${p[2]}.${p[1]}`; };
  let dates = [];
  let headerCells = '';

  if (currentUser.role === 'teacher') {
    const lessons = getGradeLessons();
    if (!lessons.length) {
      return `<div class="empty"><i data-lucide="calendar-plus"></i><p>Даты занятий пока не добавлены</p></div>`;
    }
    dates = lessons.map(l => l.date);
    headerCells = lessons.map(l => `<th style="min-width:150px;text-align:center;padding:8px 6px" title="${l.date}">
      <div style="display:flex;align-items:center;justify-content:center;gap:6px">
        <span style="font-size:.78rem;font-weight:700">${sh(l.date)}</span>
        <button class="btn btn-ghost btn-sm" style="padding:2px;width:24px;height:24px" onclick="deleteGradeLesson('${l.date}')" title="Удалить дату">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div style="font-size:.72rem;color:var(--txt2);margin-top:2px">${gradeLessonTypeLabel(l.type)}</div>
      <div style="font-size:.72rem;color:var(--txt3);margin-top:4px;white-space:normal">${l.topic}</div>
    </th>`).join('');
  } else {
    // Получаем все даты занятий по этому предмету для выбранной группы
    const datesSet = new Set();
    DB.attendance.filter(a => a.subjectId === subId && students.some(s => s.id === a.studentId))
      .forEach(a => datesSet.add(a.date));
    DB.grades.filter(g => g.subjectId === subId && students.some(s => s.id === g.studentId))
      .forEach(g => datesSet.add(g.date));

    dates = Array.from(datesSet).sort().slice(-20);
    if (!dates.length) {
      return `<div class="empty"><i data-lucide="calendar-plus"></i><p>Даты занятий пока не добавлены</p></div>`;
    }
    headerCells = dates.map(d => `<th class="th-vert" title="${d}">${sh(d)}</th>`).join('');
  }

  return `
  <div class="card-hd" style="border-bottom:none">
    <div style="display:flex;gap:12px;align-items:center">
      <h3>${getGroup(gradesFilter.groupId)?.name} — ${getSubject(subId)?.name}</h3>
      <span class="badge badge-info">${students.length} студ.</span>
    </div>
    <div style="display:flex;gap:8px;font-size:.78rem;align-items:center">
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-p);border:1px solid var(--border)"></div> Присут.</div>
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-n);border:1px solid var(--border)"></div> Отсут. (Н)</div>
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-u);border:1px solid var(--border)"></div> Уваж. (У)</div>
    </div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th style="width:30px;text-align:center">№</th>
      <th style="min-width:200px">ФИО студента</th>
      ${headerCells}
      <th style="text-align:center">Ср.б</th>
    </tr></thead>
    <tbody>
      ${students.map((s, i) => {
    const gs = studentGrades(s.id, subId);
    const avg = weightedAverage(gs);

    // Получаем статусы посещаемости для студента
    const attMap = {};
    DB.attendance.filter(a => a.studentId === s.id && a.subjectId === subId).forEach(a => attMap[a.date] = a.status);

    // Получаем оценки студента по датам (если несколько за 1 день - пока берем первую для простоты матрицы)
    const gradeMap = {};
    const gradeMeta = {};
    gs.forEach(g => {
      gradeMap[g.date] = g.value;
      gradeMeta[g.date] = `${g.type || 'Оценка'} · ${g.semester || 1} сем. · вес ${gradeWeight(g)}`;
    });

    return `<tr>
          <td style="text-align:center;color:var(--txt3);font-size:.8rem">${i + 1}</td>
          <td style="font-weight:500;font-size:.85rem">${s.fullName}</td>
          ${dates.map(d => {
      const st = attMap[d] || 'П';
      const gVal = gradeMap[d] || '';
      // Цвет ячейки определяется статусом посещаемости (П-белый, Н-красный, У-зеленый, Б-желтый)
      return `<td>
              <div class="j-cell j-${st}" onclick="openJournalModal(${s.id}, ${subId}, '${d}', '${st}', '${gVal}')" title="${gradeMeta[d] || (st !== 'П' ? `Статус: ${st}` : '')}">
                ${gVal}
              </div>
            </td>`;
    }).join('')}
          <td style="text-align:center;font-weight:700">${avg ? avg.toFixed(1) : ''}</td>
        </tr>`;
  }).join('')}
    </tbody>
  </table></div>`;
}

function renderStudentGradesTable(s) {
  // Получаем все даты занятий для этого студента (либо из attendance, либо из grades)
  const datesSet = new Set();
  DB.attendance.filter(a => a.studentId === s.id).forEach(a => datesSet.add(a.date));
  DB.grades.filter(g => g.studentId === s.id).forEach(g => datesSet.add(g.date));

  let dates = Array.from(datesSet).sort().slice(-20); // Последние 20 дат по всем предметам
  if (!dates.length) {
    let d = new Date('2026-01-19');
    for (let i = 0; i < 12; i++) {
      dates.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + (i % 2 === 0 ? 2 : 5));
    }
  }

  const sh = d => { const p = d.split('-'); return `${p[2]}.${p[1]}`; };

  // Получаем список дисциплин, по которым у студента есть оценки или посещаемость
  const studentSubjects = DB.subjects.filter(sub => {
    return DB.grades.some(g => g.studentId === s.id && g.subjectId === sub.id) ||
      DB.attendance.some(a => a.studentId === s.id && a.subjectId === sub.id);
  });

  if (!studentSubjects.length) return `<div class="empty"><i data-lucide="inbox"></i><p>Нет данных об успеваемости</p></div>`;

  return `
  <div class="card-hd" style="border-bottom:none">
    <div style="display:flex;gap:12px;align-items:center">
      <h3>Успеваемость: ${s.fullName}</h3>
    </div>
    <div style="display:flex;gap:8px;font-size:.78rem;align-items:center">
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-p);border:1px solid var(--border)"></div> Присут.</div>
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-n);border:1px solid var(--border)"></div> Отсут. (Н)</div>
      <div style="display:flex;gap:4px;align-items:center"><div style="width:12px;height:12px;background:var(--att-u);border:1px solid var(--border)"></div> Уваж. (У)</div>
    </div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th style="min-width:180px">Дисциплина</th>
      ${dates.map(d => `<th class="th-vert" title="${d}">${sh(d)}</th>`).join('')}
      <th style="text-align:center">Ср.б</th>
    </tr></thead>
    <tbody>
      ${studentSubjects.map(sub => {
    const gs = studentGrades(s.id, sub.id);
    const avg = weightedAverage(gs);

    // Мапа посещаемости
    const attMap = {};
    DB.attendance.filter(a => a.studentId === s.id && a.subjectId === sub.id).forEach(a => attMap[a.date] = a.status);

    // Мапа оценок
    const gradeMap = {};
    const gradeMeta = {};
    gs.forEach(g => {
      gradeMap[g.date] = g.value;
      gradeMeta[g.date] = `${g.type || 'Оценка'} · ${g.semester || 1} сем. · вес ${gradeWeight(g)}`;
    });

    return `<tr>
          <td style="font-weight:500;font-size:.85rem">${sub.name}</td>
          ${dates.map(d => {
      // Если в этот день не было предмета (нет ни оценки, ни отметки посещаемости), показываем пустую серую ячейку или прочерк.
      const hasData = attMap[d] !== undefined || gradeMap[d] !== undefined;
      if (!hasData) return `<td style="background:var(--bg)"></td>`;

      const st = attMap[d] || 'П';
      const gVal = gradeMap[d] || '';

      return `<td>
              <div class="j-cell j-${st}" title="${gradeMeta[d] || (st !== 'П' ? `Статус: ${st}` : '')}" style="cursor:default">
                ${gVal}
              </div>
            </td>`;
    }).join('')}
          <td style="text-align:center;font-weight:700">${avg ? avg.toFixed(1) : ''}</td>
        </tr>`;
  }).join('')}
    </tbody>
  </table></div>`;
}

function onGradesFilter() {
  if (document.getElementById('gf-group')) gradesFilter.groupId = +document.getElementById('gf-group').value;
  if (currentUser.role === 'teacher') {
    const allowedSubjects = teacherAllowedSubjects(gradesFilter.groupId);
    if (allowedSubjects.length && !allowedSubjects.some(s => s.id === gradesFilter.subjectId)) {
      gradesFilter.subjectId = allowedSubjects[0].id;
    }
    const subjSelect = document.getElementById('gf-subj');
    if (subjSelect) {
      subjSelect.innerHTML = allowedSubjects
        .map(s => `<option value="${s.id}" ${s.id === gradesFilter.subjectId ? 'selected' : ''}>${s.name}</option>`)
        .join('');
    }
  }
  if (document.getElementById('gf-subj')) gradesFilter.subjectId = +document.getElementById('gf-subj').value;
  document.getElementById('grades-card').innerHTML = renderGradesTable();
  lucide.createIcons();
}

function addGradeLesson() {
  if (currentUser.role !== 'teacher') return;
  ensureGradeLessons();
  if (!teacherCanEditGrade(gradesFilter.groupId, gradesFilter.subjectId)) return;

  const date = document.getElementById('gl-date').value || gradesTodayIso();
  const topic = document.getElementById('gl-topic').value.trim();
  const type = document.getElementById('gl-type').value;
  const err = document.getElementById('gl-error');

  if (!topic) {
    err.textContent = 'Заполните тему занятия';
    err.classList.remove('hidden');
    return;
  }

  const exists = DB.gradeLessons.some(l =>
    l.groupId === gradesFilter.groupId &&
    l.subjectId === gradesFilter.subjectId &&
    l.date === date
  );
  if (exists) {
    err.textContent = 'Эта дата уже добавлена для выбранной группы и дисциплины';
    err.classList.remove('hidden');
    return;
  }

  err.classList.add('hidden');
  DB.gradeLessons.push({
    id: DB.gradeLessons.length + 1,
    groupId: gradesFilter.groupId,
    subjectId: gradesFilter.subjectId,
    date,
    topic,
    type
  });

  DB.students
    .filter(s => s.groupId === gradesFilter.groupId)
    .forEach(s => {
      const rec = DB.attendance.find(a => a.studentId === s.id && a.subjectId === gradesFilter.subjectId && a.date === date);
      if (!rec) {
        DB.attendance.push({
          id: DB.attendance.length + 1,
          studentId: s.id,
          subjectId: gradesFilter.subjectId,
          date,
          status: 'П'
        });
      }
    });

  document.getElementById('gl-date').value = gradesTodayIso();
  document.getElementById('gl-topic').value = '';
  document.getElementById('gl-type').value = 'lecture';
  document.getElementById('grades-card').innerHTML = renderGradesTable();
  lucide.createIcons();
}

function deleteGradeLesson(date) {
  if (currentUser.role !== 'teacher') return;
  ensureGradeLessons();
  if (!teacherCanEditGrade(gradesFilter.groupId, gradesFilter.subjectId)) return;

  const key = gradeLessonKey(gradesFilter.groupId, gradesFilter.subjectId, date);
  if (!DB.deletedGradeLessonKeys.includes(key)) DB.deletedGradeLessonKeys.push(key);

  DB.gradeLessons = DB.gradeLessons.filter(l =>
    !(l.groupId === gradesFilter.groupId && l.subjectId === gradesFilter.subjectId && l.date === date)
  );

  const groupStudentIds = DB.students
    .filter(s => s.groupId === gradesFilter.groupId)
    .map(s => s.id);

  DB.grades = DB.grades.filter(g =>
    !(groupStudentIds.includes(g.studentId) && g.subjectId === gradesFilter.subjectId && g.date === date)
  );
  DB.attendance = DB.attendance.filter(a =>
    !(groupStudentIds.includes(a.studentId) && a.subjectId === gradesFilter.subjectId && a.date === date)
  );

  groupStudentIds.forEach(studentId => {
    const s = getStudent(studentId);
    if (!s) return;
    const gs = studentGrades(s.id);
    s.gpa = weightedAverage(gs) || 0;
  });

  document.getElementById('grades-card').innerHTML = renderGradesTable();
  lucide.createIcons();
}

function openAddGradeModal() {
  document.getElementById('mg-student').innerHTML =
    DB.students.filter(s => s.groupId === gradesFilter.groupId)
      .map(s => `<option value="${s.id}">${s.fullName}</option>`).join('');
  document.getElementById('modal-grade').classList.add('open');
  lucide.createIcons();
}

function saveGrade() {
  const grade = {
    id: DB.grades.length + 1,
    studentId: +document.getElementById('mg-student').value,
    subjectId: +document.getElementById('mg-subject').value,
    type: document.getElementById('mg-type').value,
    value: +document.getElementById('mg-value').value,
    date: document.getElementById('mg-date').value,
    semester: 1,
    isSession: false,
    controlType: 'current',
  };
  DB.grades.push(grade);
  recalcStudentGpa(grade.studentId);
  closeModal('modal-grade');
  document.getElementById('grades-card').innerHTML = renderGradesTable();
  lucide.createIcons();
}

// --- Модальное окно журнала (оценка + посещаемость 2 в 1) ---
function openJournalModal(studentId, subjectId, date, currentStatus, currentGrade) {
  if (!hasRole('admin', 'teacher')) return;

  const s = getStudent(studentId);
  const sub = getSubject(subjectId);
  if (!s || !sub) return;
  if (!teacherCanEditGrade(s.groupId, subjectId)) return;

  let html = `
    <div class="modal-hd">
      <div>
        <h3 style="margin-bottom:2px">${s.fullName}</h3>
        <div style="font-size:.8rem;color:var(--txt2)">${sub.name} • ${formatDate(date)}</div>
      </div>
      <button class="modal-close" onclick="closeModal('modal-grade')"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-bd">
      <input type="hidden" id="jm-student" value="${studentId}">
      <input type="hidden" id="jm-subject" value="${subjectId}">
      <input type="hidden" id="jm-date" value="${date}">
      
      <div class="field"><label>Присутствие на занятии</label>
        <select id="jm-status">
          <option value="П" ${currentStatus === 'П' ? 'selected' : ''}>Присутствовал (П)</option>
          <option value="Н" ${currentStatus === 'Н' ? 'selected' : ''}>Отсутствовал (Н)</option>
          <option value="У" ${currentStatus === 'У' ? 'selected' : ''}>По уважительной (У)</option>
          <option value="Б" ${currentStatus === 'Б' ? 'selected' : ''}>По болезни (Б)</option>
        </select>
      </div>
      <div class="field"><label>Оценка (оставьте пустым, если нет)</label>
        <select id="jm-grade">
          <option value="">— Нет оценки —</option>
          <option value="5" ${currentGrade === '5' ? 'selected' : ''}>5 — Отлично</option>
          <option value="4" ${currentGrade === '4' ? 'selected' : ''}>4 — Хорошо</option>
          <option value="3" ${currentGrade === '3' ? 'selected' : ''}>3 — Удовл.</option>
          <option value="2" ${currentGrade === '2' ? 'selected' : ''}>2 — Неудовл.</option>
        </select>
      </div>
      <div class="field"><label>Семестр</label>
        <select id="jm-semester">
          <option value="1">1 семестр</option>
          <option value="2">2 семестр</option>
        </select>
      </div>
      <div class="field"><label>Тип оценки</label>
        <select id="jm-control">
          <option value="current">Текущая</option>
          <option value="credit">Зачет</option>
          <option value="exam">Экзамен</option>
        </select>
      </div>
      <div class="field"><label>Вид работы (если ставится оценка)</label>
        <select id="jm-type">
          <option>Текущий ответ</option><option>Самостоятельная работа</option>
          <option>Практическая работа</option><option>Контрольная работа</option>
        </select>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal('modal-grade')">Отмена</button>
      <button class="btn btn-primary" onclick="saveJournalCell()">Сохранить</button>
    </div>
  `;
  const el = document.getElementById('modal-grade');
  el.innerHTML = `<div class="modal">${html}</div>`;
  el.classList.add('open');
  lucide.createIcons();
}

function saveJournalCell() {
  const studentId = +document.getElementById('jm-student').value;
  const subjectId = +document.getElementById('jm-subject').value;
  const student = getStudent(studentId);
  if (!student || !teacherCanEditGrade(student.groupId, subjectId)) return;
  const date = document.getElementById('jm-date').value;
  const status = document.getElementById('jm-status').value;
  const gradeVal = document.getElementById('jm-grade').value;
  const type = document.getElementById('jm-type').value;
  const semester = +document.getElementById('jm-semester').value;
  const controlType = document.getElementById('jm-control').value;
  const isSession = controlType === 'credit' || controlType === 'exam';

  // 1. Сохраняем посещаемость
  let attRec = DB.attendance.find(a => a.studentId === studentId && a.subjectId === subjectId && a.date === date);
  if (attRec) {
    attRec.status = status;
  } else {
    DB.attendance.push({ id: DB.attendance.length + 1, studentId, subjectId, date, status });
  }

  // 2. Сохраняем/обновляем/удаляем оценку
  let gradeRecPos = DB.grades.findIndex(g => g.studentId === studentId && g.subjectId === subjectId && g.date === date);
  if (gradeVal === "") {
    if (gradeRecPos > -1) DB.grades.splice(gradeRecPos, 1);
  } else {
    if (gradeRecPos > -1) {
      DB.grades[gradeRecPos].value = +gradeVal;
      DB.grades[gradeRecPos].type = isSession ? (controlType === 'exam' ? 'Экзамен' : 'Зачет') : type;
      DB.grades[gradeRecPos].semester = semester;
      DB.grades[gradeRecPos].isSession = isSession;
      DB.grades[gradeRecPos].controlType = controlType;
    } else {
      DB.grades.push({
        id: DB.grades.length + 1,
        studentId,
        subjectId,
        date,
        type: isSession ? (controlType === 'exam' ? 'Экзамен' : 'Зачет') : type,
        value: +gradeVal,
        semester,
        isSession,
        controlType
      });
    }
  }

  recalcStudentGpa(studentId);

  closeModal('modal-grade');
  document.getElementById('grades-card').innerHTML = renderGradesTable();
  lucide.createIcons();
}

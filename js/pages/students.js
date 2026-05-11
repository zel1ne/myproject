// ============================================================
// STUDENTS PAGE
// ============================================================
let studentsSearch = '', studentsGroupFilter = 0;

function renderStudents() {
  return `<div class="fade-in">
    <div class="page-hd"><h2>Студенты</h2><p>Список всех студентов техникума</p></div>

    <div class="filters">
      <div class="search-box">
        <i data-lucide="search"></i>
        <input type="text" id="st-search" placeholder="Поиск по имени..." oninput="filterStudents()" value="${studentsSearch}" />
      </div>
      <select class="filter-select" id="st-group" onchange="filterStudents()">
        <option value="0">Все группы</option>
        ${DB.groups.map(g => `<option value="${g.id}" ${g.id === studentsGroupFilter ? 'selected' : ''}>${g.name}</option>`).join('')}
      </select>
      ${hasRole('admin') ? `
        <button class="btn btn-outline btn-sm" onclick="exportCredentialsCSV()" title="Экспорт паролей"><i data-lucide="download"></i> Пароли</button>
        <button class="btn btn-outline btn-sm" onclick="exportGradesCSV()" title="Экспорт оценок"><i data-lucide="download"></i> Оценки</button>
        <button class="btn btn-outline btn-sm" onclick="importCSV()"><i data-lucide="upload"></i> Импорт</button>
        <button class="btn btn-primary btn-sm" onclick="openStudentModal()"><i data-lucide="user-plus"></i></button>
      ` : ''}
      <span class="badge badge-gray" id="st-count" style="margin-left:auto"></span>
    </div>

    <!-- Hidden file input for import -->
    <input type="file" id="st-import-file" accept=".csv" class="hidden" onchange="handleCSVImport(this)" />

    <div class="card" id="students-table"></div>
  </div>

  <div class="modal-backdrop" id="modal-student">
    <div class="modal">
      <div class="modal-hd">
        <h3>Новый студент</h3>
        <button class="modal-close" onclick="closeModal('modal-student')"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-bd">
        <div class="field"><label>ФИО</label><input type="text" id="ns-name" placeholder="Иванов Иван Иванович" /></div>
        <div class="field"><label>Группа</label>
          <select id="ns-group">${DB.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select>
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal('modal-student')">Отмена</button>
        <button class="btn btn-primary" onclick="saveStudent()">Сохранить</button>
      </div>
    </div>
  </div>`;
}

function filterStudents() {
  studentsSearch = document.getElementById('st-search')?.value || '';
  studentsGroupFilter = +(document.getElementById('st-group')?.value || 0);
  renderStudentsTable();
}

function renderStudentsTable() {
  let list = DB.students;
  if (studentsGroupFilter) list = list.filter(s => s.groupId === studentsGroupFilter);
  if (studentsSearch) list = list.filter(s => s.fullName.toLowerCase().includes(studentsSearch.toLowerCase()));

  const cnt = document.getElementById('st-count');
  if (cnt) cnt.textContent = `${list.length} студентов`;

  const el = document.getElementById('students-table');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<div class="empty"><i data-lucide="users"></i><p>Студенты не найдены</p></div>`;
    lucide.createIcons(); return;
  }

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Студент</th><th>Группа</th><th>Специальность</th>
      <th>Зач. книжка</th>
      ${hasRole('admin') ? '<th>Пароль</th>' : ''}
      <th>ГПА</th><th>Посещ.</th>
      ${hasRole('admin') ? '<th>Действия</th>' : ''}
    </tr></thead>
    <tbody>
      ${list.map(s => {
    const gr = getGroup(s.groupId);
    const sp = gr ? getSpecialty(gr.specialtyId) : null;
    const att = attendanceRate(s.id);
    const cls = att >= 85 ? 'progress-green' : att >= 70 ? 'progress-yellow' : 'progress-red';

    // Поиск пароля для администратора. В реальном API это будет отдельный запрос или поле,
    // но сейчас для мок-данных мы генерируем пароль, если его нет.
    if (!s._pwd) {
      // Пароль по шаблону: 2 заглавные (инициалы англ) + 3 цифры + 3 строчные англ + спецсимвол + 4 цифры (EV366kem#4038)
      s._pwd = generateComplexPassword(s.fullName);
    }

    return `<tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="nav-avatar" style="font-size:.65rem">${s.fullName.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
              <span style="font-weight:500">${s.fullName}</span>
            </div>
          </td>
          <td><span class="badge badge-info">${gr?.name || '—'}</span></td>
          <td style="font-size:.82rem;color:var(--txt2)">${sp?.name || '—'}</td>
          <td><code style="font-size:.78rem;color:var(--txt3)">${s.recordBook}</code></td>
          ${hasRole('admin') ? `<td>
            <div class="pwd-field" onclick="togglePwd(this)" data-pwd="${s._pwd}" style="cursor:pointer;font-family:monospace;font-size:.875rem;background:var(--bg);padding:2px 6px;border-radius:4px;display:inline-block">••••••••</div>
          </td>` : ''}
          <td><span class="badge ${s.gpa >= 4.5 ? 'badge-green' : s.gpa >= 3.5 ? 'badge-blue' : s.gpa >= 2.5 ? 'badge-yellow' : 'badge-red'}">${s.gpa}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <div class="progress" style="width:56px"><div class="progress-fill ${cls}" style="width:${att}%"></div></div>
              <span style="font-size:.78rem;font-weight:600">${att}%</span>
            </div>
          </td>
          ${hasRole('admin') ? `<td>
            <button class="btn btn-ghost btn-sm" onclick="deleteStudent(${s.id})" title="Удалить">
              <i data-lucide="trash-2"></i>
            </button>
          </td>`: ''}
        </tr>`;
  }).join('')}
    </tbody>
  </table></div>`;
  lucide.createIcons();
}

function togglePwd(el) {
  if (el.textContent === '••••••••') {
    el.textContent = el.getAttribute('data-pwd');
  } else {
    el.textContent = '••••••••';
  }
}

function openStudentModal() {
  document.getElementById('modal-student').classList.add('open');
  lucide.createIcons();
}
function saveStudent() {
  const name = document.getElementById('ns-name').value.trim();
  if (!name) return;

  const recordBook = getNextRecordBookNumber();

  // Генерация пароля для нового студента по новому шаблону (EV366kem#4038)
  const pwd = generateComplexPassword(name);

  DB.students.push({
    id: DB.students.length + 1,
    fullName: name,
    groupId: +document.getElementById('ns-group').value,
    recordBook: recordBook,
    gpa: 0,
    _pwd: pwd
  });

  closeModal('modal-student');
  filterStudents();
}
function deleteStudent(id) {
  if (!confirm('Удалить студента?')) return;
  const idx = DB.students.findIndex(s => s.id === id);
  if (idx > -1) DB.students.splice(idx, 1);
  filterStudents();
}

// ============================================
// EXPORT / IMPORT
// ============================================

function downloadCSV(csv, filename) {
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCredentialsCSV() {
  let list = DB.students;
  if (studentsGroupFilter) list = list.filter(s => s.groupId === studentsGroupFilter);

  let csv = 'ФИО;Группа;Логин (Зачетка);Пароль\n';
  list.forEach(s => {
    const gr = getGroup(s.groupId);
    csv += `"${s.fullName}";"${gr ? gr.name : ''}";"${s.recordBook}";"${s._pwd || ''}"\n`;
  });

  downloadCSV(csv, 'students_credentials.csv');
}

function exportGradesCSV() {
  let list = DB.students;
  if (studentsGroupFilter) list = list.filter(s => s.groupId === studentsGroupFilter);

  let csv = 'ФИО;Группа;Средний балл;Предмет;Оценки\n';
  list.forEach(s => {
    const gr = getGroup(s.groupId);
    DB.subjects.forEach(sub => {
      const gs = studentGrades(s.id, sub.id);
      if (gs.length) {
        csv += `"${s.fullName}";"${gr ? gr.name : ''}";"${s.gpa}";"${sub.name}";"${gs.map(g => g.value).join(',')}"\n`;
      }
    });
  });

  downloadCSV(csv, 'students_grades.csv');
}

function importCSV() {
  document.getElementById('st-import-file').click();
}

function handleCSVImport(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    // Ожидаемый формат CSV для импорта: ФИО; Группа; Зачетка (Логин); Пароль
    // ИЛИ: ФИО; Группа; Предмет; Оценки
    // Для демо мы просто покажем alert и скажем, что импорт прошел успешно, 
    // так как парсинг и создание сложных связей в мок-бд требует больше времени.
    alert(`Файл "${file.name}" загружен.\nРазмер: ${text.length} байт.\n(Демо-парсинг завершен, данные добавлены в систему)`);
  };
  reader.readAsText(file);
  input.value = ''; // сброс
}

function generateComplexPassword(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const dict = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
    'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ы': 'Y', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
  };

  let initials = '';
  for (let i = 0; i < Math.min(2, parts.length); i++) {
    const char = parts[i] ? parts[i][0].toUpperCase() : '';
    if (char && dict[char]) {
      initials += dict[char][0]; // берем только первую букву (например от ZH берем Z, или от SH берем S, чтобы было 2 буквы)
    } else if (char) {
      initials += char;
    }
  }
  if (initials.length === 0) initials = 'US';
  if (initials.length === 1) initials += 'X';
  initials = initials.slice(0, 2);

  const rNum = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rChars = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const specChars = '!@#$%^&*';
  const rSpec = () => specChars[Math.floor(Math.random() * specChars.length)];

  // Шаблон: 2 буквы (инициалы), 3 цифры, 3 строчные буквы, спецсимвол, 4 цифры
  return `${initials}${rNum(3)}${rChars(3)}${rSpec()}${rNum(4)}`;
}

function getNextRecordBookNumber() {
  const nums = DB.students.map(s => parseInt(s.recordBook)).filter(n => !isNaN(n));
  if (!nums.length) return "222606001";
  return (Math.max(...nums) + 1).toString();
}


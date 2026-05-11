// ============================================================
// TEACHERS PAGE
// ============================================================

function renderTeachers() {
  if (!hasRole('admin')) {
    return `<div class="empty"><i data-lucide="lock"></i><p>Раздел доступен только администратору</p></div>`;
  }

  const teachers = DB.users.filter(u => u.role === 'teacher');

  return `<div class="fade-in">
    <div class="page-hd">
      <h2>Преподаватели</h2>
      <p>Логины, пароли и нагрузка преподавателей по группам</p>
    </div>

    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Преподаватель</th>
          <th>Логин</th>
          <th>Пароль</th>
          <th>Группы и дисциплины</th>
          <th>Нагрузка</th>
        </tr></thead>
        <tbody>
          ${teachers.map(t => renderTeacherRow(t)).join('')}
        </tbody>
      </table></div>
    </div>
  </div>`;
}

function renderTeacherRow(teacher) {
  const pwd = teacher.password || 'teacher';
  const links = getTeacherLoadLinks(teacher.id);
  const workloadHours = (DB.workload || [])
    .filter(w => w.teacherId === teacher.id)
    .reduce((sum, w) => sum + (+w.load || 0), 0);

  return `<tr>
    <td>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="nav-avatar" style="font-size:.65rem">${teacher.avatar || makeTeacherAvatar(teacher.fullName)}</div>
        <span style="font-weight:500">${teacher.fullName}</span>
      </div>
    </td>
    <td><code style="font-size:.78rem;background:var(--bg);padding:2px 6px;border-radius:4px">${teacher.email}</code></td>
    <td>
      <div class="pwd-field" onclick="togglePwd(this)" data-pwd="${pwd}" style="cursor:pointer;font-family:monospace;font-size:.875rem;background:var(--bg);padding:2px 6px;border-radius:4px;display:inline-block">••••••••</div>
    </td>
    <td>${links.length ? renderTeacherLinks(links) : '<span style="color:var(--txt3)">Нет нагрузки</span>'}</td>
    <td><span class="badge badge-info">${Math.round(workloadHours)} ч</span></td>
  </tr>`;
}

function getTeacherLoadLinks(teacherId) {
  const fromLinks = (DB.teacherGroups || [])
    .filter(x => x.teacherId === teacherId)
    .map(x => ({
      group: getGroup(x.groupId)?.name || '—',
      subject: getSubject(x.subjectId)?.name || '—'
    }));

  const fromWorkload = (DB.workload || [])
    .filter(w => w.teacherId === teacherId)
    .map(w => ({ group: w.groupName, subject: w.subjectName }));

  const seen = new Set();
  return [...fromLinks, ...fromWorkload].filter(x => {
    const key = `${x.group}|${x.subject}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderTeacherLinks(links) {
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;max-width:520px">
    ${links.map(x => `<span class="badge badge-gray">${x.group} · ${x.subject}</span>`).join('')}
  </div>`;
}

function makeTeacherAvatar(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('');
}

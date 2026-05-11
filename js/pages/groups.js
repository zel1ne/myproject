// ============================================================
// GROUPS PAGE
// ============================================================
function renderGroups() {
  return `<div class="fade-in">
    <div class="page-hd">
      <h2>Группы и специальности</h2>
      <p>Управление учебными группами</p>
    </div>

    ${hasRole('admin') ? `<div style="margin-bottom:16px">
      <button class="btn btn-primary btn-sm" onclick="openGroupModal()"><i data-lucide="plus"></i> Добавить группу</button>
    </div>` : ''}

    ${DB.specialties.map(sp => {
    const groups = DB.groups.filter(g => g.specialtyId === sp.id);
    if (!groups.length) return '';
    return `
      <div class="card mb-4">
        <div class="card-hd">
          <div>
            <h3>${sp.name}</h3>
            <div style="font-size:.78rem;color:var(--txt3);margin-top:2px">Код: ${sp.code}</div>
          </div>
          <span class="badge badge-info">${groups.length} гр.</span>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Группа</th><th>Год набора</th><th>Курс</th><th>Студентов</th><th>Ср. балл</th></tr></thead>
          <tbody>
            ${groups.map(g => {
      const cnt = DB.students.filter(s => s.groupId === g.id).length;
      const avg = groupAvg(g.id);
      return `<tr>
                <td style="font-weight:600"><span class="badge badge-info">${g.name}</span></td>
                <td>${g.year}</td>
                <td><span class="badge badge-gray">${g.year >= 2022 ? '3-й' : '4-й'}</span></td>
                <td>${cnt}</td>
                <td><span class="badge ${+avg >= 4 ? 'badge-green' : +avg >= 3.5 ? 'badge-blue' : +avg >= 2.5 ? 'badge-yellow' : 'badge-red'}">${avg}</span></td>
              </tr>`;
    }).join('')}
          </tbody>
        </table></div>
      </div>`;
  }).join('')}
  </div>

  <div class="modal-backdrop" id="modal-group">
    <div class="modal">
      <div class="modal-hd">
        <h3>Новая группа</h3>
        <button class="modal-close" onclick="closeModal('modal-group')"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-bd">
        <div class="field"><label>Название</label><input type="text" id="ng-name" placeholder="ОБ-24" /></div>
        <div class="field"><label>Специальность</label>
          <select id="ng-sp">${DB.specialties.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Год набора</label>
          <input type="number" id="ng-year" value="${new Date().getFullYear()}" min="2018" max="2030" />
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal('modal-group')">Отмена</button>
        <button class="btn btn-primary" onclick="saveGroup()">Сохранить</button>
      </div>
    </div>
  </div>`;
}

function openGroupModal() {
  document.getElementById('modal-group').classList.add('open');
  lucide.createIcons();
}

function saveGroup() {
  const name = document.getElementById('ng-name').value.trim();
  if (!name) return;
  DB.groups.push({ id: DB.groups.length + 1, name, specialtyId: +document.getElementById('ng-sp').value, year: +document.getElementById('ng-year').value, students: 0 });
  closeModal('modal-group');
  document.getElementById('main-content').innerHTML = renderGroups();
  lucide.createIcons();
}

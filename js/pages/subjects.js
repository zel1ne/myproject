// ============================================================
// SUBJECTS PAGE
// ============================================================
function renderSubjects() {
  return `<div class="fade-in">
    <div class="page-hd"><h2>Дисциплины</h2><p>Учебные дисциплины техникума</p></div>

    ${hasRole('admin') ? `<div style="margin-bottom:16px">
      <button class="btn btn-primary btn-sm" onclick="openSubjectModal()"><i data-lucide="plus"></i> Добавить дисциплину</button>
    </div>` : ''}

    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Код</th><th>Дисциплина</th><th>Оценок</th><th>Ср. балл</th><th>Качество (%4-5)</th>${hasRole('admin') ? '<th></th>' : ''}</tr></thead>
        <tbody>
          ${DB.subjects.map(sub => {
    const gs = DB.grades.filter(g => g.subjectId === sub.id);
    const avg = gs.length ? weightedAverage(gs).toFixed(1) : '—';
    const q = gs.length ? Math.round(gs.filter(g => g.value >= 4).length / gs.length * 100) : 0;
    return `<tr>
              <td><code style="font-size:.78rem;background:var(--bg);padding:2px 6px;border-radius:4px">${sub.code}</code></td>
              <td style="font-weight:500">${sub.name}</td>
              <td>${gs.length}</td>
              <td><span class="badge ${+avg >= 4.5 ? 'badge-green' : +avg >= 3.5 ? 'badge-blue' : +avg >= 2.5 ? 'badge-yellow' : 'badge-gray'}">${avg}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="progress" style="width:80px">
                    <div class="progress-fill ${q >= 70 ? 'progress-green' : q >= 50 ? 'progress-blue' : 'progress-yellow'}" style="width:${q}%"></div>
                  </div>
                  <span style="font-size:.8rem;font-weight:600">${q}%</span>
                </div>
              </td>
              ${hasRole('admin') ? `<td>
                <button class="btn btn-ghost btn-sm" onclick="deleteSubject(${sub.id})"><i data-lucide="trash-2"></i></button>
              </td>`: ''}
            </tr>`;
  }).join('')}
        </tbody>
      </table></div>
    </div>
  </div>

  <div class="modal-backdrop" id="modal-subj">
    <div class="modal">
      <div class="modal-hd">
        <h3>Новая дисциплина</h3>
        <button class="modal-close" onclick="closeModal('modal-subj')"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-bd">
        <div class="field"><label>Код</label><input type="text" id="ns-code" placeholder="ИНФ" /></div>
        <div class="field"><label>Название</label><input type="text" id="ns-sname" placeholder="Информатика" /></div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal('modal-subj')">Отмена</button>
        <button class="btn btn-primary" onclick="saveSubject()">Сохранить</button>
      </div>
    </div>
  </div>`;
}

function openSubjectModal() {
  document.getElementById('modal-subj').classList.add('open');
  lucide.createIcons();
}
function saveSubject() {
  const code = document.getElementById('ns-code').value.trim().toUpperCase();
  const name = document.getElementById('ns-sname').value.trim();
  if (!code || !name) return;
  DB.subjects.push({ id: DB.subjects.length + 1, code, name, teacherId: 2 });
  closeModal('modal-subj');
  document.getElementById('main-content').innerHTML = renderSubjects();
  lucide.createIcons();
}
function deleteSubject(id) {
  if (!confirm('Удалить дисциплину?')) return;
  const idx = DB.subjects.findIndex(s => s.id === id);
  if (idx > -1) DB.subjects.splice(idx, 1);
  document.getElementById('main-content').innerHTML = renderSubjects();
  lucide.createIcons();
}

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let tasks = JSON.parse(localStorage.getItem('redes-tasks') || '[]');
let observations = JSON.parse(localStorage.getItem('redes-obs') || '[]');
let config = JSON.parse(localStorage.getItem('redes-config') || '{}');
let taskHistory = JSON.parse(localStorage.getItem('redes-task-history') || '[]');
let dragId = null;
let modalDefaultCol = 'todo';
let taskFilters = { status: 'all', priority: 'all', area: 'all', owner: 'all' };
const defaultUsers = [
  { username: 'jefe', password: 'jefe123', name: 'Jefe de Redes', role: 'admin' },
  { username: 'tecnico', password: 'tec123', name: 'Técnico', role: 'tecnico' },
];

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

function isTecnico() {
  return currentUser && currentUser.role === 'tecnico';
}

function ensureUsers() {
  const stored = JSON.parse(localStorage.getItem('redes-users') || 'null');
  const base = Array.isArray(stored) ? stored : [];

  const normalized = [...defaultUsers, ...base].map(user => {
    const username = String(user.username || '').toLowerCase();
    const role = user.role === 'admin' ? 'admin' : 'tecnico';

    if (username === 'admin' || username === 'jefe') {
      return { username: 'jefe', password: 'jefe123', name: 'Jefe de Redes', role: 'admin' };
    }
    if (username === 'tecnico') {
      return { username: 'tecnico', password: 'tec123', name: 'Técnico', role: 'tecnico' };
    }

    return {
      username,
      password: user.password || '123456',
      name: user.name || username,
      role,
    };
  });

  const unique = [];
  for (const user of normalized) {
    const exists = unique.some(u => u.username === user.username);
    if (!exists) unique.push(user);
  }

  localStorage.setItem('redes-users', JSON.stringify(unique));
  return unique;
}

function normalizeCurrentUser() {
  const stored = JSON.parse(localStorage.getItem('redes-current-user') || 'null');
  if (!stored) return null;

  if (stored.username === 'admin') {
    const fixed = { ...stored, username: 'jefe', password: 'jefe123', name: 'Jefe de Redes', role: 'admin' };
    localStorage.setItem('redes-current-user', JSON.stringify(fixed));
    return fixed;
  }

  if (stored.username === 'jefe') {
    const fixed = { ...stored, password: 'jefe123', name: 'Jefe de Redes', role: 'admin' };
    localStorage.setItem('redes-current-user', JSON.stringify(fixed));
    return fixed;
  }

  return stored;
}

const users = ensureUsers();
let currentUser = normalizeCurrentUser();

function populateLoginUsers() {
  const select = document.getElementById('login-user');
  if (select && select.tagName === 'SELECT') {
    const safeUsers = ensureUsers();
    select.innerHTML = '<option value="">Seleccionar usuario</option>' +
      safeUsers.map(u => `<option value="${u.username}">${u.name} (${u.username})</option>`).join('');
  }
}

function renderUserList() {
  const list = document.getElementById('user-list');
  if (!list) return;

  const safeUsers = ensureUsers();
  list.innerHTML = safeUsers.map(user => `
    <tr>
      <td>${esc(user.name || user.username)}</td>
      <td>${esc(user.username)}</td>
      <td>${user.role === 'admin' ? 'Jefe de Redes' : 'Técnico'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editUser('${user.username}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.username}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function openUserModal() {
  if (!isAdmin()) {
    alert('Solo el Jefe de Redes puede crear usuarios.');
    return;
  }

  window.editingUserUsername = null;
  document.getElementById('u-name').value = '';
  document.getElementById('u-username').value = '';
  document.getElementById('u-pass').value = '';
  document.getElementById('u-role').value = 'tecnico';
  document.getElementById('user-action-label').textContent = 'Crear usuario';
  renderUserList();
  openModal('modal-user');
}

function editUser(username) {
  const user = ensureUsers().find(u => u.username === username);
  if (!user) return;

  window.editingUserUsername = username;
  document.getElementById('u-name').value = user.name || '';
  document.getElementById('u-username').value = user.username || '';
  document.getElementById('u-pass').value = user.password || '';
  document.getElementById('u-role').value = user.role || 'tecnico';
  document.getElementById('user-action-label').textContent = 'Actualizar usuario';
  openModal('modal-user');
}

function saveUser() {
  if (!isAdmin()) {
    alert('Solo el Jefe de Redes puede crear usuarios.');
    return;
  }

  const name = document.getElementById('u-name').value.trim();
  const username = document.getElementById('u-username').value.trim().toLowerCase();
  const password = document.getElementById('u-pass').value.trim();
  const role = document.getElementById('u-role').value;

  if (!name || !username || !password || !role) {
    alert('Completá nombre, usuario, contraseña y rol.');
    return;
  }

  const existingUsers = ensureUsers();
  const currentEdit = window.editingUserUsername;
  const duplicated = existingUsers.some(u => u.username === username && u.username !== currentEdit);

  if (duplicated) {
    alert('Ese nombre de usuario ya existe. Elegí otro.');
    return;
  }

  const userIndex = existingUsers.findIndex(u => u.username === currentEdit);
  if (userIndex >= 0) {
    existingUsers[userIndex] = { ...existingUsers[userIndex], username, password, name, role };
  } else {
    existingUsers.push({ username, password, name, role });
  }

  users.splice(0, users.length, ...existingUsers);
  localStorage.setItem('redes-users', JSON.stringify(existingUsers));
  populateLoginUsers();
  renderUserList();
  closeModal('modal-user');
  alert(`Usuario ${name} guardado con rol ${role === 'admin' ? 'Jefe de Redes' : 'Técnico'}.`);
}

function deleteUser(username) {
  if (!isAdmin()) {
    alert('Solo el Jefe de Redes puede eliminar usuarios.');
    return;
  }

  if (username === currentUser?.username) {
    alert('No podés eliminar el usuario activo actual.');
    return;
  }

  const safeUsers = ensureUsers();
  const remaining = safeUsers.filter(u => u.username !== username);
  if (remaining.length === 0) {
    alert('Debe existir al menos un usuario en el sistema.');
    return;
  }

  if (!confirm(`¿Eliminar al usuario ${username}?`)) return;

  users.splice(0, users.length, ...remaining);
  localStorage.setItem('redes-users', JSON.stringify(remaining));
  populateLoginUsers();
  renderUserList();
}

function applyTheme() {
  const savedTheme = localStorage.getItem('redes-theme') || 'dark';
  document.body.dataset.theme = savedTheme;

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.textContent = savedTheme === 'light' ? '🌙 Oscuro' : '☀️ Claro';
  }
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme === 'light' ? 'light' : 'dark';
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('redes-theme', nextTheme);
  applyTheme();
}

function setUserSession(user) {
  currentUser = user;
  localStorage.setItem('redes-current-user', JSON.stringify(user));
  const userTag = document.getElementById('topbar-user');
  if (userTag) {
    userTag.textContent = `${user.name} · ${user.role === 'admin' ? 'Administrador' : 'Técnico'}`;
  }

  const configBtn = document.querySelector("button[onclick='openConfig()']");
  if (configBtn) configBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

  const userBtn = document.getElementById('btn-user-admin');
  if (userBtn) userBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

  const obsBtn = document.querySelector("button[onclick='openObsModal()']");
  if (obsBtn) obsBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

  const taskBtn = document.querySelector("button[onclick='openTaskModal()']");
  if (taskBtn) taskBtn.style.display = 'inline-flex';

  const excelBtn = document.getElementById('btn-export-excel');
  if (excelBtn) excelBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

  const pdfBtn = document.getElementById('btn-export-pdf');
  if (pdfBtn) pdfBtn.style.display = isAdmin() ? 'inline-flex' : 'none';

  if (isTecnico()) {
    document.getElementById('badge-obs').textContent = '0';
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('redes-current-user');
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  if (authScreen) authScreen.classList.remove('hidden');
  if (appShell) appShell.classList.add('hidden');
  const pass = document.getElementById('login-pass');
  if (pass) pass.value = '';
}

function loginUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert('Usuario o contraseña incorrectos.');
    return false;
  }
  setUserSession(user);
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  if (authScreen) authScreen.classList.add('hidden');
  if (appShell) appShell.classList.remove('hidden');
  return true;
}

function attachLoginHandler() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userValue = document.getElementById('login-user').value;
    const passValue = document.getElementById('login-pass').value;
    loginUser(userValue, passValue);
  });
}

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
const sectionTitles = {
  resumen: 'Resumen',
  tareas: 'Tablero de Tareas',
  observaciones: 'Observaciones del Jefe de Redes',
  avance: 'Avance General',
};

function go(id, el) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  document.getElementById('sec-' + id).classList.add('on');
  if (el) el.classList.add('on');
  document.getElementById('topbar-title').innerHTML =
    sectionTitles[id] + ' <span>— Proyecto de Redes TSJ La Rioja</span>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'avance') renderAvance();
  if (id === 'resumen') renderResumen();
}

// ═══════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════
function openTaskModal(col) {
  if (!currentUser) return;
  modalDefaultCol = col || 'todo';
  document.getElementById('t-status').value = modalDefaultCol;
  clearForm(['t-title','t-desc','t-area','t-assign','t-due']);
  document.getElementById('t-prio').value = 'media';
  const assignSelect = document.getElementById('t-assign');
  if (isAdmin()) {
    assignSelect.value = 'tecnico';
  } else {
    assignSelect.value = currentUser.username;
  }
  openModal('modal-task');
}

function openObsModal() { clearForm(['o-jefe','o-area','o-text']); openModal('modal-obs'); }

function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; }); }

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if(e.target === o) o.classList.remove('show'); });
});

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
function openConfig() {
  document.getElementById('cfg-name').value   = config.name   || '';
  document.getElementById('cfg-desc').value   = config.desc   || '';
  document.getElementById('cfg-resp').value   = config.resp   || '';
  document.getElementById('cfg-jefe').value   = config.jefe   || '';
  document.getElementById('cfg-inicio').value = config.inicio || '';
  document.getElementById('cfg-fin').value    = config.fin    || '';
  openModal('modal-config');
}

function saveConfig() {
  config.name   = document.getElementById('cfg-name').value.trim();
  config.desc   = document.getElementById('cfg-desc').value.trim();
  config.resp   = document.getElementById('cfg-resp').value.trim();
  config.jefe   = document.getElementById('cfg-jefe').value.trim();
  config.inicio = document.getElementById('cfg-inicio').value;
  config.fin    = document.getElementById('cfg-fin').value;
  localStorage.setItem('redes-config', JSON.stringify(config));
  applyConfig();
  closeModal('modal-config');
}

function applyConfig() {
  if(config.name)   document.getElementById('hero-title').textContent = config.name;
  if(config.desc)   document.getElementById('hero-sub').textContent   = config.desc;
  if(config.resp)   document.getElementById('hero-resp').textContent  = config.resp;
  if(config.jefe)   document.getElementById('hero-jefe').textContent  = config.jefe;
  if(config.inicio) document.getElementById('hero-inicio').textContent = fmtDate(config.inicio);
  if(config.fin)    document.getElementById('hero-fin').textContent    = fmtDate(config.fin);
}

// ═══════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════
function saveTask() {
  if (!currentUser || (!isAdmin() && !isTecnico())) {
    alert('No tenés permisos para crear tareas.');
    return;
  }

  const title  = document.getElementById('t-title').value.trim();
  const area   = document.getElementById('t-area').value;
  if (!title)  { alert('El título es obligatorio.'); return; }
  if (!area)   { alert('Seleccioná un área.'); return; }

  const assignValue = document.getElementById('t-assign').value;
  const ownerUser = assignValue || (currentUser ? currentUser.username : 'jefe');

  const task = {
    id:     Date.now(),
    title,
    desc:   document.getElementById('t-desc').value.trim(),
    area,
    prio:   document.getElementById('t-prio').value,
    status: document.getElementById('t-status').value,
    due:    document.getElementById('t-due').value,
    assign: assignValue === 'tecnico' ? 'Técnico' : assignValue === 'jefe' ? 'Jefe de Redes' : (currentUser ? currentUser.name : 'Sin asignar'),
    ownerUser,
    created: new Date().toISOString().slice(0,10),
  };

  tasks.push(task);
  addTaskHistory('crear_tarea', task, `Tarea creada para ${task.assign || 'Sin asignar'}`);
  persist();
  closeModal('modal-task');
  renderKanban();
  updateBadges();
  renderResumen();
}

function editTask(id) {
  if (!isAdmin()) {
    alert('Solo el Jefe puede editar tareas.');
    return;
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  window.currentEditTaskId = id;
  document.getElementById('edit-title').value = task.title || '';
  document.getElementById('edit-desc').value = task.desc || '';
  document.getElementById('edit-area').value = task.area || '';
  document.getElementById('edit-prio').value = task.prio || 'media';
  document.getElementById('edit-status').value = task.status || 'todo';
  document.getElementById('edit-due').value = task.due || '';
  document.getElementById('edit-assign').value = task.ownerUser || '';

  openModal('modal-edit-task');
}

function saveEditedTask() {
  if (!isAdmin()) {
    alert('Solo el Jefe puede editar tareas.');
    return;
  }

  const id = window.currentEditTaskId;
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const title = document.getElementById('edit-title').value.trim();
  const area = document.getElementById('edit-area').value;
  if (!title) { alert('El título es obligatorio.'); return; }
  if (!area) { alert('Seleccioná un área.'); return; }

  const assignValue = document.getElementById('edit-assign').value;
  const previousStatus = task.status;
  const previousOwner = task.ownerUser;

  task.title = title;
  task.desc = document.getElementById('edit-desc').value.trim();
  task.area = area;
  task.prio = document.getElementById('edit-prio').value;
  task.status = document.getElementById('edit-status').value;
  task.due = document.getElementById('edit-due').value;
  task.ownerUser = assignValue || 'jefe';
  task.assign = assignValue === 'tecnico' ? 'Técnico' : assignValue === 'jefe' ? 'Jefe de Redes' : 'Sin asignar';

  const changeDetails = [];
  if (task.status !== previousStatus) changeDetails.push(`estado: ${statusLabel(task.status)}`);
  if (task.ownerUser !== previousOwner) changeDetails.push(`responsable: ${task.assign}`);
  if (task.prio !== previousStatus && task.prio) changeDetails.push(`prioridad: ${task.prio}`);

  addTaskHistory('editar_tarea', task, changeDetails.length ? changeDetails.join(' · ') : 'Tarea editada');
  persist();
  closeModal('modal-edit-task');
  renderKanban();
  updateBadges();
  renderResumen();
}

function deleteTask(id) {
  if (!isAdmin()) {
    alert('No tenés permisos para eliminar tareas.');
    return;
  }

  if (!confirm('¿Eliminar esta tarea?')) return;
  const task = tasks.find(t => t.id === id);
  if (task) addTaskHistory('eliminar_tarea', task, `Tarea eliminada: ${task.title}`);
  tasks = tasks.filter(t => t.id !== id);
  persist();
  renderKanban();
  updateBadges();
  renderResumen();
}

function persist() {
  localStorage.setItem('redes-tasks', JSON.stringify(tasks));
}

function addTaskHistory(action, task, details = '') {
  if (!task) return;
  const record = {
    id: Date.now(),
    taskId: task.id,
    taskOwner: task.ownerUser || currentUser?.username || 'sin-usuario',
    action,
    details,
    user: currentUser ? currentUser.name : 'Sistema',
    date: new Date().toISOString(),
  };
  taskHistory.unshift(record);
  taskHistory = taskHistory.slice(0, 25);
  localStorage.setItem('redes-task-history', JSON.stringify(taskHistory));
}

function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  const records = isAdmin() ? taskHistory : taskHistory.filter(r => r.taskOwner === currentUser?.username || r.user === currentUser?.name);
  if (!records.length) {
    feed.innerHTML = '<div class="empty"><div class="empty-icon">🧾</div>No hay actividad reciente.</div>';
    return;
  }

  feed.innerHTML = '<div class="activity-list">' + records.slice(0, 6).map(r => `
    <div class="activity-item">
      <div>
        <strong>${esc(r.action || 'Actualización')}</strong>
        <span> · ${esc(r.details || 'Sin detalle')}</span>
      </div>
      <span>${new Date(r.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `).join('') + '</div>';
}

function getDueAlerts() {
  const base = isAdmin() ? tasks : getVisibleTasks();
  const now = new Date();
  return base
    .filter(t => t.due)
    .map(t => {
      const end = new Date(`${t.due}T23:59:59`);
      const diffDays = Math.ceil((end - now) / 86400000);
      return { ...t, diffDays };
    })
    .filter(t => t.diffDays <= 3)
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

function renderDueAlerts() {
  const host = document.getElementById('due-alerts');
  if (!host) return;

  const alerts = getDueAlerts();
  if (!alerts.length) {
    host.innerHTML = '<div class="empty"><div class="empty-icon">✅</div>No hay tareas próximas a vencer.</div>';
    return;
  }

  host.innerHTML = '<div class="alert-list">' + alerts.slice(0, 4).map(t => {
    const status = t.diffDays < 0 ? 'critical' : t.diffDays <= 1 ? 'warn' : 'good';
    const text = t.diffDays < 0 ? `Venció hace ${Math.abs(t.diffDays)} días` : t.diffDays === 0 ? 'Vence hoy' : `Vence en ${t.diffDays} días`;
    return `
      <div class="alert-item ${status}">
        <div>
          <strong>${esc(t.title)}</strong>
          <span> · ${esc(t.area || 'Sin área')} · ${esc(t.assign || 'Sin asignar')}</span>
        </div>
        <span>${text}</span>
      </div>`;
  }).join('') + '</div>';
}

function populateTaskFilters() {
  const areaSel = document.getElementById('task-filter-area');
  const ownerSel = document.getElementById('task-filter-owner');
  if (!areaSel || !ownerSel) return;

  const areas = [...new Set(tasks.map(t => t.area).filter(Boolean))].sort();
  areaSel.innerHTML = '<option value="all">Todas las áreas</option>' + areas.map(area => `<option value="${esc(area)}">${esc(area)}</option>`).join('');
  areaSel.value = taskFilters.area;

  const ownerNames = [...new Set(tasks.map(t => t.ownerUser).filter(Boolean))].sort();
  const ownerOptions = ownerNames.map(owner => `<option value="${owner}">${owner}</option>`).join('');
  ownerSel.innerHTML = '<option value="all">Todos los responsables</option>' + ownerOptions;
  ownerSel.value = taskFilters.owner;
}

function getFilteredTasks() {
  const base = getVisibleTasks();
  const filters = taskFilters || { status: 'all', priority: 'all', area: 'all', owner: 'all' };

  return base.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.prio !== filters.priority) return false;
    if (filters.area !== 'all' && (task.area || '') !== filters.area) return false;
    if (filters.owner !== 'all' && (task.ownerUser || '') !== filters.owner) return false;
    return true;
  });
}

function applyTaskFilters() {
  const statusEl = document.getElementById('task-filter-status');
  const priorityEl = document.getElementById('task-filter-priority');
  const areaEl = document.getElementById('task-filter-area');
  const ownerEl = document.getElementById('task-filter-owner');

  taskFilters = {
    status: statusEl ? statusEl.value : 'all',
    priority: priorityEl ? priorityEl.value : 'all',
    area: areaEl ? areaEl.value : 'all',
    owner: ownerEl ? ownerEl.value : 'all',
  };

  renderKanban();
  renderResumen();
}

function resetTaskFilters() {
  taskFilters = { status: 'all', priority: 'all', area: 'all', owner: 'all' };
  const statusEl = document.getElementById('task-filter-status');
  const priorityEl = document.getElementById('task-filter-priority');
  const areaEl = document.getElementById('task-filter-area');
  const ownerEl = document.getElementById('task-filter-owner');
  if (statusEl) statusEl.value = 'all';
  if (priorityEl) priorityEl.value = 'all';
  if (areaEl) areaEl.value = 'all';
  if (ownerEl) ownerEl.value = 'all';
  renderKanban();
  renderResumen();
}

// ═══════════════════════════════════════════════════════
// KANBAN RENDER
// ═══════════════════════════════════════════════════════════════
const colIds = ['todo','prog','obs','done'];

function getVisibleTasks() {
  if (!currentUser) return tasks;
  if (isAdmin()) return tasks;
  if (isTecnico()) {
    return tasks.filter(t => (t.ownerUser || '').toLowerCase() === currentUser.username.toLowerCase());
  }
  return [];
}

function renderKanban() {
  const visibleTasks = getFilteredTasks();

  colIds.forEach(col => {
    const body = document.getElementById('col-' + col);
    if (!body) return;
    const btn  = body.querySelector('.k-add-btn');
    Array.from(body.querySelectorAll('.t-card')).forEach(el => el.remove());

    const colTasks = visibleTasks.filter(t => t.status === col);
    const counter = document.getElementById('cnt-' + col);
    if (counter) counter.textContent = colTasks.length;

    colTasks.forEach(t => {
      const card = buildCard(t);
      body.insertBefore(card, btn);
    });
  });

  if (isTecnico()) {
    const badge = document.getElementById('badge-tareas');
    if (badge) badge.textContent = getVisibleTasks().filter(t => t.status !== 'done').length;
  }

  populateTaskFilters();
}

function buildCard(t) {
  const el = document.createElement('div');
  el.className = 't-card';
  el.dataset.id = t.id;
  el.draggable = true;
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend',   onDragEnd);

  const dueLabel = t.due ? dueDateClass(t.due) : '';

  el.innerHTML = `
    <div class="t-card-top">
      <div class="t-card-title">${esc(t.title)}</div>
      ${isAdmin() ? `<button class="t-card-del" onclick="deleteTask(${t.id})">✕</button>` : ''}
    </div>
    ${isAdmin() ? `<div class="t-card-edit" style="margin-bottom:8px;"><button class="btn btn-ghost btn-sm" onclick="editTask(${t.id})">Editar</button></div>` : ''}
    ${t.desc ? `<div class="t-card-desc">${esc(t.desc)}</div>` : ''}
    <div class="t-card-meta">
      ${areaChip(t.area)}
      ${prioChip(t.prio)}
    </div>
    <div class="t-card-foot">
      <span class="t-card-date ${dueLabel.cls}">${t.due ? '📅 ' + fmtDate(t.due) : ''}</span>
      <span class="t-card-assign">${t.assign ? '👤 ' + esc(t.assign) : ''}</span>
    </div>`;

  return el;
}

// ═══════════════════════════════════════════════════════
// DRAG & DROP
// ═══════════════════════════════════════════════════════
function onDragStart(e) {
  dragId = parseInt(this.dataset.id);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.k-col-body').forEach(c => c.classList.remove('drag-over'));
}
function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
  e.dataTransfer.dropEffect = 'move';
}
function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function onDrop(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!dragId) return;
  const t = tasks.find(t => t.id === dragId);
  if (t) {
    const previousStatus = t.status;
    t.status = col;
    if (col === 'done' && !t.completedAt) t.completedAt = new Date().toISOString().slice(0,10);
    if (previousStatus !== col) addTaskHistory('cambiar_estado', t, `Estado actualizado: ${statusLabel(previousStatus)} → ${statusLabel(col)}`);
    persist();
    renderKanban();
    updateBadges();
    renderResumen();
    if (col === 'done') confetti();
  }
  dragId = null;
}

// ═══════════════════════════════════════════════════════
// OBSERVATIONS
// ═══════════════════════════════════════════════════════
function saveObs() {
  if (!isAdmin()) {
    alert('Solo el Jefe puede crear observaciones.');
    return;
  }

  const jefe = document.getElementById('o-jefe').value.trim();
  const text = document.getElementById('o-text').value.trim();
  if (!jefe) { alert('Ingresá el nombre del jefe.'); return; }
  if (!text) { alert('Ingresá el texto de la observación.'); return; }

  const obs = {
    id:     Date.now(),
    jefe,
    area:   document.getElementById('o-area').value.trim(),
    tipo:   document.getElementById('o-tipo').value,
    estado: document.getElementById('o-estado').value,
    text,
    fecha:  new Date().toISOString().slice(0,10),
  };

  observations.push(obs);
  localStorage.setItem('redes-obs', JSON.stringify(observations));
  closeModal('modal-obs');
  renderObs();
  updateBadges();
  renderResumen();
}

function deleteObs(id) {
  if (!confirm('¿Eliminar esta observación?')) return;
  observations = observations.filter(o => o.id !== id);
  localStorage.setItem('redes-obs', JSON.stringify(observations));
  renderObs();
  updateBadges();
  renderResumen();
}

function changeObsEstado(id, val) {
  const o = observations.find(o => o.id === id);
  if (o) { o.estado = val; localStorage.setItem('redes-obs', JSON.stringify(observations)); renderObs(); updateBadges(); renderResumen(); }
}

function renderObs() {
  const pend = observations.filter(o => o.estado === 'pendiente').length;
  const proc = observations.filter(o => o.estado === 'proceso').length;
  const res  = observations.filter(o => o.estado === 'resuelta').length;
  const tot  = observations.length;

  document.getElementById('obs-cnt-pend').textContent = pend;
  document.getElementById('obs-cnt-prog').textContent = proc;
  document.getElementById('obs-cnt-res').textContent  = res;
  document.getElementById('obs-cnt-tot').textContent  = tot;

  const list = document.getElementById('obs-list-full');
  if (observations.length === 0) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">💬</div>No hay observaciones registradas todavía.</div>';
    return;
  }

  list.innerHTML = [...observations].reverse().map(o => `
    <div class="obs-item ${o.tipo === 'critica' ? 'critica' : o.estado === 'resuelta' ? 'resuelta' : ''}">
      <div class="obs-meta">
        <span class="obs-jefe">👤 ${esc(o.jefe)}</span>
        <span class="obs-fecha">${o.fecha}</span>
        ${o.area ? `<span class="chip chip-net">${esc(o.area)}</span>` : ''}
        ${o.tipo === 'critica' ? '<span class="chip chip-obs">Crítica</span>' : ''}
        <span class="${obsEstadoChipClass(o.estado)}">${obsEstadoLabel(o.estado)}</span>
      </div>
      <div class="obs-text">${esc(o.text)}</div>
      <div class="obs-actions">
        <select class="input" style="width:auto;padding:4px 8px;font-size:12px;" onchange="changeObsEstado(${o.id}, this.value)">
          <option value="pendiente" ${o.estado==='pendiente'?'selected':''}>Pendiente</option>
          <option value="proceso"   ${o.estado==='proceso'?'selected':''}>En proceso</option>
          <option value="resuelta"  ${o.estado==='resuelta'?'selected':''}>Resuelta</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="deleteObs(${o.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function obsEstadoChipClass(e) {
  return { pendiente:'chip chip-obs', proceso:'chip chip-block', resuelta:'chip chip-done' }[e] || 'chip chip-todo';
}
function obsEstadoLabel(e) {
  return { pendiente:'Pendiente', proceso:'En proceso', resuelta:'Resuelta' }[e] || e;
}

// ═══════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════
function renderResumen() {
  const visibleTasks = getVisibleTasks();

  document.getElementById('r-todo').textContent = visibleTasks.filter(t=>t.status==='todo').length;
  document.getElementById('r-prog').textContent = visibleTasks.filter(t=>t.status==='prog').length;
  document.getElementById('r-obs').textContent  = visibleTasks.filter(t=>t.status==='obs').length;
  document.getElementById('r-done').textContent = visibleTasks.filter(t=>t.status==='done').length;

  const active = visibleTasks.filter(t => t.status !== 'done');
  const tbody = document.getElementById('resumen-tbody');
  if (active.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay tareas activas asignadas.</td></tr>';
  } else {
    tbody.innerHTML = active.slice(0,8).map(t => `
      <tr>
        <td style="font-weight:500;max-width:220px">${esc(t.title)}</td>
        <td>${areaChip(t.area)}</td>
        <td>${prioChip(t.prio)}</td>
        <td>${statusChip(t.status)}</td>
        <td class="td-mo" style="${t.due ? dueDateStyle(t.due) : 'color:var(--dim)'}">${t.due ? fmtDate(t.due) : '—'}</td>
        <td class="td-m">${t.assign ? esc(t.assign) : '—'}</td>
      </tr>`).join('');
  }

  renderDueAlerts();
  renderActivityFeed();

  const obsEl = document.getElementById('resumen-obs-list');
  if (isTecnico()) {
    obsEl.innerHTML = '<div class="empty"><div class="empty-icon">🔒</div>Tu perfil solo puede ver tareas asignadas.</div>';
    return;
  }

  const recent = [...observations].reverse().slice(0,3);
  if (recent.length === 0) {
    obsEl.innerHTML = '<div class="empty"><div class="empty-icon">💬</div>Sin observaciones registradas.</div>';
  } else {
    obsEl.innerHTML = recent.map(o => `
      <div class="obs-item ${o.tipo==='critica'?'critica':o.estado==='resuelta'?'resuelta':''}" style="margin-bottom:10px">
        <div class="obs-meta">
          <span class="obs-jefe">👤 ${esc(o.jefe)}</span>
          <span class="obs-fecha">${o.fecha}</span>
          ${o.area?`<span class="chip chip-net">${esc(o.area)}</span>`:''}
          <span class="${obsEstadoChipClass(o.estado)}">${obsEstadoLabel(o.estado)}</span>
        </div>
        <div class="obs-text">${esc(o.text)}</div>
      </div>`).join('');
  }
}

// ═══════════════════════════════════════════════════════
// AVANCE
// ═══════════════════════════════════════════════════════
function renderAvance() {
  const total = tasks.length;
  const done  = tasks.filter(t=>t.status==='done').length;
  const prog  = tasks.filter(t=>t.status==='prog').length;
  const obs   = tasks.filter(t=>t.status==='obs').length;
  const pend  = tasks.filter(t=>t.status==='todo').length;
  const pct   = total > 0 ? Math.round((done/total)*100) : 0;

  document.getElementById('av-pct-big').textContent  = pct + '%';
  document.getElementById('av-done').textContent     = done;
  document.getElementById('av-prog').textContent     = prog;
  document.getElementById('av-obs').textContent      = obs;
  document.getElementById('av-big-pct').textContent  = pct + '%';
  document.getElementById('av-big-bar').style.width  = pct + '%';
  document.getElementById('av-big-bar').style.background =
    pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--accent)' : 'var(--warn)';
  document.getElementById('av-total').textContent    = total;
  document.getElementById('av-done2').textContent    = done;
  document.getElementById('av-pend').textContent     = pend;
  document.getElementById('av-obs2').textContent     = obs;

  const areas = {};
  tasks.forEach(t => {
    if(!areas[t.area]) areas[t.area] = {total:0,done:0};
    areas[t.area].total++;
    if(t.status==='done') areas[t.area].done++;
  });

  const areaEl = document.getElementById('av-by-area');
  if (Object.keys(areas).length === 0) {
    areaEl.innerHTML = '<div class="empty">Sin tareas registradas por área.</div>';
  } else {
    areaEl.innerHTML = Object.entries(areas).map(([area,d]) => {
      const p = Math.round((d.done/d.total)*100);
      const color = p>=100?'var(--green)':p>=50?'var(--accent)':'var(--warn)';
      return `
        <div class="av-card" style="padding:14px 18px;margin-bottom:10px">
          <div class="av-head">
            <div class="av-name">${esc(area)}</div>
            <div class="av-pct" style="font-size:16px;color:${color}">${p}%</div>
          </div>
          <div class="av-bar" style="height:6px">
            <div class="av-fill" style="width:${p}%;background:${color}"></div>
          </div>
          <div class="av-meta">
            <div class="av-meta-item"><strong>Total</strong>${d.total}</div>
            <div class="av-meta-item"><strong>Completadas</strong>${d.done}</div>
            <div class="av-meta-item"><strong>Pendientes</strong>${d.total-d.done}</div>
          </div>
        </div>`;
    }).join('');
  }

  const doneT = tasks.filter(t=>t.status==='done');
  const doneEl = document.getElementById('av-done-list');
  if(doneT.length===0){
    doneEl.innerHTML='<tr><td colspan="5" class="empty">Sin tareas completadas aún.</td></tr>';
  } else {
    doneEl.innerHTML = [...doneT].reverse().map(t=>`
      <tr>
        <td style="font-weight:500">${esc(t.title)}</td>
        <td>${areaChip(t.area)}</td>
        <td>${prioChip(t.prio)}</td>
        <td class="td-mo">${t.completedAt || t.created}</td>
        <td class="td-m">${t.assign?esc(t.assign):'—'}</td>
      </tr>`).join('');
  }
}

// ═══════════════════════════════════════════════════════
// BADGES & SIDEBAR PROGRESS
// ═══════════════════════════════════════════════════════
function updateBadges() {
  const visibleTasks = getVisibleTasks();
  const active = visibleTasks.filter(t=>t.status!=='done').length;
  const pendObs = isAdmin() ? observations.filter(o=>o.estado==='pendiente').length : 0;
  const total = visibleTasks.length;
  const done  = visibleTasks.filter(t=>t.status==='done').length;
  const pct   = total > 0 ? Math.round((done/total)*100) : 0;

  document.getElementById('badge-tareas').textContent = active;
  document.getElementById('badge-obs').textContent    = pendObs;
  document.getElementById('sb-pct').textContent       = pct + '%';
  document.getElementById('sb-prog').style.width      = pct + '%';
  document.getElementById('av-big-pct') && (document.getElementById('av-big-pct').textContent = pct+'%');
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  if (!d) return '—';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function dueDateClass(due) {
  if (!due) return {cls:''};
  const diff = (new Date(due) - new Date()) / 86400000;
  if (diff < 0)  return {cls:'vence-red'};
  if (diff <= 3) return {cls:'vence-warn'};
  return {cls:''};
}

function dueDateStyle(due) {
  const d = dueDateClass(due);
  if (d.cls==='vence-red')  return 'color:var(--red)';
  if (d.cls==='vence-warn') return 'color:var(--warn)';
  return '';
}

function prioChip(p) {
  const map = { alta:'chip-prio-a', media:'chip-prio-m', baja:'chip-prio-b' };
  const lab = { alta:'Alta', media:'Media', baja:'Baja' };
  return `<span class="chip ${map[p]||'chip-todo'}">${lab[p]||p}</span>`;
}

function areaChip(a) {
  const net = ['Infraestructura LAN','Infraestructura WAN','Conectividad WiFi'];
  const sec = ['Seguridad de Red'];
  if (net.includes(a)) return `<span class="chip chip-net">${esc(a)}</span>`;
  if (sec.includes(a)) return `<span class="chip chip-sec">${esc(a)}</span>`;
  return `<span class="chip chip-todo">${esc(a)}</span>`;
}

function statusChip(s) {
  const map = {
    todo: ['chip-todo','Pendiente'],
    prog: ['chip-prog','En Progreso'],
    obs:  ['chip-obs','Observada'],
    done: ['chip-done','Completada'],
  };
  const [cls,lab] = map[s] || ['chip-todo', s];
  return `<span class="chip ${cls}">${lab}</span>`;
}

function statusLabel(s) {
  return {
    todo: 'Pendiente',
    prog: 'En Progreso',
    obs: 'Observada',
    done: 'Completada'
  }[s] || 'Sin estado';
}

function confetti() {
  for(let i=0;i<18;i++){
    const d=document.createElement('div');
    const colors=['#5B8DEF','#22C55E','#F59E0B','#A78BFA','#38BDF8'];
    Object.assign(d.style,{
      position:'fixed',left:Math.random()*100+'vw',top:'-10px',
      width:'8px',height:'8px',borderRadius:'50%',
      background:colors[Math.floor(Math.random()*colors.length)],
      zIndex:9999, pointerEvents:'none',
      animation:`cf ${1+Math.random()*2}s ease-in forwards`,
      animationDelay:Math.random()*0.4+'s',
    });
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),3000);
  }
}

function exportToExcel() {
  const rows = getVisibleTasks();
  if (!rows || rows.length === 0) {
    alert('No hay tareas para exportar.');
    return;
  }

  const data = rows.map(t => ({
    ID: t.id,
    'Título': t.title,
    'Área / Categoría': t.area,
    'Prioridad': t.prio ? t.prio.toUpperCase() : 'MEDIA',
    'Estado': t.status === 'todo' ? 'Pendiente' :
      t.status === 'prog' ? 'En Progreso' :
      t.status === 'obs' ? 'Observada' : 'Completada',
    'Vencimiento': t.due ? fmtDate(t.due) : 'Sin fecha',
    'Asignado a': t.assign || 'Sin asignar',
    'Fecha de Creación': t.created || '—',
    'Fecha de Finalización': t.completedAt || '—',
    'Descripción': t.desc || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Tareas');

  const fileName = `Reporte_Redes_TSJ_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

function exportToPDF() {
  const rows = getVisibleTasks();
  if (!rows || rows.length === 0) {
    alert('No hay tareas para generar el PDF.');
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('La librería de PDF no está disponible en este momento.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(config.name || 'Reporte de Estado — Proyecto de Redes TSJ', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} | Generado por: ${currentUser ? currentUser.name : 'Sistema'}`, 14, 25);

  const total = rows.length;
  const completadas = rows.filter(t => t.status === 'done').length;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  doc.text(`Avance General: ${pct}% | Total Tareas: ${total} | Completadas: ${completadas}`, 14, 32);

  const tableRows = rows.map(t => [
    t.title,
    t.area,
    t.prio ? t.prio.toUpperCase() : 'MEDIA',
    t.status === 'todo' ? 'Pendiente' : t.status === 'prog' ? 'En Progreso' : t.status === 'obs' ? 'Observada' : 'Completada',
    t.due ? fmtDate(t.due) : '—',
    t.assign || '—'
  ]);

  doc.autoTable({
    startY: 38,
    head: [['Tarea', 'Área', 'Prioridad', 'Estado', 'Vencimiento', 'Asignado']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [37, 41, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });

  const fileName = `Reporte_Estado_Redes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
function initApp() {
  applyTheme();
  populateLoginUsers();
  attachLoginHandler();

  if (currentUser) {
    setUserSession(currentUser);
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
  } else {
    logoutUser();
  }

  applyConfig();
  populateTaskFilters();
  renderKanban();
  renderObs();
  renderResumen();
  updateBadges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
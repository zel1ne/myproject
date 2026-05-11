// ============================================================
// APP.JS — главный контроллер
// ============================================================

const NAV = {
    admin: [
        { id: 'home', label: 'Главная', icon: 'home' },
        { id: 'grades', label: 'Журнал оценок', icon: 'file-text' },
        { id: 'attendance', label: 'Посещаемость', icon: 'calendar-check' },
        { id: 'students', label: 'Студенты', icon: 'users' },
        { id: 'teachers', label: 'Преподаватели', icon: 'user-check' },
        { id: 'groups', label: 'Группы', icon: 'layers' },
        { id: 'subjects', label: 'Дисциплины', icon: 'book-open' },
        { id: 'workload', label: 'Нагрузка', icon: 'upload' },
        { id: 'reports', label: 'Отчёты', icon: 'bar-chart-2' },
    ],
    teacher: [
        { id: 'home', label: 'Главная', icon: 'home' },
        { id: 'grades', label: 'Журнал оценок', icon: 'file-text' },
        { id: 'attendance', label: 'Посещаемость', icon: 'calendar-check' },
        { id: 'reports', label: 'Отчёты', icon: 'bar-chart-2' },
    ],
    student: [
        { id: 'home', label: 'Главная', icon: 'home' },
        { id: 'grades', label: 'Успеваемость', icon: 'file-text' },
    ],
};

const ROLES_RU = { admin: 'Администратор', teacher: 'Преподаватель', student: 'Студент' };

let currentPage = '';

function initApp() {
    document.getElementById('page-login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Данные пользователя в navbar
    document.getElementById('nav-avatar').textContent = currentUser.avatar;
    document.getElementById('nav-name').textContent = currentUser.fullName.split(' ').slice(0, 2).join(' ');

    buildNavbar();
    navigateTo('home');
}

function buildNavbar() {
    const items = NAV[currentUser.role] || [];
    const html = items.map(item => `
    <div class="nav-link" id="nav-${item.id}" onclick="navigateTo('${item.id}')">
      <i data-lucide="${item.icon}"></i>
      <span>${item.label}</span>
    </div>`).join('');
    document.getElementById('navbar-links').innerHTML = html;
    document.getElementById('mobile-nav').innerHTML = html;
    lucide.createIcons();
}

function navigateTo(page) {
    currentPage = page;

    // Подсветить активный пункт
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`#nav-${page}`).forEach(el => el.classList.add('active'));

    // Закрыть мобильное меню
    document.getElementById('mobile-nav').classList.add('hidden');

    const pages = {
        home: { render: renderHome, after: initHomeCharts },
        grades: { render: renderGrades, after: null },
        attendance: { render: renderAttendance, after: null },
        students: { render: renderStudents, after: () => filterStudents() },
        teachers: { render: renderTeachers, after: null },
        groups: { render: renderGroups, after: null },
        subjects: { render: renderSubjects, after: null },
        workload: { render: renderWorkload, after: null },
        profile: { render: renderProfile, after: initProfileChart },
        reports: { render: renderReports, after: initReportsChart },
        dashboard: { render: renderDashboard, after: initDashboardCharts },
    };

    const cfg = pages[page];
    if (!cfg) return;

    const content = document.getElementById('main-content');
    content.innerHTML = cfg.render();
    lucide.createIcons();

    if (cfg.after) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            try { cfg.after(); } catch (e) { console.warn(e); }
        }));
    }
}

function initHomeCharts() {
    if (currentUser.role === 'admin') initHomeAdminCharts();
    if (currentUser.role === 'student') initHomeStudentChart();
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('hidden');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

// Click outside modal to close
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
});

function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('vtopit-theme', 'light');
    } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('vtopit-theme', 'dark');
    }
}

function initTheme() {
    const saved = localStorage.getItem('vtopit-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Восстановление сессии
    const savedSession = localStorage.getItem('vtopit-session');
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        initApp();
    }

    lucide.createIcons();
});

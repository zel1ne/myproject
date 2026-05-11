// ============================================================
// AUTH MODULE
// ============================================================
let currentUser = null;

function login(email, password) {
    const user = DB.users.find(u => u.email === email && u.password === password);
    if (!user) return false;
    currentUser = user;
    localStorage.setItem('vtopit-session', JSON.stringify(currentUser));
    initApp();
    return true;
}



function logout() {
    currentUser = null;
    localStorage.removeItem('vtopit-session');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('page-login').classList.remove('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
}

function hasRole(...roles) {
    return currentUser && roles.includes(currentUser.role);
}

document.getElementById('btn-login').addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');
    if (!login(email, password)) {
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 3000);
    }
});

document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
});

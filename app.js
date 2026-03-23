const SUPABASE_URL = "https://sbzjnuluhxvqbadskvll.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiempudWx1aHh2cWJhZHNrdmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzk5NTQsImV4cCI6MjA4OTg1NTk1NH0.Ckm8QyN89y3oy6Jh7kyCFQzZ4-Qc5MkMKfcxG7C1caE";
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const API = `${SUPABASE_URL}/rest/v1/todos`;

let accessToken = null;
let currentUser = null;
let todos = [];

// DOM
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const tabs = document.querySelectorAll(".tab");

// Tabs
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        loginForm.classList.toggle("hidden", target !== "login");
        registerForm.classList.toggle("hidden", target !== "register");
        authMessage.textContent = "";
        authMessage.className = "message";
    });
});

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
}

function apiHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
}

// Auth
async function register(email, password) {
    const res = await fetch(`${AUTH_URL}/signup`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        if (data.identities && data.identities.length === 0) {
            showMessage("Bu e-posta zaten kayitli.", "error");
        } else if (data.access_token) {
            setSession(data);
        } else {
            showMessage("Kayit basarili! Onay maili gonderildi. Lutfen e-postanizi kontrol edin.", "success");
        }
    } else {
        showMessage(data.error_description || data.msg || "Kayit hatasi.", "error");
    }
}

async function login(email, password) {
    const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        setSession(data);
    } else {
        if (data.error_description && data.error_description.includes("not confirmed")) {
            showMessage("E-posta adresiniz henuz onaylanmadi. Lutfen mailinizi kontrol edin.", "error");
        } else {
            showMessage(data.error_description || "Giris hatasi.", "error");
        }
    }
}

function setSession(data) {
    accessToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem("supabase_session", JSON.stringify(data));
    showApp();
}

function logout() {
    accessToken = null;
    currentUser = null;
    localStorage.removeItem("supabase_session");
    todos = [];
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    authMessage.textContent = "";
    authMessage.className = "message";
}

function showApp() {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    userEmail.textContent = currentUser.email;
    fetchTodos();
}

// Check URL for email confirmation redirect
function handleAuthRedirect() {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        if (token) {
            // Fetch user with the token
            fetch(`${AUTH_URL}/user`, {
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
            })
            .then(r => r.json())
            .then(user => {
                setSession({ access_token: token, user });
                window.history.replaceState(null, "", window.location.pathname);
            });
            return true;
        }
    }
    return false;
}

// Restore session
function restoreSession() {
    if (handleAuthRedirect()) return;
    const saved = localStorage.getItem("supabase_session");
    if (saved) {
        const data = JSON.parse(saved);
        accessToken = data.access_token;
        currentUser = data.user;
        showApp();
    }
}

// Todos
async function fetchTodos() {
    const res = await fetch(`${API}?select=*&order=created_at.asc`, { headers: apiHeaders() });
    if (res.ok) {
        todos = await res.json();
        render();
    }
}

async function addTodo(text) {
    const res = await fetch(API, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ text, done: false, user_id: currentUser.id })
    });
    if (res.ok) {
        const [todo] = await res.json();
        todos.push(todo);
        render();
    }
}

async function toggleTodo(id, done) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ done })
    });
    todos = todos.map(t => t.id === id ? { ...t, done } : t);
    render();
}

async function deleteTodo(id) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "DELETE",
        headers: apiHeaders()
    });
    todos = todos.filter(t => t.id !== id);
    render();
}

function render() {
    todoList.innerHTML = "";
    todos.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-item" + (todo.done ? " done" : "");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = todo.done;
        cb.addEventListener("change", () => toggleTodo(todo.id, cb.checked));

        const span = document.createElement("span");
        span.className = "todo-text";
        span.textContent = todo.text;
        span.addEventListener("click", () => toggleTodo(todo.id, !todo.done));

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "\u00d7";
        del.addEventListener("click", () => deleteTodo(todo.id));

        li.append(cb, span, del);
        todoList.appendChild(li);
    });
}

// Events
registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    register(email, password);
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    login(email, password);
});

logoutBtn.addEventListener("click", logout);

todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    todoInput.value = "";
    addTodo(text);
});

restoreSession();

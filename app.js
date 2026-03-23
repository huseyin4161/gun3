const SUPABASE_URL = "https://sbzjnuluhxvqbadskvll.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiempudWx1aHh2cWJhZHNrdmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzk5NTQsImV4cCI6MjA4OTg1NTk1NH0.Ckm8QyN89y3oy6Jh7kyCFQzZ4-Qc5MkMKfcxG7C1caE";
const API = `${SUPABASE_URL}/rest/v1/todos`;
const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = [];

async function fetchTodos() {
    const res = await fetch(`${API}?select=*&order=created_at.asc`, { headers });
    todos = await res.json();
    render();
}

async function addTodo(text) {
    const res = await fetch(API, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, done: false })
    });
    const [todo] = await res.json();
    todos.push(todo);
    render();
}

async function toggleTodo(id, done) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ done })
    });
    todos = todos.map(t => t.id === id ? { ...t, done } : t);
    render();
}

async function deleteTodo(id) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "DELETE",
        headers
    });
    todos = todos.filter(t => t.id !== id);
    render();
}

function render() {
    list.innerHTML = "";
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
        list.appendChild(li);
    });
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addTodo(text);
});

fetchTodos();

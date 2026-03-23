const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function save() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        li.className = "todo-item" + (todo.done ? " done" : "");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = todo.done;
        cb.addEventListener("change", () => {
            todos[i].done = cb.checked;
            save();
            render();
        });

        const span = document.createElement("span");
        span.className = "todo-text";
        span.textContent = todo.text;
        span.addEventListener("click", () => {
            todos[i].done = !todos[i].done;
            save();
            render();
        });

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "\u00d7";
        del.addEventListener("click", () => {
            todos.splice(i, 1);
            save();
            render();
        });

        li.append(cb, span, del);
        list.appendChild(li);
    });
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    save();
    render();
    input.value = "";
});

render();

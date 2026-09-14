(function () {
  const STORAGE_KEY = "ledger.tasks.v1";
  const THEME_KEY = "ledger.theme.v1";
  let tasks = [];
  let editingId = null;
  let filterStatus = "all";
  let filterCategory = "all";
  let searchTerm = "";
  let sortMode = "created";

  function uid() {
    return (
      "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    );
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme =
      saved ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    document.body.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
  function updateThemeIcon(theme) {
    const icon = document.getElementById("themeIcon");
    if (theme === "dark") {
      icon.innerHTML =
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
      icon.innerHTML =
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
    }
  }
  document.getElementById("themeToggle").addEventListener("click", function () {
    const cur = document.body.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
  });

  function setTodayLabel() {
    const d = new Date();
    const opts = { weekday: "long", month: "long", day: "numeric" };
    document.getElementById("todayLabel").textContent = d.toLocaleDateString(
      undefined,
      opts,
    );
  }

  function todayISO() {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function isOverdue(t) {
    if (!t.dueDate || t.completed) return false;
    return t.dueDate < todayISO();
  }

  function fmtDue(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    const d = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
    );
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

  function getFiltered() {
    let list = tasks.slice();
    if (filterStatus === "pending") list = list.filter((t) => !t.completed);
    if (filterStatus === "completed") list = list.filter((t) => t.completed);
    if (filterCategory !== "all")
      list = list.filter((t) => t.category === filterCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (sortMode === "created") {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortMode === "due") {
      list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sortMode === "priority") {
      list.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
      );
    } else if (sortMode === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }

  function svgCheck() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  }
  function svgEdit() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  }
  function svgTrash() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>';
  }
  function svgCal() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  }
  function svgEmpty() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const list = getFiltered();
    const container = document.getElementById("taskList");
    if (list.length === 0) {
      let heading = "Nothing here yet";
      let sub = "Add your first task above to start your list.";
      if (tasks.length > 0) {
        heading = "No tasks match";
        sub = "Try a different search or filter.";
      }
      container.innerHTML =
        '<div class="empty">' +
        svgEmpty() +
        "<h3>" +
        heading +
        "</h3><p>" +
        sub +
        "</p></div>";
    } else {
      container.innerHTML = list
        .map(function (t) {
          const late = isOverdue(t);
          const dueBadge = t.dueDate
            ? '<span class="badge due' +
              (late ? " late" : "") +
              '">' +
              svgCal() +
              (late ? "Overdue · " : "") +
              fmtDue(t.dueDate) +
              "</span>"
            : "";
          return (
            "" +
            '<div class="task' +
            (t.completed ? " done" : "") +
            '" data-id="' +
            t.id +
            '">' +
            '<button class="check' +
            (t.completed ? " checked" : "") +
            '" data-action="toggle" aria-label="Mark task complete">' +
            svgCheck() +
            "</button>" +
            '<div class="task-body">' +
            '<div class="task-title">' +
            escapeHtml(t.title) +
            "</div>" +
            '<div class="task-meta">' +
            '<span class="badge cat">' +
            escapeHtml(t.category) +
            "</span>" +
            '<span class="badge prio-' +
            t.priority +
            '">' +
            t.priority.charAt(0).toUpperCase() +
            t.priority.slice(1) +
            "</span>" +
            dueBadge +
            "</div>" +
            "</div>" +
            '<div class="task-actions">' +
            '<button data-action="edit" aria-label="Edit task">' +
            svgEdit() +
            "</button>" +
            '<button data-action="delete" class="del" aria-label="Delete task">' +
            svgTrash() +
            "</button>" +
            "</div>" +
            "</div>"
          );
        })
        .join("");
    }
    renderStats();
  }

  function renderStats() {
    const done = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    document.getElementById("doneCount").textContent = done;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("overdueCount").textContent = overdue;
    const total = tasks.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const circumference = 138.2;
    const offset = circumference - (pct / 100) * circumference;
    document.getElementById("progressRing").style.strokeDashoffset = offset;
    document.getElementById("progressText").textContent = pct + "%";
  }

  function showError() {
    const el = document.getElementById("errorMsg");
    el.classList.add("show");
    setTimeout(function () {
      el.classList.remove("show");
    }, 2500);
  }

  function addTask() {
    const input = document.getElementById("taskInput");
    const title = input.value.trim();
    if (!title) {
      showError();
      input.focus();
      return;
    }
    if (title.length > 200) {
      return;
    }
    const category = document.getElementById("categorySelect").value;
    const priority = document.getElementById("prioritySelect").value;
    const dueDate = document.getElementById("dueDateInput").value || null;
    tasks.unshift({
      id: uid(),
      title: title,
      category: category,
      priority: priority,
      dueDate: dueDate,
      completed: false,
      createdAt: Date.now(),
    });
    save();
    input.value = "";
    document.getElementById("dueDateInput").value = "";
    render();
  }

  document.getElementById("addBtn").addEventListener("click", addTask);
  document
    .getElementById("taskInput")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") addTask();
    });

  document.getElementById("taskList").addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const taskEl = e.target.closest(".task");
    const id = taskEl.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (action === "toggle") {
      const t = tasks.find((x) => x.id === id);
      if (t) {
        t.completed = !t.completed;
        save();
        render();
      }
    } else if (action === "delete") {
      tasks = tasks.filter((x) => x.id !== id);
      save();
      render();
    } else if (action === "edit") {
      openEdit(id);
    }
  });

  function openEdit(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    document.getElementById("editTitle").value = t.title;
    document.getElementById("editCategory").value = t.category;
    document.getElementById("editPriority").value = t.priority;
    document.getElementById("editDue").value = t.dueDate || "";
    document.getElementById("editError").classList.remove("show");
    document.getElementById("editOverlay").classList.add("show");
    document.getElementById("editTitle").focus();
  }
  function closeEdit() {
    document.getElementById("editOverlay").classList.remove("show");
    editingId = null;
  }
  document.getElementById("cancelEdit").addEventListener("click", closeEdit);
  document
    .getElementById("editOverlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeEdit();
    });
  document.getElementById("saveEdit").addEventListener("click", function () {
    const title = document.getElementById("editTitle").value.trim();
    if (!title) {
      document.getElementById("editError").classList.add("show");
      return;
    }
    const t = tasks.find((x) => x.id === editingId);
    if (t) {
      t.title = title;
      t.category = document.getElementById("editCategory").value;
      t.priority = document.getElementById("editPriority").value;
      t.dueDate = document.getElementById("editDue").value || null;
      save();
      render();
    }
    closeEdit();
  });

  document
    .getElementById("statusChips")
    .addEventListener("click", function (e) {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document
        .querySelectorAll("#statusChips .chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filterStatus = chip.getAttribute("data-status");
      render();
    });
  document
    .getElementById("categoryChips")
    .addEventListener("click", function (e) {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document
        .querySelectorAll("#categoryChips .chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filterCategory = chip.getAttribute("data-cat");
      render();
    });
  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      searchTerm = e.target.value;
      render();
    });
  document
    .getElementById("sortSelect")
    .addEventListener("change", function (e) {
      sortMode = e.target.value;
      render();
    });

  loadTheme();
  setTodayLabel();
  load();
  render();
})();

const STORAGE_KEY = "reflection_log_entries";
const TAG_LABELS = {
  progress: "Progress",
  reflection: "Reflection",
  milestone: "Milestone",
};
const TAG_CLASSES = {
  progress: "badge-progress",
  reflection: "badge-reflection",
  milestone: "badge-milestone",
};
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let entries = loadEntries();
let state = { query: "", tag: "all" };

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const ymd = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const weekday = DAY_NAMES[d.getDay()];
  const isTuesday = d.getDay() === 2;
  return isTuesday
    ? `${ymd} · ${weekday} 🌙 Reflection Day`
    : `${ymd} · ${weekday}`;
}

function filteredEntries() {
  const q = state.query.trim().toLowerCase();
  return entries
    .filter((e) => (state.tag === "all" ? true : e.tag === state.tag))
    .filter((e) =>
      q
        ? (e.title + " " + e.progress + " " + e.reflect).toLowerCase().includes(q)
        : true
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderStats(list) {
  document.getElementById("stat-count").textContent = entries.length;
  const latest =
    entries.length > 0
      ? formatDate(
          entries
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
        ).split(" · ")[0]
      : "—";
  document.getElementById("stat-latest").textContent = latest;
  void list;
}

function renderEntry(list) {
  const emptyEl = document.getElementById("empty-state");
  if (list.length === 0) {
    emptyEl.textContent =
      state.query || state.tag !== "all"
        ? "No entries match your filters 🔍"
        : "No reflections yet. Write your first one ✏️";
    emptyEl.classList.remove("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  const container = document.getElementById("entry-list");
  container.innerHTML = list
    .map(
      (e) => `
      <article class="entry" data-tag="${e.tag}" data-id="${e.id}">
        <div class="entry-top">
          <h3 class="entry-title">${escapeHtml(e.title)}</h3>
          <div class="entry-meta">
            <span class="badge ${TAG_CLASSES[e.tag] || "badge-reflection"}">
              ${TAG_LABELS[e.tag] || "Reflection"}
            </span>
            <span class="entry-date">${formatDate(e.date)}</span>
          </div>
        </div>
        <div class="entry-body">
          <div class="entry-block">
            <h4>Progress</h4>
            <p class="${e.progress ? "" : "entry-empty"}">${
        e.progress ? escapeHtml(e.progress) : "(Not filled in)"
      }</p>
          </div>
          <div class="entry-block">
            <h4>Reflection</h4>
            <p class="${e.reflect ? "" : "entry-empty"}">${
        e.reflect ? escapeHtml(e.reflect) : "(Not filled in)"
      }</p>
          </div>
        </div>
        <div class="entry-actions">
          <button type="button" class="btn-icon edit-btn">Edit</button>
          <button type="button" class="btn-icon danger delete-btn">Delete</button>
        </div>
      </article>
    `
    )
    .join("");
}

function render() {
  const list = filteredEntries();
  renderStats(list);
  renderEntry(list);
}

function setDefaultDate() {
  const today = new Date();
  document.getElementById("date").valueAsDate = today;
}

function resetForm() {
  document.getElementById("reflection-form").reset();
  document.querySelector("#reflection-form .btn-primary").textContent = "Save Entry ✦";
  document.getElementById("title").dataset.editingId = "";
  setDefaultDate();
}

document.getElementById("reflection-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const progress = document.getElementById("progress").value.trim();
  const reflect = document.getElementById("reflect").value.trim();
  const tag = document.getElementById("tag").value;
  if (!title || !date) return;

  const editingId = document.getElementById("title").dataset.editingId;
  if (editingId) {
    entries = entries.map((ent) =>
      ent.id === editingId ? { ...ent, title, date, progress, reflect, tag } : ent
    );
  } else {
    entries.unshift({
      id: String(Date.now()),
      title,
      date,
      progress,
      reflect,
      tag,
    });
  }

  saveEntries();
  resetForm();
  render();
});

document.getElementById("entry-list").addEventListener("click", (e) => {
  const entryEl = e.target.closest(".entry");
  if (!entryEl) return;
  const id = entryEl.dataset.id;
  const entry = entries.find((ent) => ent.id === id);
  if (!entry) return;

  if (e.target.closest(".delete-btn")) {
    if (confirm("Delete this reflection?")) {
      entries = entries.filter((ent) => ent.id !== id);
      saveEntries();
      render();
    }
  }

  if (e.target.closest(".edit-btn")) {
    document.getElementById("title").value = entry.title;
    document.getElementById("date").value = entry.date;
    document.getElementById("progress").value = entry.progress;
    document.getElementById("reflect").value = entry.reflect;
    document.getElementById("tag").value = entry.tag;
    document.getElementById("title").dataset.editingId = entry.id;
    document.querySelector("#reflection-form .btn-primary").textContent = "Save Changes ✓";
    document.querySelector(".composer").scrollIntoView({ behavior: "smooth" });
  }
});

document.getElementById("search").addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

document.getElementById("filter").addEventListener("change", (e) => {
  state.tag = e.target.value;
  render();
});

setDefaultDate();
render();
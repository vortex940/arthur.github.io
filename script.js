const STORAGE_KEY = "reflection_log_entries";
const TAG_LABELS = {
  progress: "進度",
  reflection: "反思",
  milestone: "里程碑",
};
const TAG_CLASSES = {
  progress: "badge-progress",
  reflection: "badge-reflection",
  milestone: "badge-milestone",
};
const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

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
    ? `${ymd} · 週二 🌙 反思日`
    : `${ymd} · 週${weekday}`;
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
        ? "沒有符合條件的紀錄 🔍"
        : "還沒有任何記錄。寫下第一條反思吧 ✏️";
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
              ${TAG_LABELS[e.tag] || "反思"}
            </span>
            <span class="entry-date">${formatDate(e.date)}</span>
          </div>
        </div>
        <div class="entry-body">
          <div class="entry-block">
            <h4>進度</h4>
            <p class="${e.progress ? "" : "entry-empty"}">${
        e.progress ? escapeHtml(e.progress) : "（未填寫）"
      }</p>
          </div>
          <div class="entry-block">
            <h4>反思</h4>
            <p class="${e.reflect ? "" : "entry-empty"}">${
        e.reflect ? escapeHtml(e.reflect) : "（未填寫）"
      }</p>
          </div>
        </div>
        <div class="entry-actions">
          <button type="button" class="btn-icon edit-btn">編輯</button>
          <button type="button" class="btn-icon danger delete-btn">刪除</button>
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
  document.querySelector("#reflection-form .btn-primary").textContent = "存進日記 ✦";
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
    if (confirm("確定要刪除這篇反思嗎？")) {
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
    document.querySelector("#reflection-form .btn-primary").textContent = "儲存修改 ✓";
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
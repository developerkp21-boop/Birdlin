/**
 * birdlin.js — Shared Utilities
 * Birdlin SaaS Platform v1.0
 */

/* ── Mock Data Store (UI-only) ───────────────────────────── */
const BIRDLIN_STORE_KEY = "birdlin_mock_state_v1";
const BIRDLIN_DEFAULT_STATE = {
  usage: { callsUsed: 32, callLimit: 100 },
  custom: {
    agentCalls: [],
    agentLeads: [],
    agentBookings: [],
    clientBookings: [],
    adminClients: [],
    adminAgents: [],
    notifications: [],
    integrations: {
      "Google Calendar": false,
      Outlook: false,
      Zapier: false,
    },
  },
};
let birdlinMemoryState = cloneDefaultState();

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(BIRDLIN_DEFAULT_STATE));
}

function getState() {
  try {
    if (typeof localStorage === "undefined") return birdlinMemoryState;
    const raw = localStorage.getItem(BIRDLIN_STORE_KEY);
    if (!raw) return birdlinMemoryState;
    const parsed = JSON.parse(raw);
    const merged = {
      ...cloneDefaultState(),
      ...parsed,
      usage: { ...cloneDefaultState().usage, ...(parsed.usage || {}) },
      custom: { ...cloneDefaultState().custom, ...(parsed.custom || {}) },
    };
    birdlinMemoryState = merged;
    return merged;
  } catch {
    return birdlinMemoryState;
  }
}

function setState(next) {
  birdlinMemoryState = next;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BIRDLIN_STORE_KEY, JSON.stringify(next));
    }
  } catch {
    // Keep in-memory fallback when storage is blocked/unavailable.
  }
}

function updateState(mutator) {
  const current = getState();
  const next = mutator(current) || current;
  setState(next);
  return next;
}

window.BirdlinStore = {
  getState,
  setState,
  updateState,
  reset() {
    birdlinMemoryState = cloneDefaultState();
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(BIRDLIN_STORE_KEY);
      }
    } catch {
      // no-op
    }
  },
  addUsageCalls(amount) {
    return updateState((state) => {
      state.usage.callsUsed += Math.max(0, Number(amount) || 0);
      return state;
    });
  },
  addNotification(payload) {
    return updateState((state) => {
      state.custom.notifications.unshift({
        title: payload.title || "New update",
        sub: payload.sub || "",
        time: payload.time || "now",
        tone: payload.tone || "var(--ind)",
      });
      state.custom.notifications = state.custom.notifications.slice(0, 40);
      return state;
    });
  },
  addAgentLead(lead) {
    return updateState((state) => {
      state.custom.agentLeads.unshift(lead);
      return state;
    });
  },
  addAgentCall(call) {
    return updateState((state) => {
      state.custom.agentCalls.unshift(call);
      return state;
    });
  },
  addAgentBooking(booking) {
    return updateState((state) => {
      state.custom.agentBookings.unshift(booking);
      state.custom.clientBookings.unshift(booking);
      return state;
    });
  },
  addClientBooking(booking) {
    return updateState((state) => {
      state.custom.clientBookings.unshift(booking);
      state.custom.agentBookings.unshift(booking);
      return state;
    });
  },
  addAdminClient(client) {
    return updateState((state) => {
      state.custom.adminClients.unshift(client);
      return state;
    });
  },
  addAdminAgent(agent) {
    return updateState((state) => {
      state.custom.adminAgents.unshift(agent);
      return state;
    });
  },
  setIntegration(name, value) {
    return updateState((state) => {
      state.custom.integrations[name] = Boolean(value);
      return state;
    });
  },
};

window.BirdlinUI = {
  initials(name) {
    return (name || "NA")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  },
  formatDateShort(dateString) {
    const d = new Date(dateString || Date.now());
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
  formatDateTime(dateString, timeString) {
    if (!dateString) return "TBD";
    const dt = new Date(
      `${dateString}T${timeString && timeString.length ? timeString : "09:00"}`
    );
    return dt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  },
  appendTopNotification(note) {
    const menu = document.getElementById("notifDd");
    if (!menu) return;
    const item = document.createElement("div");
    item.className = "notif-item";
    item.innerHTML = `<div class="notif-title">${note.title}</div><div class="notif-sub">${note.sub}</div><div class="notif-time">${note.time || "now"}</div>`;
    menu.appendChild(item);
  },
};

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg) {
  const t = document.getElementById("toast");
  const m = document.getElementById("tmsg");
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove("show"), 2500);
}

/* ── Modal ──────────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

/* ── Dropdown ────────────────────────────────────────────── */
function toggleDd(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains("open");
  closeDds();
  if (!isOpen) el.classList.add("open");
}
function closeDds() {
  document
    .querySelectorAll(".dd-menu")
    .forEach((d) => d.classList.remove("open"));
}

/* ── Table Filter ────────────────────────────────────────── */
function filterTbl(tblId, src) {
  const q = (src.value || "").toLowerCase();
  const rows = document.querySelectorAll("#" + tblId + " tbody tr");
  rows.forEach((r) => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}
function filterCalls(src) {
  if (document.getElementById("callTable")) filterTbl("callTable", src);
  if (document.getElementById("agLeadTbl")) filterTbl("agLeadTbl", src);
}

/* ── Notifications ───────────────────────────────────────── */
function markAllRead() {
  document.querySelectorAll(".notif-row.unread").forEach((r) => {
    const dot = r.querySelector("div:first-child");
    if (dot) dot.style.background = "var(--g300)";
    r.classList.remove("unread");
  });
  toast("All notifications marked as read");
}
function readN(row) {
  const dot = row.querySelector("div:first-child");
  if (dot) dot.style.background = "var(--g300)";
  row.classList.remove("unread");
}

/* ── Settings Tabs ───────────────────────────────────────── */
function stab(btn, id) {
  const tabs = btn.closest(".stabs");
  if (tabs) tabs.querySelectorAll(".stab").forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  document.querySelectorAll(".stsec").forEach((s) => s.classList.remove("on"));
  const target = document.getElementById(id);
  if (target) target.classList.add("on");
}

/* ── Sidebar Navigation ──────────────────────────────────── */
function nav(id, el) {
  document.querySelectorAll(".sec").forEach((s) => s.classList.remove("on"));
  const sec = document.getElementById("sec-" + id);
  if (sec) sec.classList.add("on");
  document.querySelectorAll(".ni").forEach((n) => n.classList.remove("on"));
  if (el) el.classList.add("on");
  const titles = {
    overview: "Overview",
    workspace: "Call Workspace",
    calls: "Call History",
    leads: "Leads",
    bookings: "Bookings",
    analytics: "Analytics",
    billing: "Billing & Usage",
    notifications: "Notifications",
    settings: "Settings",
    perf: "Performance",
    clients: "Clients",
    agents: "Agents",
    revenue: "Billing & Revenue",
    logs: "Call Logs",
    qa: "QA & Scoring",
    reports: "Reports",
    integrations: "Integrations",
    admin: "Admin Overview",
  };
  const title = document.getElementById("ptitle");
  if (title) title.textContent = titles[id] || id;
  if (window.onNav) window.onNav(id);
  if (window.innerWidth <= 700) {
    const sb = document.getElementById("sb");
    if (sb) sb.classList.remove("open");
  }
}

function toggleSidebar() {
  const sb = document.getElementById("sb");
  if (sb) sb.classList.toggle("open");
}

/* ── Global Click Handlers ───────────────────────────────── */
document.addEventListener("click", (e) => {
  // Close dropdowns
  if (!e.target.closest(".dd-wrap")) closeDds();
  // Close sidebar on mobile outside click
  const sb = document.getElementById("sb");
  if (
    sb &&
    window.innerWidth <= 700 &&
    sb.classList.contains("open") &&
    !sb.contains(e.target) &&
    !e.target.closest(".ham")
  ) {
    sb.classList.remove("open");
  }
});

// Close modals on backdrop click
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-bg").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.remove("open");
    });
  });
});

'use strict';

const STORAGE_KEY = 'futureme_letters';

const MOOD_ICONS = {
  hopeful:    '🌟',
  reflective: '🌊',
  ambitious:  '🚀',
  grateful:   '🙏',
  curious:    '🔍',
};

const MOOD_LABELS = {
  hopeful:    'Hopeful',
  reflective: 'Reflective',
  ambitious:  'Ambitious',
  grateful:   'Grateful',
  curious:    'Curious',
};

// ─── State ────────────────────────────────────────────────────────────────────
let letters = [];
let activeFilter = 'all';
let activeSearch = '';
let activeSort   = 'newest';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const dom = {
  themeToggle:   document.getElementById('themeToggle'),
  themeIcon:     document.getElementById('themeIcon'),
  timeline:      document.getElementById('timeline'),
  searchInput:   document.getElementById('searchInput'),
  sortSelect:    document.getElementById('sortSelect'),
  hTotalCount:   document.getElementById('hTotalCount'),
  hSealedCount:  document.getElementById('hSealedCount'),
  hRevealedCount:document.getElementById('hRevealedCount'),
  hShownCount:   document.getElementById('hShownCount'),
  revealOverlay: document.getElementById('revealOverlay'),
  revealClose:   document.getElementById('revealClose'),
  revealClose2:  document.getElementById('revealClose2'),
  revealTitle:   document.getElementById('revealTitle'),
  revealMeta:    document.getElementById('revealMeta'),
  revealMessage: document.getElementById('revealMessage'),
  revealEnvAnim: document.getElementById('revealEnvAnim'),
  toast:         document.getElementById('toast'),
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  loadLetters();
  initTheme();
  bindEvents();
  render();
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('futureme_theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('futureme_theme', theme);
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadLetters() {
  try {
    letters = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    letters = [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isUnlocked(letter) {
  return new Date() >= new Date(letter.unlockDate + 'T00:00:00');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateTime(isoStr) {
  return new Date(isoStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function escHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

let toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

// ─── Filter / Sort / Search ───────────────────────────────────────────────────
function getVisible() {
  let list = letters.slice();

  // filter
  if (activeFilter === 'sealed')   list = list.filter(l => !isUnlocked(l));
  if (activeFilter === 'revealed') list = list.filter(l =>  isUnlocked(l));

  // search
  if (activeSearch.trim()) {
    const q = activeSearch.trim().toLowerCase();
    list = list.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.message.toLowerCase().includes(q)
    );
  }

  // sort
  if (activeSort === 'newest')      list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (activeSort === 'oldest')      list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (activeSort === 'reveal-asc')  list.sort((a,b) => new Date(a.unlockDate) - new Date(b.unlockDate));
  if (activeSort === 'reveal-desc') list.sort((a,b) => new Date(b.unlockDate) - new Date(a.unlockDate));

  return list;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  const all      = letters;
  const sealed   = all.filter(l => !isUnlocked(l));
  const revealed = all.filter(l =>  isUnlocked(l));
  const visible  = getVisible();

  dom.hTotalCount.textContent    = all.length;
  dom.hSealedCount.textContent   = sealed.length;
  dom.hRevealedCount.textContent = revealed.length;
  dom.hShownCount.textContent    = visible.length;

  dom.timeline.innerHTML = '';

  if (all.length === 0) {
    dom.timeline.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📭</div>
        <p>No letters yet. <a href="index.html">Write your first one.</a></p>
      </div>`;
    return;
  }

  if (visible.length === 0) {
    dom.timeline.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">🔍</div>
        <p>No letters match your search or filter.</p>
      </div>`;
    return;
  }

  visible.forEach((letter, idx) => {
    const unlocked  = isUnlocked(letter);
    const moodIcon  = MOOD_ICONS[letter.mood]  || '✉';
    const moodLabel = MOOD_LABELS[letter.mood] || '';

    const item = document.createElement('div');
    item.className = `timeline-item ${unlocked ? 'revealed' : 'sealed'}`;
    item.style.animationDelay = `${idx * 0.05}s`;

    item.innerHTML = `
      <div class="tl-dot ${unlocked ? 'dot-revealed' : 'dot-sealed'}">${moodIcon}</div>
      <div class="tl-card">
        <div class="tl-card-head">
          <div class="tl-meta">
            <span class="tl-name">To: ${escHtml(letter.name)}</span>
            <span class="tl-mood-tag">${moodIcon} ${moodLabel}</span>
          </div>
          <span class="tl-badge ${unlocked ? 'badge-unlocked' : 'badge-sealed'}">
            ${unlocked ? '🔓 Revealed' : '⏳ Sealed'}
          </span>
        </div>

        <div class="tl-message ${unlocked ? '' : 'tl-message-blurred'}">
          ${escHtml(letter.message)}
        </div>

        <div class="tl-dates">
          <span>✍ Written: ${formatDateTime(letter.createdAt)}</span>
          <span>${unlocked ? '🔓 Revealed' : '📅 Reveals'}: ${formatDate(letter.unlockDate)}</span>
        </div>

        <div class="tl-actions">
          ${unlocked
            ? `<button class="card-btn btn-reveal" data-action="reveal" data-id="${letter.id}">Open Letter</button>`
            : `<button class="card-btn" disabled style="opacity:.45;cursor:not-allowed">Sealed 🔒</button>`
          }
          <button class="card-btn btn-delete" data-action="delete" data-id="${letter.id}">Delete</button>
        </div>
      </div>
    `;

    dom.timeline.appendChild(item);
  });
}

// ─── Reveal Modal ─────────────────────────────────────────────────────────────
function showReveal(letter) {
  dom.revealTitle.textContent   = `A letter for ${letter.name}`;
  dom.revealMeta.textContent    = `Written on ${new Date(letter.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} · Revealed ${formatDate(letter.unlockDate)}`;
  dom.revealMessage.textContent = letter.message;

  dom.revealEnvAnim.style.animation = 'none';
  void dom.revealEnvAnim.offsetWidth;
  dom.revealEnvAnim.style.animation = '';

  openModal(dom.revealOverlay);
}

function openModal(overlay)  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal(overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  dom.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // Search
  dom.searchInput.addEventListener('input', () => {
    activeSearch = dom.searchInput.value;
    render();
  });

  // Sort
  dom.sortSelect.addEventListener('change', () => {
    activeSort = dom.sortSelect.value;
    render();
  });

  // Card actions (delegation)
  dom.timeline.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const letter = letters.find(l => l.id === id);
    if (!letter) return;

    if (action === 'reveal') {
      showReveal(letter);
    }

    if (action === 'delete') {
      if (confirm(`Delete this letter to ${letter.name}? This cannot be undone.`)) {
        letters = letters.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
        render();
        showToast('Letter deleted.');
      }
    }
  });

  // Reveal modal close
  dom.revealClose.addEventListener('click',  () => closeModal(dom.revealOverlay));
  dom.revealClose2.addEventListener('click', () => closeModal(dom.revealOverlay));
  dom.revealOverlay.addEventListener('click', e => {
    if (e.target === dom.revealOverlay) closeModal(dom.revealOverlay);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal(dom.revealOverlay);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

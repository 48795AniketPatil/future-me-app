'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'futureme_letters';

const MOOD_ICONS = {
  hopeful:    '🌟',
  reflective: '🌊',
  ambitious:  '🚀',
  grateful:   '🙏',
  curious:    '🔍',
};

const QUOTES = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You are the author of your own story — write it boldly.",
  "Every expert was once a beginner. Every pro was once an amateur.",
  "Your future self is watching you right now through memories.",
  "Small steps every day lead to extraordinary results.",
  "Believe in the version of yourself that your future self already knows.",
  "Don't wait. The time will never be just right.",
  "What you do today can improve all your tomorrows.",
  "Dream big. Start small. Act now.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "You can't go back and change the beginning, but you can start where you are.",
  "Success is the sum of small efforts repeated day in and day out.",
];

// ─── State ────────────────────────────────────────────────────────────────────
let letters = [];
let countdownTimers = {};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const dom = {
  themeToggle:   document.getElementById('themeToggle'),
  themeIcon:     document.getElementById('themeIcon'),
  quoteTicker:   document.getElementById('quoteTicker'),
  openFormBtn:   document.getElementById('openFormBtn'),
  modalOverlay:  document.getElementById('modalOverlay'),
  modalClose:    document.getElementById('modalClose'),
  letterForm:    document.getElementById('letterForm'),
  userName:      document.getElementById('userName'),
  userMessage:   document.getElementById('userMessage'),
  charCount:     document.getElementById('charCount'),
  unlockDate:    document.getElementById('unlockDate'),
  letterMood:    document.getElementById('letterMood'),
  nameError:     document.getElementById('nameError'),
  messageError:  document.getElementById('messageError'),
  dateError:     document.getElementById('dateError'),
  lettersGrid:   document.getElementById('lettersGrid'),
  emptyState:    document.getElementById('emptyState'),
  totalCount:    document.getElementById('totalCount'),
  lockedCount:   document.getElementById('lockedCount'),
  unlockedCount: document.getElementById('unlockedCount'),
  revealOverlay: document.getElementById('revealOverlay'),
  revealModal:   document.getElementById('revealModal'),
  revealClose:   document.getElementById('revealClose'),
  revealClose2:  document.getElementById('revealClose2'),
  revealTitle:   document.getElementById('revealTitle'),
  revealMeta:    document.getElementById('revealMeta'),
  revealMessage: document.getElementById('revealMessage'),
  toast:         document.getElementById('toast'),
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  loadLetters();
  initTheme();
  initQuoteTicker();
  setMinDate();
  bindEvents();
  renderDashboard();
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

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── Quote Ticker ─────────────────────────────────────────────────────────────
function initQuoteTicker() {
  let idx = 0;
  function showQuote() {
    dom.quoteTicker.classList.remove('visible');
    setTimeout(() => {
      dom.quoteTicker.textContent = `"${QUOTES[idx % QUOTES.length]}"`;
      dom.quoteTicker.classList.add('visible');
      idx++;
    }, 400);
  }
  showQuote();
  setInterval(showQuote, 7000);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function setMinDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dom.unlockDate.min = tomorrow.toISOString().split('T')[0];
}

function isUnlocked(letter) {
  return new Date() >= new Date(letter.unlockDate + 'T00:00:00');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getCountdownParts(targetDateStr) {
  const now  = Date.now();
  const end  = new Date(targetDateStr + 'T00:00:00').getTime();
  let diff   = Math.max(0, end - now);

  const days  = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);  diff -= hours * 3600000;
  const mins  = Math.floor(diff / 60000);    diff -= mins * 60000;
  const secs  = Math.floor(diff / 1000);
  return { days, hours, mins, secs };
}

function getProgress(createdAt, unlockDate) {
  const start = new Date(createdAt).getTime();
  const end   = new Date(unlockDate + 'T00:00:00').getTime();
  const now   = Date.now();
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadLetters() {
  try {
    letters = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    letters = [];
  }
}

function saveLetters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function addLetter(data) {
  const letter = {
    id:         crypto.randomUUID(),
    name:       data.name.trim(),
    message:    data.message.trim(),
    unlockDate: data.unlockDate,
    mood:       data.mood,
    createdAt:  new Date().toISOString(),
  };
  letters.unshift(letter);
  saveLetters();
  return letter;
}

function deleteLetter(id) {
  letters = letters.filter(l => l.id !== id);
  saveLetters();
}

// ─── Form Validation ──────────────────────────────────────────────────────────
function validateForm() {
  let valid = true;
  const name    = dom.userName.value.trim();
  const message = dom.userMessage.value.trim();
  const date    = dom.unlockDate.value;

  dom.nameError.textContent    = '';
  dom.messageError.textContent = '';
  dom.dateError.textContent    = '';
  dom.userName.classList.remove('error');
  dom.userMessage.classList.remove('error');
  dom.unlockDate.classList.remove('error');

  if (!name) {
    dom.nameError.textContent = 'Please enter your name.';
    dom.userName.classList.add('error');
    valid = false;
  }
  if (!message) {
    dom.messageError.textContent = 'Your letter cannot be empty.';
    dom.userMessage.classList.add('error');
    valid = false;
  }
  if (!date) {
    dom.dateError.textContent = 'Please select a reveal date.';
    dom.unlockDate.classList.add('error');
    valid = false;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (new Date(date + 'T00:00:00') < tomorrow) {
      dom.dateError.textContent = 'Date must be at least tomorrow.';
      dom.unlockDate.classList.add('error');
      valid = false;
    }
  }
  return valid;
}

// ─── Render Dashboard ─────────────────────────────────────────────────────────
function renderDashboard() {
  // Clear old timers
  Object.values(countdownTimers).forEach(clearInterval);
  countdownTimers = {};

  const locked   = letters.filter(l => !isUnlocked(l)).length;
  const unlocked = letters.filter(l =>  isUnlocked(l)).length;

  dom.totalCount.textContent    = letters.length;
  dom.lockedCount.textContent   = locked;
  dom.unlockedCount.textContent = unlocked;

  // Clear grid (keep empty-state element)
  dom.lettersGrid.innerHTML = '';

  if (letters.length === 0) {
    dom.lettersGrid.appendChild(createEmptyState());
    return;
  }

  letters.forEach(letter => {
    const card = createCard(letter);
    dom.lettersGrid.appendChild(card);

    if (!isUnlocked(letter)) {
      startCountdown(letter, card);
    }
  });
}

function createEmptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<div class="empty-icon">📭</div><p>No letters yet. Write one to get started.</p>`;
  return div;
}

function createCard(letter) {
  const unlocked = isUnlocked(letter);
  const card = document.createElement('div');
  card.className = `letter-card ${unlocked ? 'unlocked' : 'sealed'}`;
  card.dataset.id = letter.id;

  const progress  = getProgress(letter.createdAt, letter.unlockDate);
  const cd        = getCountdownParts(letter.unlockDate);
  const moodIcon  = MOOD_ICONS[letter.mood] || '✉';

  card.innerHTML = `
    <div class="card-mood">${moodIcon}</div>
    <div class="card-name">To: ${escHtml(letter.name)}</div>
    <div class="card-preview ${unlocked ? '' : 'locked-text'}">${escHtml(letter.message)}</div>
    <div class="card-date-row">
      <span>${unlocked ? '🔓 Revealed' : '🔒 Sealed until'}</span>
      <span>${formatDate(letter.unlockDate)}</span>
    </div>
    <span class="card-badge ${unlocked ? 'badge-unlocked' : 'badge-sealed'}">
      ${unlocked ? '✓ Open' : '⏳ Waiting'}
    </span>

    ${unlocked ? '' : `
    <div class="progress-wrap">
      <div class="progress-label">
        <span>Progress</span>
        <span id="pct-${letter.id}">${progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="bar-${letter.id}" style="width:${progress}%"></div>
      </div>
    </div>
    <div class="countdown" id="cd-${letter.id}">
      ${countdownHTML(cd)}
    </div>
    `}

    <div class="card-actions">
      ${unlocked
        ? `<button class="card-btn btn-reveal" data-action="reveal" data-id="${letter.id}">Open Letter</button>`
        : `<button class="card-btn" data-action="peek" data-id="${letter.id}" disabled style="opacity:.45;cursor:not-allowed">Sealed 🔒</button>`
      }
      <button class="card-btn btn-delete" data-action="delete" data-id="${letter.id}">Delete</button>
    </div>
  `;

  return card;
}

function countdownHTML({ days, hours, mins, secs }) {
  return `
    <div class="cd-unit"><span class="cd-num">${pad(days)}</span><span class="cd-lbl">days</span></div>
    <div class="cd-unit"><span class="cd-num">${pad(hours)}</span><span class="cd-lbl">hrs</span></div>
    <div class="cd-unit"><span class="cd-num">${pad(mins)}</span><span class="cd-lbl">min</span></div>
    <div class="cd-unit"><span class="cd-num">${pad(secs)}</span><span class="cd-lbl">sec</span></div>
  `;
}

function startCountdown(letter, card) {
  const timerId = setInterval(() => {
    if (isUnlocked(letter)) {
      clearInterval(timerId);
      // Re-render just this card
      const newCard = createCard(letter);
      card.replaceWith(newCard);
      // Update stats
      const locked   = letters.filter(l => !isUnlocked(l)).length;
      const unlocked = letters.filter(l =>  isUnlocked(l)).length;
      dom.totalCount.textContent    = letters.length;
      dom.lockedCount.textContent   = locked;
      dom.unlockedCount.textContent = unlocked;
      showToast(`🎉 A letter for ${escHtml(letter.name)} is now revealed!`);
      return;
    }
    const cdEl  = document.getElementById(`cd-${letter.id}`);
    const barEl = document.getElementById(`bar-${letter.id}`);
    const pctEl = document.getElementById(`pct-${letter.id}`);
    if (!cdEl) { clearInterval(timerId); return; }

    const cd  = getCountdownParts(letter.unlockDate);
    const pct = getProgress(letter.createdAt, letter.unlockDate);
    cdEl.innerHTML = countdownHTML(cd);
    if (barEl) barEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
  }, 1000);

  countdownTimers[letter.id] = timerId;
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function showReveal(letter) {
  dom.revealTitle.textContent = `A letter for ${letter.name}`;
  dom.revealMeta.textContent  = `Written on ${new Date(letter.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} · Revealed ${formatDate(letter.unlockDate)}`;
  dom.revealMessage.textContent = letter.message;

  // reset animation
  dom.revealEnvAnim.style.animation = 'none';
  void dom.revealEnvAnim.offsetWidth;
  dom.revealEnvAnim.style.animation = '';

  openModal(dom.revealOverlay);
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function openModal(overlay)  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal(overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  // Theme
  dom.themeToggle.addEventListener('click', toggleTheme);

  // Open form
  dom.openFormBtn.addEventListener('click', () => openModal(dom.modalOverlay));

  // Close form modal
  dom.modalClose.addEventListener('click', () => closeModal(dom.modalOverlay));
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeModal(dom.modalOverlay);
  });

  // Close reveal modal
  dom.revealClose.addEventListener('click',  () => closeModal(dom.revealOverlay));
  dom.revealClose2.addEventListener('click', () => closeModal(dom.revealOverlay));
  dom.revealOverlay.addEventListener('click', e => {
    if (e.target === dom.revealOverlay) closeModal(dom.revealOverlay);
  });

  // Char counter
  dom.userMessage.addEventListener('input', () => {
    dom.charCount.textContent = dom.userMessage.value.length;
  });

  // Form submit
  dom.letterForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    addLetter({
      name:       dom.userName.value,
      message:    dom.userMessage.value,
      unlockDate: dom.unlockDate.value,
      mood:       dom.letterMood.value,
    });

    dom.letterForm.reset();
    dom.charCount.textContent = '0';
    closeModal(dom.modalOverlay);
    renderDashboard();
    showToast('✉ Letter sealed! It will be revealed on ' + formatDate(dom.unlockDate.value || new Date().toISOString().split('T')[0]));
  });

  // Card action delegation
  dom.lettersGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const letter = letters.find(l => l.id === id);

    if (action === 'reveal' && letter) {
      showReveal(letter);
    }
    if (action === 'delete' && letter) {
      if (confirm(`Delete this letter to ${letter.name}? This cannot be undone.`)) {
        clearInterval(countdownTimers[id]);
        deleteLetter(id);
        renderDashboard();
        showToast('Letter deleted.');
      }
    }
  });

  // Envelope hover easter egg
  document.getElementById('heroEnvelope').addEventListener('click', () => openModal(dom.modalOverlay));

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal(dom.modalOverlay);
      closeModal(dom.revealOverlay);
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

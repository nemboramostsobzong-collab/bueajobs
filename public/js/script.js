// ─── Hamburger Menu ───────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ─── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span class="toast-msg">${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// ─── Badge Helper ─────────────────────────────────────────────
function getBadgeClass(type) {
  if (!type) return 'badge-fulltime';
  const t = type.toLowerCase();
  if (t.includes('part')) return 'badge-parttime';
  if (t.includes('free')) return 'badge-freelance';
  return 'badge-fulltime';
}

// ─── Format Date ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'Open';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Active Nav Link ──────────────────────────────────────────
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.href === window.location.href) link.classList.add('active');
});

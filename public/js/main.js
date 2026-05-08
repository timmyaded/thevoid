// ── Theme toggle ────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function applyTheme(theme) {
  if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
    if (themeToggle) themeToggle.textContent = '☽';
  } else {
    html.removeAttribute('data-theme');
    if (themeToggle) themeToggle.textContent = '☀';
  }
}

applyTheme(localStorage.getItem('theme') || 'dark');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

// ── Navbar scroll state ─────────────────────────
const nav = document.getElementById('mainNav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Like button (AJAX toggle) ───────────────────
document.querySelectorAll('.activity-like-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const postId = btn.dataset.id;
    const countEl = btn.querySelector('.like-count');

    try {
      const res = await fetch(`/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) return;
      const { likes, liked } = await res.json();

      // Update count
      if (countEl) countEl.textContent = likes;

      // Toggle liked state + fill SVG
      btn.classList.toggle('liked', liked);
      const path = btn.querySelector('svg path');
      if (path) path.setAttribute('fill', liked ? 'currentColor' : 'none');

      // Micro-animation
      btn.style.transform = 'scale(1.25)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    } catch (err) {
      console.error('Like failed:', err);
    }
  });
});

// ── Live word count ─────────────────────────────
const content = document.getElementById('content');
const wordCount = document.getElementById('wordCount');

function updateWordCount() {
  if (!content || !wordCount) return;
  const words = content.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = words;
}

if (content) {
  updateWordCount();
  content.addEventListener('input', updateWordCount);
}
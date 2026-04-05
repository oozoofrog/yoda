const STORAGE_KEY = 'yoda-learning-reader-v1';
const state = {
  docs: [],
  docById: new Map(),
  docByPath: new Map(),
  currentDocId: null,
  pendingAnchor: null,
  search: '',
  store: loadStore(),
};

const el = {
  searchInput: document.getElementById('searchInput'),
  themeToggle: document.getElementById('themeToggle'),
  tocCount: document.getElementById('tocCount'),
  docList: document.getElementById('docList'),
  docHeader: document.getElementById('docHeader'),
  docOutline: document.getElementById('docOutline'),
  docContent: document.getElementById('docContent'),
  notesArea: document.getElementById('docNotesArea'),
};

init().catch((error) => {
  console.error(error);
  el.docContent.innerHTML = `<p class="empty-state">문서를 불러오지 못했습니다. ${escapeHtml(String(error))}</p>`;
});

async function init() {
  applyTheme();
  bindGlobalEvents();
  const response = await fetch('content.json');
  if (!response.ok) throw new Error(`content.json load failed: ${response.status}`);
  const payload = await response.json();
  state.docs = payload.docs || [];
  state.docs.forEach((doc) => {
    state.docById.set(doc.id, doc);
    state.docByPath.set(doc.path, doc);
  });
  state.currentDocId = getInitialDocId();
  renderSidebar();
  renderCurrentDoc();
}

function loadStore() {
  const base = {
    theme: 'light',
    notes: {},
    lastDocId: null,
  };
  try {
    return { ...base, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return base;
  }
}

function persistStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
}

function bindGlobalEvents() {
  el.searchInput.addEventListener('input', (event) => {
    state.search = normalizeSearch(event.target.value);
    renderSidebar();
  });

  el.themeToggle.addEventListener('click', () => {
    state.store.theme = state.store.theme === 'dark' ? 'light' : 'dark';
    persistStore();
    applyTheme();
  });

  el.notesArea.addEventListener('input', (event) => {
    const doc = getCurrentDoc();
    if (!doc) return;
    state.store.notes[doc.id] = event.target.value;
    persistStore();
  });

  window.addEventListener('hashchange', () => {
    const { docId, anchor } = parseHash();
    if (!docId || !state.docById.has(docId)) return;
    state.currentDocId = docId;
    state.pendingAnchor = anchor;
    state.store.lastDocId = docId;
    persistStore();
    renderSidebar();
    renderCurrentDoc();
  });
}

function applyTheme() {
  document.body.classList.toggle('theme-dark', state.store.theme === 'dark');
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  return {
    docId: params.get('doc'),
    anchor: params.get('anchor'),
  };
}

function updateHash(docId, anchor = null) {
  const params = new URLSearchParams();
  params.set('doc', docId);
  if (anchor) params.set('anchor', anchor);
  const hash = `#${params.toString()}`;
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

function getInitialDocId() {
  const { docId, anchor } = parseHash();
  if (docId && state.docById.has(docId)) {
    state.pendingAnchor = anchor;
    return docId;
  }
  if (state.store.lastDocId && state.docById.has(state.store.lastDocId)) {
    return state.store.lastDocId;
  }
  const starter = state.docs.find((doc) => doc.path === 'tutorials/courses/00-swift-compiler-first-contribution-track.md');
  return starter?.id || state.docs[0]?.id || null;
}

function getCurrentDoc() {
  return state.docById.get(state.currentDocId) || null;
}

function getVisibleDocs() {
  return state.docs.filter((doc) => {
    if (!state.search) return true;
    const haystack = normalizeSearch(`${doc.title} ${doc.path} ${doc.excerpt || ''} ${doc.trackLabel || ''} ${doc.categoryLabel || ''}`);
    return haystack.includes(state.search);
  });
}

function setCurrentDoc(docId, anchor = null) {
  if (!state.docById.has(docId)) return;
  state.currentDocId = docId;
  state.pendingAnchor = anchor;
  state.store.lastDocId = docId;
  persistStore();
  updateHash(docId, anchor);
  renderSidebar();
  renderCurrentDoc();
}

function renderSidebar() {
  const docs = getVisibleDocs();
  el.tocCount.textContent = `${docs.length}개`;
  if (!docs.length) {
    el.docList.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
    return;
  }
  el.docList.innerHTML = docs
    .map((doc, index) => `
      <button class="doc-item ${doc.id === state.currentDocId ? 'active' : ''}" data-doc-id="${doc.id}" type="button">
        <div class="doc-item-title">${index + 1}. ${escapeHtml(doc.title)}</div>
        <div class="doc-item-meta">${escapeHtml(doc.path)} · ${escapeHtml(doc.categoryLabel || '')}</div>
      </button>
    `)
    .join('');

  el.docList.querySelectorAll('[data-doc-id]').forEach((button) => {
    button.addEventListener('click', () => setCurrentDoc(button.dataset.docId));
  });
}

function renderCurrentDoc() {
  const doc = getCurrentDoc();
  if (!doc) return;

  const badges = [
    badge(doc.categoryLabel),
    badge(`읽기 ${doc.readingMinutes}분`),
  ];
  if (doc.trackLabel) badges.push(badge(doc.trackLabel));
  if (doc.stageGuess) badges.push(badge(doc.stageGuess));
  if (doc.difficulty) badges.push(badge(`난이도 ${doc.difficulty}`));

  el.docHeader.innerHTML = `
    <div class="doc-path">${escapeHtml(doc.path)}</div>
    <h2>${escapeHtml(doc.title)}</h2>
    <p class="doc-summary">${escapeHtml(doc.excerpt || '선택한 문서의 내용을 우측에서 바로 읽습니다.')}</p>
    <div class="doc-meta-row">${badges.join('')}</div>
  `;

  const headings = (doc.headings || []).filter((item) => item.level >= 2 && item.level <= 3);
  el.docOutline.innerHTML = headings.length
    ? `
      <div class="outline-card">
        <h3>현재 문서 목차</h3>
        <div class="outline-list">
          ${headings.map((item) => `<button class="outline-button" type="button" data-scroll-target="${item.id}">${escapeHtml(item.text)}</button>`).join('')}
        </div>
      </div>
    `
    : '';

  el.docContent.innerHTML = doc.html;
  el.notesArea.value = state.store.notes[doc.id] || '';

  bindDocLinkInterception(el.docContent);
  bindOutlineButtons();
  handlePendingAnchor();
}

function bindDocLinkInterception(root) {
  root.querySelectorAll('[data-doc-href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = state.docByPath.get(link.dataset.docHref);
      if (!target) return;
      setCurrentDoc(target.id, link.dataset.docAnchor || null);
    });
  });

  root.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToAnchor(button.dataset.scrollTarget);
    });
  });
}

function bindOutlineButtons() {
  el.docOutline.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => scrollToAnchor(button.dataset.scrollTarget));
  });
}

function handlePendingAnchor() {
  if (!state.pendingAnchor) return;
  const anchor = state.pendingAnchor;
  state.pendingAnchor = null;
  requestAnimationFrame(() => scrollToAnchor(anchor));
}

function scrollToAnchor(anchor) {
  const target = el.docContent.querySelector(`#${cssEscape(anchor)}`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function badge(text) {
  return `<span class="badge">${escapeHtml(text || '')}</span>`;
}

function normalizeSearch(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9가-힣]+/g, ' ')
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

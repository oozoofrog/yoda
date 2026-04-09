const STORAGE_KEY = 'yoda-learning-reader-v3';

const state = {
  docs: [],
  docById: new Map(),
  docByPath: new Map(),
  currentDocId: null,
  pendingAnchor: null,
  currentHeadingId: null,
  navOpen: false,
  search: '',
  store: loadStore(),
};

const el = {
  searchInput: document.getElementById('searchInput'),
  themeToggle: document.getElementById('themeToggle'),
  navToggle: document.getElementById('navToggle'),
  floatingNavColumn: document.getElementById('floatingNavColumn'),
  tocCount: document.getElementById('tocCount'),
  docList: document.getElementById('docList'),
  docHeader: document.getElementById('docHeader'),
  docContent: document.getElementById('docContent'),
  notesArea: document.getElementById('docNotesArea'),
  floatingOutlineList: document.getElementById('floatingOutlineList'),
  floatingCurrentSection: document.getElementById('floatingCurrentSection'),
  spotlightStrip: document.getElementById('spotlightStrip'),
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
  state.navOpen = !!state.store.navOpen;
  state.docs.forEach((doc) => {
    state.docById.set(doc.id, doc);
    state.docByPath.set(doc.path, doc);
  });
  state.currentDocId = getInitialDocId();
  renderNavVisibility();
  renderSpotlightStrip();
  renderSidebar();
  renderCurrentDoc();
}

function loadStore() {
  const base = {
    theme: 'light',
    notes: {},
    lastDocId: null,
    navOpen: false,
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

  el.navToggle.addEventListener('click', () => {
    state.navOpen = !state.navOpen;
    state.store.navOpen = state.navOpen;
    persistStore();
    renderNavVisibility();
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

  window.addEventListener('scroll', updateCurrentHeadingFromScroll, { passive: true });
  window.addEventListener('resize', renderNavVisibility);
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
  if (window.location.hash !== hash) window.location.hash = hash;
}

function getInitialDocId() {
  const { docId, anchor } = parseHash();
  if (docId && state.docById.has(docId)) {
    state.pendingAnchor = anchor;
    return docId;
  }
  const starter = state.docs.find((doc) => doc.path === 'tutorials/courses/00-swift-compiler-first-contribution-track.md');
  if (starter) return starter.id;
  if (state.store.lastDocId && state.docById.has(state.store.lastDocId)) return state.store.lastDocId;
  return state.docs[0]?.id || null;
}

function getCurrentDoc() {
  return state.docById.get(state.currentDocId) || null;
}

function renderSpotlightStrip() {
  if (!el.spotlightStrip) return;
  const downloadDoc = state.docByPath.get('2026-04-10-swift-official-reference-downloads.md');
  if (!downloadDoc) {
    el.spotlightStrip.innerHTML = '';
    return;
  }

  el.spotlightStrip.innerHTML = `
    <section class="spotlight-card">
      <div class="spotlight-copy">
        <div class="spotlight-kicker">빠른 자료 접근</div>
        <h2>Swift 공식/준공식 참고 문서 다운로드</h2>
        <p>generics.pdf, TypeChecker, SIL, Compiler Architecture 등 정리된 다운로드 허브로 바로 이동합니다.</p>
        <div class="spotlight-actions">
          <button class="spotlight-button primary" type="button" data-spotlight-open="downloads">다운로드 허브 열기</button>
          <a class="spotlight-button" href="downloads/swift-docs-20260410-081300.zip" download>전체 ZIP 받기</a>
        </div>
      </div>
      <div class="spotlight-meta">
        <span class="badge">21개 파일</span>
        <span class="badge">ZIP + 개별 문서</span>
        <span class="badge">공식 링크 동봉</span>
      </div>
    </section>
  `;

  el.spotlightStrip.querySelector('[data-spotlight-open="downloads"]')?.addEventListener('click', () => {
    setCurrentDoc(downloadDoc.id);
  });
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
  state.currentHeadingId = anchor;
  state.store.lastDocId = docId;
  persistStore();
  updateHash(docId, anchor);
  renderSidebar();
  renderCurrentDoc();
}

function renderNavVisibility() {
  const mobile = window.innerWidth <= 980;
  el.floatingNavColumn.classList.toggle('open', mobile && state.navOpen);
  el.navToggle.setAttribute('aria-expanded', String(mobile ? state.navOpen : true));
  el.navToggle.textContent = mobile ? (state.navOpen ? '목차 닫기' : '목차 보기') : '목차 보기';
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
    button.addEventListener('click', () => {
      setCurrentDoc(button.dataset.docId);
      if (window.innerWidth <= 980) {
        state.navOpen = false;
        state.store.navOpen = false;
        persistStore();
        renderNavVisibility();
      }
    });
  });
}

function renderCurrentDoc() {
  const doc = getCurrentDoc();
  if (!doc) return;

  const badges = [badge(doc.categoryLabel), badge(`읽기 ${doc.readingMinutes}분`)];
  if (doc.trackLabel) badges.push(badge(doc.trackLabel));
  if (doc.stageGuess) badges.push(badge(doc.stageGuess));
  if (doc.difficulty) badges.push(badge(`난이도 ${doc.difficulty}`));

  el.docHeader.innerHTML = `
    <div class="doc-path">${escapeHtml(doc.path)}</div>
    <h2>${escapeHtml(doc.title)}</h2>
    <p class="doc-summary">${escapeHtml(doc.excerpt || '선택한 문서의 내용을 오른쪽에서 읽습니다.')}</p>
    <div class="doc-meta-row">${badges.join('')}</div>
  `;

  el.docContent.innerHTML = doc.html;
  el.notesArea.value = state.store.notes[doc.id] || '';

  bindDocLinkInterception(el.docContent);
  renderCurrentOutline(doc);
  handlePendingAnchor();
  updateCurrentHeadingFromScroll();
}

function getRenderableHeadings(doc) {
  return (doc.headings || []).filter((item) => {
    if (item.level === 2) return true;
    if (item.level === 3 && /^Step\s+\d+/.test(item.text)) return true;
    return false;
  });
}

function renderCurrentOutline(doc) {
  const headings = getRenderableHeadings(doc);
  if (!headings.length) {
    el.floatingOutlineList.innerHTML = '<div class="empty-state">이 문서에는 이동 가능한 목차가 없습니다.</div>';
    el.floatingCurrentSection.textContent = doc.title || '문서 상단';
    return;
  }
  state.currentHeadingId = headings[0].id;
  el.floatingOutlineList.innerHTML = headings
    .map((item) => `
      <button class="floating-outline-item level-${item.level}" type="button" data-heading-id="${item.id}">
        ${escapeHtml(item.text)}
      </button>
    `)
    .join('');
  el.floatingOutlineList.querySelectorAll('[data-heading-id]').forEach((button) => {
    button.addEventListener('click', () => {
      scrollToAnchor(button.dataset.headingId);
      if (window.innerWidth <= 980) {
        state.navOpen = false;
        state.store.navOpen = false;
        persistStore();
        renderNavVisibility();
      }
    });
  });
  syncCurrentOutlineActive();
  updateCurrentHeadingLabel(doc, headings);
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

function handlePendingAnchor() {
  if (!state.pendingAnchor) return;
  const anchor = state.pendingAnchor;
  state.pendingAnchor = null;
  requestAnimationFrame(() => scrollToAnchor(anchor));
}

function scrollToAnchor(anchor) {
  const target = el.docContent.querySelector(`#${cssEscape(anchor)}`);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  state.currentHeadingId = anchor;
  syncCurrentOutlineActive();
  updateCurrentHeadingFromScroll();
}

function updateCurrentHeadingFromScroll() {
  const doc = getCurrentDoc();
  if (!doc) return;
  const headings = getRenderableHeadings(doc);
  const rendered = headings
    .map((item) => ({ item, node: el.docContent.querySelector(`#${cssEscape(item.id)}`) }))
    .filter((entry) => entry.node);
  if (!rendered.length) {
    state.currentHeadingId = null;
    updateCurrentHeadingLabel(doc, headings);
    return;
  }

  let active = rendered[0].item.id;
  for (const entry of rendered) {
    if (entry.node.getBoundingClientRect().top <= 160) active = entry.item.id;
    else break;
  }
  if (state.currentHeadingId !== active) {
    state.currentHeadingId = active;
    syncCurrentOutlineActive();
  }
  updateCurrentHeadingLabel(doc, headings);
}

function syncCurrentOutlineActive() {
  el.floatingOutlineList.querySelectorAll('[data-heading-id]').forEach((button) => {
    button.classList.toggle('active', button.dataset.headingId === state.currentHeadingId);
  });
}

function updateCurrentHeadingLabel(doc, headings) {
  const current = headings.find((item) => item.id === state.currentHeadingId);
  el.floatingCurrentSection.textContent = current?.text || doc.title || '문서 상단';
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

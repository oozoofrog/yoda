const STORAGE_KEY = 'yoda-interactive-web-v2';
const DEFAULT_FILTER = 'all';
const DEFAULT_TRACK = 'all';
const DEFAULT_TAB = 'overview';
const DEFAULT_VIEW_MODE = 'track';
const DEFAULT_MASTERY = 'none';
const MASTERY_LEVELS = [
  { id: 'none', label: '미시작' },
  { id: 'read', label: '읽음' },
  { id: 'explain', label: '설명 가능' },
  { id: 'reproduce', label: '재현 가능' },
  { id: 'independent', label: '혼자 다시 찾기' },
];
const PRACTICE_STATES = [
  { id: 'todo', label: '미시작' },
  { id: 'trying', label: '시도 중' },
  { id: 'understood', label: '이해함' },
  { id: 'review', label: '다시 보기' },
];

const state = {
  docs: [],
  categories: [],
  tracks: [],
  docById: new Map(),
  docByPath: new Map(),
  currentDocId: null,
  currentFilter: DEFAULT_FILTER,
  currentTrack: DEFAULT_TRACK,
  currentTab: DEFAULT_TAB,
  search: '',
  sidebarMode: DEFAULT_VIEW_MODE,
  pendingAnchor: null,
  store: loadStore(),
};

const el = {
  searchInput: document.getElementById('searchInput'),
  trackChips: document.getElementById('trackChips'),
  filterChips: document.getElementById('filterChips'),
  docList: document.getElementById('docList'),
  docListCount: document.getElementById('docListCount'),
  todayReviewBox: document.getElementById('todayReviewBox'),
  docHero: document.getElementById('docHero'),
  docQuickStats: document.getElementById('docQuickStats'),
  masteryToolbar: document.getElementById('masteryToolbar'),
  tabbar: document.getElementById('tabbar'),
  overview: document.getElementById('panel-overview'),
  learn: document.getElementById('panel-learn'),
  practice: document.getElementById('panel-practice'),
  notes: document.getElementById('panel-notes'),
  globalProgress: document.getElementById('globalProgress'),
  consistencyBox: document.getElementById('consistencyBox'),
  completeToggle: document.getElementById('completeToggle'),
  docMetaSummary: document.getElementById('docMetaSummary'),
  nextDocBox: document.getElementById('nextDocBox'),
  sourceLinksBox: document.getElementById('sourceLinksBox'),
  themeToggle: document.getElementById('themeToggle'),
  viewModeToggle: document.getElementById('viewModeToggle'),
  toast: document.getElementById('toast'),
};

init().catch((error) => {
  console.error(error);
  el.learn.innerHTML = `<div class="empty-state">콘텐츠를 불러오지 못했습니다. ${escapeHtml(String(error))}</div>`;
});

async function init() {
  applyTheme();
  bindGlobalEvents();
  const response = await fetch('content.json');
  if (!response.ok) throw new Error(`content.json load failed: ${response.status}`);
  const payload = await response.json();
  state.docs = payload.docs || [];
  state.categories = payload.categories || [];
  state.tracks = payload.tracks || [];
  state.docs.forEach((doc) => {
    state.docById.set(doc.id, doc);
    state.docByPath.set(doc.path, doc);
  });
  state.sidebarMode = state.store.sidebarMode || DEFAULT_VIEW_MODE;
  state.currentTrack = state.store.currentTrack || DEFAULT_TRACK;
  state.currentDocId = getInitialDocId();
  renderAll();
}

function loadStore() {
  const base = {
    completed: {},
    completedAt: {},
    notes: {},
    answers: {},
    answerStates: {},
    courseChecks: {},
    taskChecks: {},
    mastery: {},
    reviews: {},
    activityByDate: {},
    theme: 'light',
    sidebarMode: DEFAULT_VIEW_MODE,
    currentTrack: DEFAULT_TRACK,
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...base, ...parsed };
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
    renderRightRail();
  });

  el.tabbar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    state.currentTab = button.dataset.tab;
    renderTabs();
  });

  el.completeToggle.addEventListener('click', () => {
    const doc = getCurrentDoc();
    if (!doc) return;
    toggleCompleted(doc);
    renderAllButLearn();
  });

  el.themeToggle.addEventListener('click', () => {
    state.store.theme = state.store.theme === 'dark' ? 'light' : 'dark';
    persistStore();
    applyTheme();
  });

  el.viewModeToggle.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view-mode]');
    if (!button) return;
    state.sidebarMode = button.dataset.viewMode;
    state.store.sidebarMode = state.sidebarMode;
    persistStore();
    renderViewMode();
    renderSidebar();
  });

  window.addEventListener('hashchange', () => {
    const hashState = parseHash();
    if (!hashState.docId) return;
    state.currentDocId = hashState.docId;
    state.pendingAnchor = hashState.anchor;
    renderCurrentDoc();
    renderSidebar();
  });
}

function renderAll() {
  renderViewMode();
  renderTrackChips();
  renderFilters();
  renderSidebar();
  renderCurrentDoc();
}

function renderAllButLearn() {
  renderViewMode();
  renderTrackChips();
  renderFilters();
  renderSidebar();
  renderHero(getCurrentDoc());
  renderQuickStats(getCurrentDoc());
  renderMasteryToolbar(getCurrentDoc());
  renderTabs();
  renderOverview(getCurrentDoc());
  renderPractice(getCurrentDoc());
  renderNotes(getCurrentDoc());
  renderRightRail();
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
  const nextHash = `#${params.toString()}`;
  if (window.location.hash === nextHash) return;
  window.location.hash = nextHash;
}

function getInitialDocId() {
  const hashState = parseHash();
  if (hashState.docId && state.docById.has(hashState.docId)) {
    state.pendingAnchor = hashState.anchor;
    return hashState.docId;
  }
  const first = state.docs.find((doc) => doc.path === 'README.md') || state.docs[0];
  return first?.id || null;
}

function getCurrentDoc() {
  return state.docById.get(state.currentDocId) || null;
}

function setCurrentDoc(docId, options = {}) {
  const { anchor = null, switchToLearn = false } = options;
  if (!state.docById.has(docId)) return;
  state.currentDocId = docId;
  state.pendingAnchor = anchor;
  if (switchToLearn) state.currentTab = 'learn';
  updateHash(docId, anchor);
  renderCurrentDoc();
  renderSidebar();
}

function getVisibleDocs() {
  return state.docs.filter((doc) => {
    const matchesFilter = state.currentFilter === 'all' || doc.category === state.currentFilter;
    const matchesTrack = state.currentTrack === 'all' || doc.track === state.currentTrack;
    const haystack = normalizeSearch(doc.searchText || '');
    const matchesSearch = !state.search || haystack.includes(state.search);
    return matchesFilter && matchesTrack && matchesSearch;
  });
}

function renderViewMode() {
  el.viewModeToggle.querySelectorAll('[data-view-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.viewMode === state.sidebarMode);
  });
}

function renderTrackChips() {
  const options = [{ id: 'all', label: '전체 트랙' }, ...state.tracks.map((track) => ({ id: track.id, label: track.label }))];
  el.trackChips.innerHTML = options
    .map((track) => `<button class="chip ${state.currentTrack === track.id ? 'active' : ''}" data-track="${track.id}" type="button">${escapeHtml(track.label)}</button>`)
    .join('');
  el.trackChips.querySelectorAll('[data-track]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentTrack = button.dataset.track;
      state.store.currentTrack = state.currentTrack;
      persistStore();
      renderTrackChips();
      renderSidebar();
      renderRightRail();
    });
  });
}

function renderFilters() {
  const options = [{ id: 'all', label: '전체' }, ...state.categories.map((c) => ({ id: c.id, label: c.label }))];
  el.filterChips.innerHTML = options
    .map((option) => `<button class="chip ${state.currentFilter === option.id ? 'active' : ''}" data-filter="${option.id}" type="button">${escapeHtml(option.label)}</button>`)
    .join('');
  el.filterChips.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentFilter = button.dataset.filter;
      renderFilters();
      renderSidebar();
      renderRightRail();
    });
  });
}

function renderSidebar() {
  renderTodayReview();
  const docs = getVisibleDocs();
  el.docListCount.textContent = `${docs.length}개`;
  if (!docs.length) {
    el.docList.innerHTML = '<div class="empty-state">조건에 맞는 문서가 없습니다.</div>';
    return;
  }

  const groupKey = state.sidebarMode === 'track' ? 'track' : 'category';
  const labelKey = state.sidebarMode === 'track' ? 'trackLabel' : 'categoryLabel';
  const grouped = new Map();
  docs.forEach((doc) => {
    const key = doc[groupKey];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(doc);
  });

  el.docList.innerHTML = [...grouped.entries()]
    .map(([key, items]) => {
      const done = items.filter((item) => state.store.completed[item.id]).length;
      const label = items[0]?.[labelKey] || key;
      return `
        <section class="doc-group">
          <div class="doc-group-title">${escapeHtml(label)}<span class="doc-group-progress">${done}/${items.length}</span></div>
          ${items.map(renderDocItem).join('')}
        </section>
      `;
    })
    .join('');

  el.docList.querySelectorAll('[data-doc-id]').forEach((button) => {
    button.addEventListener('click', () => setCurrentDoc(button.dataset.docId));
  });
}

function renderDocItem(doc) {
  const completed = !!state.store.completed[doc.id];
  const mastery = getMasteryLabel(doc.id);
  return `
    <button class="doc-item ${doc.id === state.currentDocId ? 'active' : ''}" data-doc-id="${doc.id}" type="button">
      <div class="doc-item-top">
        <div class="doc-item-title">${escapeHtml(doc.title)}</div>
        <span class="badge ${completed ? 'completed' : ''}">${completed ? '완료' : `${doc.readingMinutes}분`}</span>
      </div>
      <div class="doc-item-meta">
        <span class="badge">${escapeHtml(doc.categoryLabel)}</span>
        <span class="badge">${escapeHtml(doc.trackLabel)}</span>
        ${doc.questionCount ? `<span class="badge">질문 ${doc.questionCount}</span>` : ''}
      </div>
      <div class="doc-item-subline">숙련도: ${escapeHtml(mastery)} · 실습 ${doc.practiceCount || 0}개</div>
    </button>
  `;
}

function renderTodayReview() {
  const dueDocs = getDueReviewDocs().slice(0, 5);
  if (!dueDocs.length) {
    el.todayReviewBox.innerHTML = '<div class="empty-state">오늘 당장 복습할 문서는 없습니다. 완료한 문서가 1/3/7일 주기로 다시 올라옵니다.</div>';
    return;
  }
  el.todayReviewBox.innerHTML = dueDocs
    .map(({ doc, dueIn, stepLabel }) => `
      <div class="review-item">
        <div class="review-item-top">
          <div class="review-item-title">${escapeHtml(doc.title)}</div>
          <span class="review-badge warning">${escapeHtml(stepLabel)}</span>
        </div>
        <div class="review-item-meta">
          <span class="badge">${escapeHtml(doc.trackLabel)}</span>
          <span class="badge">${escapeHtml(doc.categoryLabel)}</span>
          <span class="badge">${dueIn}일 경과</span>
        </div>
        <div class="inline-actions" style="margin-top:10px;">
          <button class="ghost-button" data-open-review-doc="${doc.id}" type="button">열기</button>
          <button class="review-action" data-mark-reviewed="${doc.id}" type="button">복습 처리</button>
        </div>
      </div>
    `)
    .join('');
  el.todayReviewBox.querySelectorAll('[data-open-review-doc]').forEach((button) => {
    button.addEventListener('click', () => setCurrentDoc(button.dataset.openReviewDoc));
  });
  el.todayReviewBox.querySelectorAll('[data-mark-reviewed]').forEach((button) => {
    button.addEventListener('click', () => {
      const doc = state.docById.get(button.dataset.markReviewed);
      if (!doc) return;
      markReviewed(doc.id, doc.reviewAfterDays || []);
      showToast('복습 처리했습니다. 다음 주기에 다시 올라옵니다.');
      renderSidebar();
      renderRightRail();
    });
  });
}

function renderCurrentDoc() {
  const doc = getCurrentDoc();
  if (!doc) return;
  renderHero(doc);
  renderQuickStats(doc);
  renderMasteryToolbar(doc);
  renderTabs();
  renderOverview(doc);
  renderLearn(doc);
  renderPractice(doc);
  renderNotes(doc);
  renderRightRail();
  handlePendingAnchor();
}

function renderHero(doc) {
  const chips = [
    badge(doc.trackLabel),
    badge(doc.categoryLabel),
    badge(`읽기 ${doc.readingMinutes}분`),
    badge(`단어 ${doc.wordCount}`),
  ];
  if (doc.difficulty) chips.push(badge(`난이도 ${doc.difficulty}`));
  if (doc.stageGuess) chips.push(badge(doc.stageGuess));
  if (doc.issueNumber) chips.push(badge(`Issue #${doc.issueNumber}`));
  if (doc.mergedPr) chips.push(badge(`PR #${doc.mergedPr}`));
  (doc.concepts || []).slice(0, 3).forEach((concept) => chips.push(badge(concept)));
  el.docHero.innerHTML = `
    <div class="hero-eyebrow">${escapeHtml(doc.path)}</div>
    <h2>${escapeHtml(doc.title)}</h2>
    <p>${escapeHtml(doc.excerpt || '이 문서는 현재 학습 경로에서 선택된 자료입니다.')}</p>
    <div class="meta-chip-row">${chips.join('')}</div>
  `;
}

function renderQuickStats(doc) {
  const progress = getDocProgress(doc);
  const cards = [
    { strong: `${doc.questionCount || 0}`, label: '회상/분석 질문' },
    { strong: `${doc.practiceCount || 0}`, label: 'practice card' },
    { strong: `${progress.daysDone}/${progress.daysTotal}`, label: 'Day 체크' },
    { strong: `${progress.tasksDone}/${progress.tasksTotal}`, label: '실행 체크' },
  ];
  el.docQuickStats.innerHTML = cards
    .map((card) => `<div class="stat-card"><strong>${escapeHtml(card.strong)}</strong><span>${escapeHtml(card.label)}</span></div>`)
    .join('');
}

function renderMasteryToolbar(doc) {
  const current = state.store.mastery[doc.id] || DEFAULT_MASTERY;
  el.masteryToolbar.innerHTML = MASTERY_LEVELS.map(
    (level) => `<button class="mastery-button ${current === level.id ? 'active' : ''}" data-mastery="${level.id}" type="button">${escapeHtml(level.label)}</button>`,
  ).join('');
  el.masteryToolbar.querySelectorAll('[data-mastery]').forEach((button) => {
    button.addEventListener('click', () => {
      state.store.mastery[doc.id] = button.dataset.mastery;
      ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
      logActivity(doc.id, 'mastery');
      persistStore();
      renderMasteryToolbar(doc);
      renderSidebar();
      renderRightRail();
      showToast(`숙련도를 “${getMasteryLabel(doc.id)}”로 바꿨습니다.`);
    });
  });
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === state.currentTab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${state.currentTab}`);
  });
}

function renderOverview(doc) {
  const progress = getDocProgress(doc);
  const toc = doc.headings.filter((h) => h.level >= 2 && h.level <= 3);
  const bashBlocks = (doc.codeBlocks || []).filter((block) => /bash|sh|zsh/i.test(block.language));
  const relatedDocs = (doc.relatedDocs || []).map((path) => state.docByPath.get(path)).filter(Boolean);

  el.overview.innerHTML = `
    <div class="overview-grid">
      <section>
        <h3>무엇을 얻을 수 있나</h3>
        <p>${escapeHtml(doc.excerpt || '선택한 문서의 학습 목표와 개요를 확인하세요.')}</p>
        ${doc.whyItMatters ? `<p><strong>왜 중요한가:</strong> ${escapeHtml(doc.whyItMatters)}</p>` : ''}
        ${doc.prContextSummary ? `<p><strong>맥락:</strong> ${escapeHtml(doc.prContextSummary)}</p>` : ''}
      </section>

      <section>
        <h3>진행 상태</h3>
        <div class="prompt-list">
          <div class="stat-inline"><strong>숙련도</strong><span>${escapeHtml(getMasteryLabel(doc.id))}</span></div>
          <div class="stat-inline"><strong>질문 응답</strong><span>${progress.questionsAnswered}/${progress.questionsTotal}</span></div>
          <div class="stat-inline"><strong>실행 체크</strong><span>${progress.tasksDone}/${progress.tasksTotal}</span></div>
          <div class="stat-inline"><strong>Day 체크</strong><span>${progress.daysDone}/${progress.daysTotal}</span></div>
        </div>
      </section>

      ${doc.days?.length ? `
        <section>
          <h3>코스 진행 체크</h3>
          <div class="day-checklist">${doc.days.map((day, index) => renderDayCard(doc, day, index)).join('')}</div>
        </section>
      ` : ''}

      ${doc.repoTestCandidates?.length ? `
        <section>
          <h3>실제 repo 테스트 후보</h3>
          <div class="prompt-list">
            ${doc.repoTestCandidates.map((test) => `
              <div class="overview-card">
                <div class="inline-actions"><strong>${escapeHtml(test.path)}</strong><button class="copy-inline" type="button" data-copy="${escapeHtml(test.path)}">경로 복사</button></div>
                <div class="small-note">${escapeHtml(test.why || '')}</div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${relatedDocs.length ? `
        <section>
          <h3>함께 읽을 문서</h3>
          <div class="related-link-list">
            ${relatedDocs.slice(0, 6).map((related) => `
              <button class="doc-item" type="button" data-related-doc="${related.id}">
                <div class="doc-item-title">${escapeHtml(related.title)}</div>
                <div class="doc-item-subline">${escapeHtml(related.trackLabel)} · ${escapeHtml(related.categoryLabel)}</div>
              </button>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${toc.length ? `
        <section>
          <h3>목차</h3>
          <div class="prompt-list">
            ${toc.map((item) => `<button class="doc-item" type="button" data-scroll-target="${item.id}">${escapeHtml(item.text)}</button>`).join('')}
          </div>
        </section>
      ` : ''}

      ${bashBlocks.length ? `
        <section>
          <h3>빠른 명령</h3>
          <div class="command-list">${bashBlocks.map((block, index) => renderCommandCard(block.content, index)).join('')}</div>
        </section>
      ` : ''}
    </div>
  `;

  el.overview.querySelectorAll('[data-related-doc]').forEach((button) => {
    button.addEventListener('click', () => setCurrentDoc(button.dataset.relatedDoc));
  });
  bindDayCheckboxes(el.overview, doc);
  bindCopyButtons(el.overview);
  bindDocLinkInterception(el.overview);
}

function renderLearn(doc) {
  el.learn.innerHTML = doc.html;
  bindDocLinkInterception(el.learn);
  bindCopyButtons(el.learn);
}

function renderPractice(doc) {
  const cards = doc.practiceCards || [];
  if (!cards.length && !(doc.days || []).length) {
    el.practice.innerHTML = '<div class="empty-state">이 문서에는 추출된 practice 항목이 없습니다. 학습 탭을 읽고 노트 탭을 활용하세요.</div>';
    return;
  }

  const parts = ['<div class="question-block">'];
  if (doc.questionSections?.length) {
    parts.push('<section><h3>회상 / 자기설명</h3></section>');
  }

  cards.forEach((card, index) => {
    const taskKey = `${doc.id}::task::${card.type}::${index}`;
    const checked = !!state.store.taskChecks[taskKey];
    if (card.type === 'question') {
      const answerKey = `${doc.id}::answer::${index}`;
      const answer = state.store.answers[answerKey] || '';
      const status = state.store.answerStates[answerKey] || 'todo';
      parts.push(`
        <div class="practice-card">
          <div class="practice-card-header">
            <div>
              <div class="small-note">${escapeHtml(card.section)}</div>
              <h4>${escapeHtml(card.prompt)}</h4>
            </div>
          </div>
          <div class="status-pill-row">
            ${PRACTICE_STATES.map((item) => `<button class="status-pill ${status === item.id ? 'active' : ''}" type="button" data-answer-key="${answerKey}" data-answer-state="${item.id}">${escapeHtml(item.label)}</button>`).join('')}
          </div>
          <textarea class="answer-box" data-answer-key="${answerKey}" placeholder="내 설명, 가설, 반례, 다음 질문을 적습니다.">${escapeHtml(answer)}</textarea>
        </div>
      `);
      return;
    }

    if (card.type === 'command') {
      parts.push(renderTaskCard('재현 명령', card.content, taskKey, checked, '명령 복사'));
      return;
    }
    if (card.type === 'entry') {
      parts.push(renderTaskCard('첫 진입 파일', card.content, taskKey, checked, '경로 복사'));
      return;
    }
    if (card.type === 'repo_test') {
      parts.push(`
        <div class="practice-card">
          <div class="practice-card-header">
            <div>
              <div class="small-note">실제 repo 테스트 후보</div>
              <h4>${escapeHtml(card.label)}</h4>
            </div>
            <button class="copy-inline" type="button" data-copy="${escapeHtml(card.label)}">경로 복사</button>
          </div>
          <p>${escapeHtml(card.why || '')}</p>
          <label class="check-row"><input type="checkbox" data-task-key="${taskKey}" ${checked ? 'checked' : ''} /> 이 테스트를 직접 열어봤습니다.</label>
        </div>
      `);
      return;
    }
    if (card.type === 'primary_test') {
      parts.push(renderTaskCard('핵심 테스트', card.content, taskKey, checked, '경로 복사'));
    }
  });

  if (doc.days?.length) {
    parts.push('<section><h3>Day 체크</h3><div class="day-checklist">');
    doc.days.forEach((day, index) => parts.push(renderDayCard(doc, day, index)));
    parts.push('</div></section>');
  }
  parts.push('</div>');

  el.practice.innerHTML = parts.join('');
  el.practice.querySelectorAll('.answer-box').forEach((textarea) => {
    textarea.addEventListener('input', (event) => {
      const key = event.target.dataset.answerKey;
      state.store.answers[key] = event.target.value;
      ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
      logActivity(doc.id, 'answer');
      persistStore();
      renderRightRail();
    });
  });
  el.practice.querySelectorAll('[data-answer-state]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.answerKey;
      state.store.answerStates[key] = button.dataset.answerState;
      ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
      logActivity(doc.id, 'answer-state');
      persistStore();
      renderPractice(doc);
      renderRightRail();
    });
  });
  bindDayCheckboxes(el.practice, doc);
  bindTaskCheckboxes(el.practice, doc);
  bindCopyButtons(el.practice);
}

function renderTaskCard(title, content, taskKey, checked, copyLabel) {
  return `
    <div class="practice-card">
      <div class="practice-card-header">
        <div>
          <div class="small-note">${escapeHtml(title)}</div>
          <h4>${escapeHtml(firstLine(content))}</h4>
        </div>
        <button class="copy-inline" type="button" data-copy="${escapeHtml(content)}">${escapeHtml(copyLabel)}</button>
      </div>
      <pre><code>${escapeHtml(content)}</code></pre>
      <label class="check-row"><input type="checkbox" data-task-key="${taskKey}" ${checked ? 'checked' : ''} /> 이 항목을 직접 확인했습니다.</label>
    </div>
  `;
}

function renderNotes(doc) {
  const key = `${doc.id}::notes`;
  const note = state.store.notes[key] || '';
  el.notes.innerHTML = `
    <div class="notes-block">
      <p class="small-note">이 문서에 대한 내 요약, 막힌 점, 다음 세션 질문을 자유롭게 적습니다.</p>
      <div class="overview-card">
        <strong>추천 프롬프트</strong>
        <ul>
          <li>오늘 이 문서에서 가장 중요한 판단 기준은 무엇이었나?</li>
          <li>내가 틀리게 예상한 부분은 무엇이었나?</li>
          <li>다음 세션에서 바로 확인할 파일/테스트는 무엇인가?</li>
        </ul>
      </div>
      <textarea class="notes-textarea" id="docNotesArea">${escapeHtml(note)}</textarea>
    </div>
  `;
  const textarea = document.getElementById('docNotesArea');
  textarea.addEventListener('input', (event) => {
    state.store.notes[key] = event.target.value;
    ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
    logActivity(doc.id, 'notes');
    persistStore();
    renderRightRail();
  });
}

function renderDayCard(doc, day, index) {
  const key = `${doc.id}::day::${index}`;
  const checked = !!state.store.courseChecks[key];
  return `
    <label class="day-card">
      <div class="inline-actions">
        <input type="checkbox" data-day-key="${key}" ${checked ? 'checked' : ''} />
        <strong>${escapeHtml(day)}</strong>
      </div>
    </label>
  `;
}

function bindDayCheckboxes(root, doc) {
  root.querySelectorAll('[data-day-key]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      state.store.courseChecks[event.target.dataset.dayKey] = event.target.checked;
      ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
      logActivity(doc.id, 'day-check');
      persistStore();
      renderRightRail();
      renderOverview(doc);
    });
  });
}

function bindTaskCheckboxes(root, doc) {
  root.querySelectorAll('[data-task-key]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      state.store.taskChecks[event.target.dataset.taskKey] = event.target.checked;
      ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
      logActivity(doc.id, 'task-check');
      persistStore();
      renderRightRail();
    });
  });
}

function renderCommandCard(content, index) {
  return `
    <div class="command-card">
      <div class="inline-actions">
        <span class="badge">명령 ${index + 1}</span>
        <button class="copy-inline" type="button" data-copy="${escapeHtml(content)}">복사</button>
      </div>
      <pre><code>${escapeHtml(content)}</code></pre>
    </div>
  `;
}

function renderRightRail() {
  const docs = getVisibleDocs();
  const completed = docs.filter((doc) => state.store.completed[doc.id]).length;
  const percent = docs.length ? Math.round((completed / docs.length) * 100) : 0;
  const masteryReached = docs.filter((doc) => (state.store.mastery[doc.id] || DEFAULT_MASTERY) !== DEFAULT_MASTERY).length;
  el.globalProgress.innerHTML = `
    <div><strong>${completed}</strong> / ${docs.length} 완료</div>
    <div class="progress-meter"><div class="progress-meter-fill" style="width:${percent}%"></div></div>
    <div class="small-note">현재 필터 기준 완료율 ${percent}% · 숙련도 표시 ${masteryReached}개</div>
  `;

  renderConsistencyBox();

  const doc = getCurrentDoc();
  if (!doc) return;
  const progress = getDocProgress(doc);
  const noteKey = `${doc.id}::notes`;
  el.docMetaSummary.innerHTML = `
    <div><strong>트랙</strong>: ${escapeHtml(doc.trackLabel)}</div>
    <div><strong>유형</strong>: ${escapeHtml(doc.categoryLabel)}</div>
    <div><strong>읽기 시간</strong>: 약 ${doc.readingMinutes}분</div>
    <div><strong>질문 응답</strong>: ${progress.questionsAnswered}/${progress.questionsTotal}</div>
    <div><strong>실행 체크</strong>: ${progress.tasksDone}/${progress.tasksTotal}</div>
    <div><strong>Day 체크</strong>: ${progress.daysDone}/${progress.daysTotal}</div>
    <div><strong>노트</strong>: ${state.store.notes[noteKey] ? '작성됨' : '비어 있음'}</div>
    <div><strong>숙련도</strong>: ${escapeHtml(getMasteryLabel(doc.id))}</div>
  `;

  const next = getNextDoc(doc);
  el.nextDocBox.innerHTML = next ? `
    <div class="next-title">${escapeHtml(next.title)}</div>
    <div class="small-note">${escapeHtml(next.trackLabel)} · ${escapeHtml(next.categoryLabel)} · ${next.readingMinutes}분</div>
    <button class="primary-button" type="button" id="nextDocButton">다음으로 이동</button>
  ` : '<div class="small-note">현재 문맥에서 추천할 다음 문서가 없습니다.</div>';
  document.getElementById('nextDocButton')?.addEventListener('click', () => setCurrentDoc(next.id));

  const sourceLinks = doc.sourceLinks || [];
  el.sourceLinksBox.innerHTML = sourceLinks.length
    ? sourceLinks.map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join('')
    : '<div class="small-note">이 문서에 연결된 외부 원문 링크가 없습니다.</div>';

  el.completeToggle.textContent = state.store.completed[doc.id] ? '완료 해제' : '완료로 표시';
}

function renderConsistencyBox() {
  const activityDays = getRecentActivityDays(7);
  const streak = getActivityStreak();
  const dueCount = getDueReviewDocs().length;
  el.consistencyBox.innerHTML = `
    <div><strong>최근 7일</strong>: ${activityDays}일 학습</div>
    <div><strong>streak-lite</strong>: ${streak}일 연속</div>
    <div><strong>복습 대기</strong>: ${dueCount}개 문서</div>
    <div class="progress-meter"><div class="progress-meter-fill" style="width:${Math.round((activityDays / 7) * 100)}%"></div></div>
    <div class="small-note">하루 1문서만 완료해도 됩니다. 핵심은 많이 읽는 것이 아니라 계속 돌아오는 것입니다.</div>
  `;
}

function getNextDoc(doc) {
  if (!doc) return null;
  const related = (doc.relatedDocs || []).map((path) => state.docByPath.get(path)).filter(Boolean);
  const candidateFromRelated = related.find((item) => !state.store.completed[item.id]) || related[0];
  if (candidateFromRelated) return candidateFromRelated;

  const sameTrack = state.docs.filter((item) => item.track === doc.track).sort((a, b) => a.order - b.order);
  const currentIndex = sameTrack.findIndex((item) => item.id === doc.id);
  if (currentIndex >= 0 && currentIndex < sameTrack.length - 1) return sameTrack[currentIndex + 1];

  const visible = getVisibleDocs();
  const visibleIndex = visible.findIndex((item) => item.id === doc.id);
  if (visibleIndex >= 0 && visibleIndex < visible.length - 1) return visible[visibleIndex + 1];
  return null;
}

function toggleCompleted(doc) {
  const currentlyCompleted = !!state.store.completed[doc.id];
  state.store.completed[doc.id] = !currentlyCompleted;
  if (state.store.completed[doc.id]) {
    state.store.completedAt[doc.id] = todayString();
    ensureReviewAnchor(doc.id, doc.reviewAfterDays || []);
    logActivity(doc.id, 'completed');
    showToast('완료로 표시했습니다. 1/3/7일 복습 큐에 들어갑니다.');
  } else {
    delete state.store.completedAt[doc.id];
    delete state.store.reviews[doc.id];
    showToast('완료 표시를 해제했습니다.');
  }
  persistStore();
}

function ensureReviewAnchor(docId, reviewAfterDays) {
  if (!reviewAfterDays?.length) return;
  if (!state.store.reviews[docId]) {
    state.store.reviews[docId] = { anchor: todayString(), step: 0 };
  }
}

function markReviewed(docId, reviewAfterDays) {
  if (!reviewAfterDays?.length) return;
  const review = state.store.reviews[docId] || { anchor: todayString(), step: 0 };
  review.anchor = todayString();
  review.step = Math.min((review.step || 0) + 1, reviewAfterDays.length);
  state.store.reviews[docId] = review;
  logActivity(docId, 'review');
  persistStore();
}

function getDueReviewDocs() {
  const today = todayString();
  return state.docs
    .map((doc) => {
      const schedule = doc.reviewAfterDays || [];
      const review = state.store.reviews[doc.id];
      if (!schedule.length || !review || review.step >= schedule.length) return null;
      if (!isDocStarted(doc)) return null;
      const dueIn = daysBetween(review.anchor, today);
      const target = schedule[review.step];
      if (dueIn < target) return null;
      return { doc, dueIn, stepLabel: `${target}일 복습` };
    })
    .filter(Boolean)
    .sort((a, b) => b.dueIn - a.dueIn);
}

function isDocStarted(doc) {
  if (state.store.completed[doc.id]) return true;
  if ((state.store.mastery[doc.id] || DEFAULT_MASTERY) !== DEFAULT_MASTERY) return true;
  if (state.store.notes[`${doc.id}::notes`]?.trim()) return true;
  if (Object.keys(state.store.answers).some((key) => key.startsWith(`${doc.id}::answer::`) && state.store.answers[key]?.trim())) return true;
  if (Object.keys(state.store.courseChecks).some((key) => key.startsWith(`${doc.id}::day::`) && state.store.courseChecks[key])) return true;
  if (Object.keys(state.store.taskChecks).some((key) => key.startsWith(`${doc.id}::task::`) && state.store.taskChecks[key])) return true;
  return false;
}

function getDocProgress(doc) {
  const questionKeys = Object.keys(state.store.answers).filter((key) => key.startsWith(`${doc.id}::answer::`) && state.store.answers[key]?.trim());
  const dayKeys = Object.keys(state.store.courseChecks).filter((key) => key.startsWith(`${doc.id}::day::`) && state.store.courseChecks[key]);
  const taskKeys = Object.keys(state.store.taskChecks).filter((key) => key.startsWith(`${doc.id}::task::`) && state.store.taskChecks[key]);
  return {
    questionsAnswered: questionKeys.length,
    questionsTotal: doc.questionCount || 0,
    daysDone: dayKeys.length,
    daysTotal: doc.days?.length || 0,
    tasksDone: taskKeys.length,
    tasksTotal: (doc.practiceCards || []).filter((item) => item.type !== 'question').length,
  };
}

function handlePendingAnchor() {
  if (!state.pendingAnchor) return;
  const anchor = state.pendingAnchor;
  state.pendingAnchor = null;
  state.currentTab = 'learn';
  renderTabs();
  requestAnimationFrame(() => scrollToLearnAnchor(anchor));
}

function scrollToLearnAnchor(anchor) {
  const target = el.learn.querySelector(`#${cssEscape(anchor)}`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function bindDocLinkInterception(root) {
  root.querySelectorAll('[data-doc-href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = state.docByPath.get(link.dataset.docHref);
      if (!target) return;
      setCurrentDoc(target.id, { anchor: link.dataset.docAnchor || null, switchToLearn: true });
    });
  });
  root.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      state.currentTab = 'learn';
      renderTabs();
      requestAnimationFrame(() => scrollToLearnAnchor(button.dataset.scrollTarget));
    });
  });
}

function bindCopyButtons(root) {
  root.querySelectorAll('.copy-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.parentElement?.querySelector('code')?.textContent || '';
      await navigator.clipboard.writeText(code);
      showToast('코드를 복사했습니다.');
    });
  });
  root.querySelectorAll('.copy-inline').forEach((button) => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copy || '');
      showToast('내용을 복사했습니다.');
    });
  });
}

function logActivity(docId, _action) {
  const today = todayString();
  state.store.activityByDate[today] = (state.store.activityByDate[today] || 0) + 1;
}

function getRecentActivityDays(windowDays) {
  const dates = Object.keys(state.store.activityByDate || {});
  if (!dates.length) return 0;
  const today = new Date();
  let count = 0;
  for (let i = 0; i < windowDays; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (state.store.activityByDate[isoDate(date)]) count += 1;
  }
  return count;
}

function getActivityStreak() {
  let streak = 0;
  const today = new Date();
  while (true) {
    const date = new Date(today);
    date.setDate(today.getDate() - streak);
    if (!state.store.activityByDate[isoDate(date)]) break;
    streak += 1;
  }
  return streak;
}

function todayString() {
  return isoDate(new Date());
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24));
}

function getMasteryLabel(docId) {
  const found = MASTERY_LEVELS.find((item) => item.id === (state.store.mastery[docId] || DEFAULT_MASTERY));
  return found?.label || '미시작';
}

function firstLine(text) {
  return String(text || '').split('\n')[0];
}

function badge(text) {
  return `<span class="badge">${escapeHtml(text)}</span>`;
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.toast.classList.remove('show'), 1800);
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

function normalizeSearch(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9가-힣]+/g, ' ')
    .toLowerCase()
    .trim();
}

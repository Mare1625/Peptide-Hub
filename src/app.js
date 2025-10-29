import { peptides, stackProtocols } from './data/peptides.js';

const storageKey = 'peptideHub.v1';

const state = {
  activeTab: 'library',
  searchQuery: '',
  focusFilter: 'all',
  stackFilter: 'all',
  savedStacks: [],
  savedPlans: [],
  pro: false,
};

const elements = {
  tabs: document.querySelectorAll('.tab-nav__item'),
  panels: document.querySelectorAll('.tab-panel'),
  heroUpgrade: document.getElementById('cta-upgrade'),
  learnUpgrade: document.getElementById('learn-upgrade'),
  learnCta: document.getElementById('cta-learn'),
  librarySearch: document.getElementById('library-search'),
  libraryFilter: document.getElementById('library-filter'),
  libraryGrid: document.getElementById('library-grid'),
  aiButton: document.getElementById('ai-search-button'),
  aiResponse: document.getElementById('ai-response'),
  stackFilter: document.getElementById('stack-filter'),
  stackGrid: document.getElementById('stack-grid'),
  savedStacks: document.getElementById('saved-stacks'),
  savedStacksList: document.getElementById('saved-stacks-list'),
  membershipPill: document.getElementById('membership-pill'),
  calcForm: document.getElementById('calc-form'),
  vialAmount: document.getElementById('vial-amount'),
  vialAmountOutput: document.getElementById('vial-amount-output'),
  reconVolume: document.getElementById('reconstitution-volume'),
  reconOutput: document.getElementById('reconstitution-output'),
  desiredDose: document.getElementById('desired-dose'),
  desiredDoseOutput: document.getElementById('desired-dose-output'),
  frequency: document.getElementById('weekly-frequency'),
  frequencyOutput: document.getElementById('frequency-output'),
  calcResults: document.getElementById('calc-results'),
  resultVolume: document.getElementById('result-volume'),
  resultFrequency: document.getElementById('result-frequency'),
  resetCalculator: document.getElementById('reset-calculator'),
  savePlan: document.getElementById('save-plan'),
  sharePlan: document.getElementById('share-plan'),
  savedPlans: document.getElementById('saved-plans'),
  savedPlansList: document.getElementById('saved-plans-list'),
  modal: document.getElementById('peptide-modal'),
  modalContent: document.getElementById('modal-content'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modalClose: document.getElementById('modal-close'),
};

const categoryIcons = new Map([
  ['Metabolic & Weight Management', '🔥'],
  ['Cardiometabolic & Vascular', '🫀'],
  ['Immune & Inflammatory Modulation', '🛡️'],
  ['Recovery & Tissue Support', '🧬'],
  ['Cognitive & Mood Optimization', '🧠'],
  ['Longevity & Cellular Health', '⏳'],
  ['Performance & Strength', '⚡'],
]);

const keywordRecommendations = [
  {
    keywords: ['fat loss', 'weight', 'lean'],
    tags: ['metabolic rate elevation', 'lipolysis', 'appetite control'],
    stacks: ['Metabolic Reset Phase'],
    note: 'Blend metabolic drivers (MOTS-c, GLP-1 analogs) with AOD 9604 for AM fat mobilization. Layer resistance training and protein for recomposition.',
  },
  {
    keywords: ['sleep', 'recovery', 'rest'],
    tags: ['sleep quality', 'recovery'],
    stacks: ['Longevity Core Cycle'],
    note: 'Pair regenerative peptides like Epitalon or DSIP with sleep hygiene anchors and blue-light cutoffs.',
  },
  {
    keywords: ['injury', 'tissue', 'healing'],
    tags: ['connective tissue'],
    stacks: ['Advanced Athletic Recovery'],
    note: 'Focus on localized peptides (BPC-157, TB-500) plus mechanical loading progression to rebuild collagen sequencing.',
  },
  {
    keywords: ['focus', 'brain', 'cognitive', 'memory'],
    tags: ['nootropic'],
    stacks: ['Cognitive Clarity Stack'],
    note: 'Nasal nootropics like Semax/Selank with oral Dihexa and movement snacks to sustain neuroplasticity.',
  },
];

init();

function init() {
  hydrateState();
  bindNavigation();
  populateFilters();
  bindLibrary();
  bindStacks();
  bindCalculator();
  bindModal();
  bindUpsells();
  renderLibrary();
  renderStacks();
  renderSavedStacks();
  renderSavedPlans();
}

function hydrateState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.savedStacks = saved.savedStacks ?? [];
    state.savedPlans = saved.savedPlans ?? [];
    state.pro = saved.pro ?? false;
    if (state.pro) {
      elements.membershipPill.textContent = 'Pro activated';
      elements.membershipPill.classList.add('badge');
    }
  } catch (error) {
    console.warn('Unable to hydrate state', error);
  }
}

function persistState() {
  const payload = {
    savedStacks: state.savedStacks,
    savedPlans: state.savedPlans,
    pro: state.pro,
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist', error);
  }
}

function bindNavigation() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });
}

function setActiveTab(tabId) {
  if (state.activeTab === tabId) return;
  state.activeTab = tabId;
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
  elements.panels.forEach((panel) => {
    const isActive = panel.id === `tab-${tabId}`;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
    if (isActive) {
      panel.animate(
        [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
  });
}

function populateFilters() {
  const focuses = new Set(peptides.map((p) => p.focus));
  const focusOptions = ['<option value="all">All focuses</option>']
    .concat(Array.from(focuses).sort().map((focus) => `<option value="${focus}">${focus}</option>`))
    .join('');
  elements.libraryFilter.innerHTML = focusOptions;

  const goals = new Set(stackProtocols.map((stack) => extractGoalTag(stack.goal)));
  const stackOptions = ['<option value="all">All goals</option>']
    .concat(Array.from(goals).sort().map((goal) => `<option value="${goal}">${goal}</option>`))
    .join('');
  elements.stackFilter.innerHTML = stackOptions;
}

function bindLibrary() {
  elements.librarySearch.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderLibrary();
    clearAiResponse();
  });

  elements.libraryFilter.addEventListener('change', (event) => {
    state.focusFilter = event.target.value;
    renderLibrary();
  });

  elements.aiButton.addEventListener('click', () => {
    const query = elements.librarySearch.value.trim();
    if (!query) {
      revealAiMessage('Try asking for a goal, e.g. “best peptides for recovery”.');
      return;
    }
    const result = generateAiSuggestion(query);
    renderAiResponse(result);
  });
}

function bindStacks() {
  elements.stackFilter.addEventListener('change', (event) => {
    state.stackFilter = event.target.value;
    renderStacks();
  });
}

function bindCalculator() {
  const sliderMap = [
    [elements.vialAmount, elements.vialAmountOutput, formatNumber],
    [elements.reconVolume, elements.reconOutput, formatNumber],
    [elements.desiredDose, elements.desiredDoseOutput, formatNumber],
    [elements.frequency, elements.frequencyOutput, (value) => value],
  ];

  sliderMap.forEach(([input, output, formatter]) => {
    input.addEventListener('input', () => {
      output.textContent = formatter(Number(input.value));
    });
  });

  elements.calcForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const results = calculateDose();
    elements.resultVolume.textContent = `${formatNumber(results.volumeMl, 2)} mL`;
    elements.resultFrequency.textContent = `${results.frequency} doses/week`;
    elements.calcResults.hidden = false;
  });

  elements.resetCalculator.addEventListener('click', () => {
    elements.calcForm.reset();
    elements.vialAmount.value = 5;
    elements.vialAmount.dispatchEvent(new Event('input'));
    elements.reconVolume.value = 2.5;
    elements.reconVolume.dispatchEvent(new Event('input'));
    elements.desiredDose.value = 1;
    elements.desiredDose.dispatchEvent(new Event('input'));
    elements.frequency.value = 3;
    elements.frequency.dispatchEvent(new Event('input'));
    elements.calcResults.hidden = true;
  });

  elements.savePlan.addEventListener('click', () => {
    if (elements.calcResults.hidden) return;
    const entry = {
      id: `plan-${Date.now()}`,
      vialAmount: Number(elements.vialAmount.value),
      reconVolume: Number(elements.reconVolume.value),
      desiredDose: Number(elements.desiredDose.value),
      frequency: Number(elements.frequency.value),
      volumeMl: elements.resultVolume.textContent,
      createdAt: new Date().toISOString(),
    };
    state.savedPlans = [entry, ...state.savedPlans].slice(0, 6);
    persistState();
    renderSavedPlans();
  });

  elements.sharePlan.addEventListener('click', () => {
    if (elements.calcResults.hidden) return;
    exportPlan();
  });
}

function bindModal() {
  elements.modalClose.addEventListener('click', closeModal);
  elements.modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

function bindUpsells() {
  const upgradeHandler = () => {
    state.pro = true;
    persistState();
    elements.membershipPill.textContent = 'Pro activated';
    elements.membershipPill.classList.add('badge');
    revealAiMessage('Pro mode toggled. Expect Supabase sync & advanced exports in production builds.');
  };

  elements.heroUpgrade?.addEventListener('click', upgradeHandler);
  elements.learnUpgrade?.addEventListener('click', upgradeHandler);
  elements.learnCta?.addEventListener('click', () => setActiveTab('learn'));
}

function renderLibrary() {
  const query = state.searchQuery.toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  const filtered = peptides.filter((peptide) => {
    if (state.focusFilter !== 'all' && peptide.focus !== state.focusFilter) {
      return false;
    }
    if (tokens.length === 0) return true;
    const haystack = [
      peptide.name,
      peptide.description,
      peptide.focus,
      peptide.category,
      (peptide.keyBenefits || []).join(' '),
      (peptide.tags || []).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });

  if (filtered.length === 0) {
    elements.libraryGrid.innerHTML = `
      <div class="empty-state">
        <p>No peptides match that criteria yet. Try a different goal or keyword.</p>
      </div>`;
    return;
  }

  const cards = filtered
    .slice(0, 60)
    .map((peptide) => {
      const icon = categoryIcons.get(peptide.category) ?? '🧪';
      const summary = buildSummary(peptide);
      return `
        <article class="peptide-card" data-id="${peptide.id}">
          <div class="peptide-card__header">
            <h3 class="peptide-card__title">${icon} ${peptide.name}</h3>
            <span class="peptide-chip">${peptide.category}</span>
          </div>
          <p>${summary.effect}</p>
          <div class="peptide-meta">
            <span>🎯 ${summary.focus}</span>
            <span>🕒 ${summary.cycle}</span>
            <span>💉 ${summary.dose}</span>
          </div>
          <button class="quick-facts-button" data-action="quick-facts">Quick facts</button>
        </article>
      `;
    })
    .join('');

  elements.libraryGrid.innerHTML = cards;
  elements.libraryGrid.querySelectorAll('[data-action="quick-facts"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const card = event.currentTarget.closest('.peptide-card');
      const peptide = peptides.find((item) => item.id === card.dataset.id);
      openPeptideModal(peptide);
    });
  });
}

function buildSummary(peptide) {
  const effect = peptide.description?.split('. ')[0] ?? peptide.mechanism;
  const cycle = deriveCycle(peptide.dosing?.loading ?? '12-week cycle');
  const dose = deriveDoseRange(peptide);
  return {
    effect: effect ?? 'Effect data unavailable.',
    focus: peptide.focus ?? 'General support',
    cycle,
    dose,
  };
}

function deriveCycle(loadingText) {
  if (!loadingText) return '12-week cadence';
  const match = loadingText.match(/(\d+\s?(?:week|weeks|day|days))/i);
  return match ? `${match[0]} cadence` : '12-week cadence';
}

function deriveDoseRange(peptide) {
  const doseFields = [peptide.dosing?.loading, peptide.dosing?.maintenance]
    .filter(Boolean)
    .map((text) => text.replace(/\bfor\b.+/i, '').trim());
  return doseFields.length ? doseFields.join(' • ') : 'Refer to protocol';
}

function openPeptideModal(peptide) {
  if (!peptide) return;
  const stacks = stackProtocols.filter((stack) =>
    stack.peptides.some((item) => item.name.toLowerCase() === peptide.name.toLowerCase())
  );
  const summary = buildSummary(peptide);
  elements.modalContent.innerHTML = `
    <header>
      <h2>${peptide.name}</h2>
      <p class="badge">${peptide.category}</p>
    </header>
    <section class="quick-meta">
      <span>✨ Effect: ${summary.effect}</span>
      <span>🧭 How to use: ${peptide.dosing?.timing ?? 'Follow practitioner timing.'}</span>
      <span>📊 Dose range: ${summary.dose}</span>
      <span>🔁 Stack compatibility: ${
        stacks.length ? stacks.map((stack) => stack.name).join(', ') : 'Pair with recovery or metabolic basics'
      }</span>
    </section>
    <section>
      <h3>Protocol notes</h3>
      <ul class="modal__quick-list">
        ${(peptide.keyBenefits || []).slice(0, 3).map((benefit) => `<li>${benefit}</li>`).join('')}
      </ul>
    </section>
    <section>
      <h3>Safety</h3>
      <p>${peptide.safetyNotes ?? 'Consult clinical supervision before initiating.'}</p>
    </section>
  `;
  elements.modal.hidden = false;
  elements.modalContent.scrollTop = 0;
}

function closeModal() {
  elements.modal.hidden = true;
}

function renderStacks() {
  const filtered = stackProtocols.filter((stack) => {
    if (state.stackFilter === 'all') return true;
    return extractGoalTag(stack.goal) === state.stackFilter;
  });

  if (filtered.length === 0) {
    elements.stackGrid.innerHTML = '<p class="empty-state">No stacks match that filter yet.</p>';
    return;
  }

  const cards = filtered
    .map((stack) => {
      const isProOnly = stack.tier === 'pro';
      const isLocked = isProOnly && !state.pro;
      const goalTag = extractGoalTag(stack.goal);
      const peptidesList = stack.peptides
        .map((item) => `<li><strong>${item.name}</strong> — ${item.dose} (${item.timing})</li>`)
        .join('');
      const schedule = stack.schedule
        .map((item) => `<li><strong>${item.day}:</strong> ${item.instructions}</li>`)
        .join('');
      return `
        <article class="stack-card" data-id="${stack.id}">
          <div class="stack-card__header">
            <h3>${stack.name}</h3>
            <span class="stack-card__goal">${goalTag}</span>
          </div>
          <p>${stack.overview}</p>
          <section>
            <h4>Protocol</h4>
            <ul>${peptidesList}</ul>
          </section>
          <section>
            <h4>Weekly rhythm</h4>
            <ul>${schedule}</ul>
          </section>
          <p><strong>Mix:</strong> ${stack.reconstitution?.instructions ?? 'Follow pharmacy guidance.'}</p>
          <div class="stack-actions">
            <button class="button button--primary" data-action="save" ${isLocked ? 'disabled' : ''}>
              ${isLocked ? 'Pro required' : 'Save stack'}
            </button>
            <button class="button button--ghost" data-action="share">Share as PDF</button>
          </div>
        </article>
      `;
    })
    .join('');

  elements.stackGrid.innerHTML = cards;
  elements.stackGrid.querySelectorAll('article').forEach((card) => {
    const stack = stackProtocols.find((item) => item.id === card.dataset.id);
    card.querySelector('[data-action="save"]').addEventListener('click', () => saveStack(stack));
    card.querySelector('[data-action="share"]').addEventListener('click', () => shareStack(stack));
  });
}

function saveStack(stack) {
  if (!stack) return;
  if (stack.tier === 'pro' && !state.pro) {
    revealAiMessage('Pro members can save this stack. Activate Pro to continue.');
    return;
  }
  const exists = state.savedStacks.some((item) => item.id === stack.id);
  if (exists) return;
  state.savedStacks = [
    { id: stack.id, name: stack.name, goal: extractGoalTag(stack.goal), savedAt: new Date().toISOString() },
    ...state.savedStacks,
  ].slice(0, 6);
  persistState();
  renderSavedStacks();
}

function renderSavedStacks() {
  if (state.savedStacks.length === 0) {
    elements.savedStacks.hidden = true;
    return;
  }
  elements.savedStacks.hidden = false;
  elements.savedStacksList.innerHTML = state.savedStacks
    .map(
      (item) => `
        <li>
          <div>
            <strong>${item.name}</strong>
            <span style="display:block;color:var(--text-muted);font-size:0.85rem;">${item.goal}</span>
          </div>
          <button data-id="${item.id}">Remove</button>
        </li>
      `
    )
    .join('');

  elements.savedStacksList.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.savedStacks = state.savedStacks.filter((stack) => stack.id !== button.dataset.id);
      persistState();
      renderSavedStacks();
    });
  });
}

function renderSavedPlans() {
  if (state.savedPlans.length === 0) {
    elements.savedPlans.hidden = true;
    return;
  }
  elements.savedPlans.hidden = false;
  elements.savedPlansList.innerHTML = state.savedPlans
    .map((plan) => `
      <li>
        <div>
          <strong>${plan.volumeMl}</strong>
          <span style="display:block;color:var(--text-muted);font-size:0.85rem;">${plan.frequency}x weekly • ${formatTimestamp(
      plan.createdAt
    )}</span>
        </div>
        <button data-id="${plan.id}">Remove</button>
      </li>
    `)
    .join('');

  elements.savedPlansList.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.savedPlans = state.savedPlans.filter((plan) => plan.id !== button.dataset.id);
      persistState();
      renderSavedPlans();
    });
  });
}

function calculateDose() {
  const vialAmount = Number(elements.vialAmount.value);
  const reconVolume = Number(elements.reconVolume.value);
  const desiredDose = Number(elements.desiredDose.value);
  const frequency = Number(elements.frequency.value);
  const volumeMl = (desiredDose / vialAmount) * reconVolume;
  return {
    volumeMl,
    frequency,
  };
}

function exportPlan() {
  const html = `
    <html>
      <head>
        <title>Peptide Plan</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 24px; }
          ul { padding-left: 18px; }
        </style>
      </head>
      <body>
        <h1>Peptide dosing snapshot</h1>
        <p><strong>Injection volume:</strong> ${elements.resultVolume.textContent}</p>
        <p><strong>Doses per week:</strong> ${elements.resultFrequency.textContent}</p>
        <ul>
          <li>Vial amount: ${elements.vialAmount.value} mg</li>
          <li>Reconstitution volume: ${elements.reconVolume.value} mL</li>
          <li>Desired dose: ${elements.desiredDose.value} mg</li>
          <li>Frequency: ${elements.frequency.value}x weekly</li>
        </ul>
        <p><em>Educational reference only – confirm with a licensed medical professional.</em></p>
      </body>
    </html>
  `;
  const popup = window.open('', '_blank', 'width=600,height=780');
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.print();
}

function shareStack(stack) {
  if (!stack) return;
  const html = `
    <html>
      <head>
        <title>${stack.name} – PeptideIQ</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 26px; }
          h2 { font-size: 18px; margin-top: 24px; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <h1>${stack.name}</h1>
        <p><strong>Goal:</strong> ${stack.goal}</p>
        <p>${stack.overview}</p>
        <h2>Protocol</h2>
        <ul>
          ${stack.peptides.map((item) => `<li>${item.name} – ${item.dose} (${item.timing})</li>`).join('')}
        </ul>
        <h2>Weekly rhythm</h2>
        <ul>
          ${stack.schedule.map((item) => `<li>${item.day}: ${item.instructions}</li>`).join('')}
        </ul>
        <h2>Mixing</h2>
        <p>${stack.reconstitution?.instructions ?? 'Follow sterile technique guidance.'}</p>
        <p><em>Educational reference only. Verify dosing with clinical supervision.</em></p>
      </body>
    </html>
  `;
  const popup = window.open('', '_blank', 'width=700,height=900');
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.print();
}

function clearAiResponse() {
  elements.aiResponse.hidden = true;
  elements.aiResponse.textContent = '';
}

function revealAiMessage(message) {
  elements.aiResponse.hidden = false;
  elements.aiResponse.textContent = message;
}

function generateAiSuggestion(query) {
  const lower = query.toLowerCase();
  const matched = keywordRecommendations.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );
  if (!matched) {
    const fallback = peptides
      .filter((peptide) => peptide.name.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((peptide) => peptide.name)
      .join(', ');
    return {
      summary: fallback ? `Consider exploring: ${fallback}.` : 'Try refining your query with a specific goal.',
    };
  }

  const recommendedPeptides = peptides
    .filter((peptide) =>
      (peptide.tags || []).some((tag) => matched.tags.some((keyword) => tag.toLowerCase().includes(keyword)))
    )
    .slice(0, 5)
    .map((peptide) => peptide.name);

  return {
    summary: matched.note,
    peptides: recommendedPeptides,
    stacks: matched.stacks,
  };
}

function renderAiResponse(result) {
  elements.aiResponse.hidden = false;
  const peptidesList = result.peptides?.length
    ? `<p><strong>Peptides:</strong> ${result.peptides.join(', ')}</p>`
    : '';
  const stackList = result.stacks?.length
    ? `<p><strong>Stacks:</strong> ${result.stacks.join(', ')}</p>`
    : '';
  elements.aiResponse.innerHTML = `
    <p>${result.summary}</p>
    ${peptidesList}
    ${stackList}
  `;
}

function extractGoalTag(goal) {
  if (!goal) return 'General wellness';
  const keywords = ['Fat Loss', 'Recovery', 'Sleep', 'Longevity', 'Performance', 'Cognitive', 'Immune'];
  const match = keywords.find((keyword) => goal.toLowerCase().includes(keyword.toLowerCase()));
  return match ?? goal.split(' ').slice(0, 2).join(' ');
}

function formatNumber(value, decimals = 1) {
  return Number(value).toFixed(decimals);
}

function formatTimestamp(iso) {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso));
  } catch (error) {
    return 'recently';
  }
}

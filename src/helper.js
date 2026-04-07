const classificationColors = {
  'tests': '#22c55e',
  'test-helpers': '#86efac',
  'mocks': '#94a3b8',
  'e2e': '#8b5cf6',
  'snapshots': '#ec4899',
  'ci-tests': '#06b6d4',
  'smoke': '#ef4444',
  'fixtures': '#f97316',
  'benchmarks': '#facc15',
  'source': '#1e293b'
};

const classificationBgColors = {
  'tests': '#dcfce7',
  'test-helpers': '#f0fdf4',
  'mocks': '#f1f5f9',
  'e2e': '#f5f3ff',
  'snapshots': '#fdf2f8',
  'ci-tests': '#ecfeff',
  'smoke': '#fef2f2',
  'fixtures': '#fff7ed',
  'benchmarks': '#fefce8',
  'source': '#f8fafc'
};

const classificationBorderColors = {
  'tests': '#86efac',
  'test-helpers': '#bbf7d0',
  'mocks': '#cbd5e1',
  'e2e': '#c4b5fd',
  'snapshots': '#f9a8d4',
  'ci-tests': '#67e8f9',
  'smoke': '#fca5a5',
  'fixtures': '#fdba74',
  'benchmarks': '#fde047',
  'source': '#cbd5e1'
};

const classificationTextColors = {
  'tests': '#16a34a',
  'test-helpers': '#16a34a',
  'mocks': '#475569',
  'e2e': '#6d28d9',
  'snapshots': '#be185d',
  'ci-tests': '#0891b2',
  'smoke': '#dc2626',
  'fixtures': '#ea580c',
  'benchmarks': '#ca8a04',
  'source': '#334155'
};

// --- Helpers ---

function getActiveMetric() {
  let metricBtn = document.querySelector('#version-metric-btns .active');
  return metricBtn ? metricBtn.getAttribute('data-metric') : 'testFiles';
}

function getActiveChartType() {
  let btn = document.querySelector('#version-chart-type-btns button.active');
  return btn ? btn.getAttribute('data-type') : 'line';
}

function escapeHtml(str) {
  let div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function buildOwnerIcon(owner) {
  return '<i class="devicon-' + owner.toLowerCase() + '-plain colored owner-icon" data-owner-icon></i>';
}

function hideEmptyOwnerIcons(root) {
  (root || document).querySelectorAll('[data-owner-icon]').forEach(function (el) {
    let style = window.getComputedStyle(el, '::before');
    let content = style.getPropertyValue('content');
    if (!content || content === 'none' || content === '""' || content === "''") {
      el.classList.add('no-icon');
    }
  });
}

function hideSections(ids) {
  ids.forEach(function (id) {
    document.getElementById(id).style.display = 'none';
  });
}

function showSections(ids) {
  ids.forEach(function (id) {
    let el = document.getElementById(id);
    el.style.display = '';
    el.classList.remove('collapsed');
  });
}

const ALL_SECTION_IDS = ['section-title-overview', 'section-title-state', 'section-title-deps', 'section-title-history'];

// --- Icon Helpers ---

const deviconAliases = {
  'c++': 'cplusplus',
  'c#': 'csharp',
  'shell': 'bash',
  'html': 'html5',
  'css': 'css3',
  'jupyter notebook': 'jupyter',
  'objective-c': 'objectivec',
  'vim script': 'vim',
  'emacs lisp': 'emacs',
};

const ecosystemDevicons = {
  npm: 'devicon-npm-original-wordmark',
  pip: 'devicon-python-plain',
  pypi: 'devicon-python-plain',
  gem: 'devicon-ruby-plain',
  nuget: 'devicon-dot-net-plain',
  maven: 'devicon-java-plain',
  gradle: 'devicon-gradle-plain',
  cargo: 'devicon-rust-plain',
  composer: 'devicon-composer-line',
  golang: 'devicon-go-original-wordmark',
  cocoapods: 'devicon-swift-plain',
  swift: 'devicon-swift-plain',
  pub: 'devicon-dart-plain',
  crate: 'devicon-rust-plain',
  hex: 'devicon-elixir-plain'
};

function getEcosystemIcon(ecosystem) {
  let cls = ecosystemDevicons[ecosystem.toLowerCase()];
  if (!cls) return '';
  return '<i class="' + cls + ' colored dep-ecosystem-icon"></i>';
}

function getDeviconClass(language) {
  if (!language) return '';
  let key = language.toLowerCase();
  let name = deviconAliases[key] || key.replace(/[^a-z0-9]/g, '');
  return 'devicon-' + name + '-plain';
}
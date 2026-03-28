var ownerReposCache = {};
var analyzeRepoCache = loadAnalyzeRepoCache();
var extensionSet = null;

function ensureAnalyzeRepo(repoKey) {
  if (analyzeRepoCache[repoKey]) {
    return Promise.resolve({ result: analyzeRepoCache[repoKey] });
  }
  return fetchJsDelivrFiles(repoKey).then(function (data) {
    if (!data) {
      return { error: 'not_found' };
    }
    if (data.error) {
      return { error: data.error };
    }
    var files = parseJsDelivrFiles(data);
    return { result: analyzeRepo(repoKey, files) };
  });
}

function fetchOwnerRepos(owner) {
  var key = owner.toLowerCase();
  if (ownerReposCache[key]) {
    return Promise.resolve(ownerReposCache[key]);
  }
  var url = 'https://api.github.com/users/' + owner + '/repos?sort=pushed&per_page=30';
  return fetch(url, {
    headers: { 'Accept': 'application/vnd.github.mercy-preview+json' }
  })
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(function (data) {
      if (data) {
        ownerReposCache[key] = data;
      }
      return data;
    })
    .catch(function () {
      return null;
    });
}

function fetchJsDelivrFiles(ownerRepo) {
  const url = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo + '@master';
  return fetch(url)
    .then(function (response) {
      if (response.status === 403) {
        return { error: 'too_large' };
      }
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(function (data) {
      if (!data || !data.files) {
        return data;
      }
      return data;
    })
    .catch(function () {
      return null;
    });
}

function fetchSBOM(ownerRepo) {
  const url = 'https://api.github.com/repos/' + ownerRepo + '/dependency-graph/sbom';
  return fetch(url)
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    });
}

function loadExtensions() {
  if (extensionSet) return Promise.resolve(extensionSet);
  return fetch('data/extensions.csv')
    .then(function (r) { return r.text(); })
    .then(function (text) {
      extensionSet = new Set();
      var lines = text.trim().split('\n');
      for (var i = 1; i < lines.length; i++) {
        var ext = lines[i].trim();
        if (ext) {
          extensionSet.add(ext.toLowerCase());
        }
      }
      return extensionSet;
    });
}

function parseGitHubOwnerRepo(url) {
  let match = url.match(/(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    match = url.match(/^([^/]+)\/([^/]+)$/);
  }
  if (!match) {
    return null;
  }
  const repo = match[2].replace(/\.git$/, '');
  return match[1] + '/' + repo;
}

function parseGitHubOwner(url) {
  let match = url.match(/(?:https?:\/\/)?github\.com\/([^/]+)/);
  if (!match) {
    match = url.match(/^([^/]+)$/);
  }
  if (!match) {
    return null;
  }
  return match[1];
}

function analyzeRepo(repoKey, filepaths) {
  if (analyzeRepoCache[repoKey]) {
    return analyzeRepoCache[repoKey];
  }
  var classified = classifyFiles(filepaths);
  var stats = computeTestStats(classified);
  var result = { repo: repoKey, stats: stats, files: classified };
  analyzeRepoCache[repoKey] = result;
  saveAnalyzeRepoCache();
  return result;
}

function parseJsDelivrFiles(data) {
  var filepaths = [];
  collectFilePaths(data.files, '', filepaths);
  return filepaths;
}

function parseSBOM(data) {
  var packages = [];
  var sbomPackages = data.sbom.packages;
  for (var i = 0; i < sbomPackages.length; i++) {
    var pkg = sbomPackages[i];
    var ecosystem = parseEcosystemFromPurl(pkg);
    if (ecosystem && ecosystem !== 'github') {
      packages.push({ name: pkg.name, ecosystem: ecosystem });
    }
  }
  return packages;
}

function classifyFiles(filepaths) {
  var result = {};
  filepaths.forEach(function (filepath) {
    var classification = classifyFile(filepath);
    if (!result[classification]) {
      result[classification] = [];
    }
    result[classification].push(filepath);
  });
  return result;
}

function computeTestStats(classified) {
  var total = 0;
  Object.keys(classified).forEach(function (key) {
    total += classified[key].length;
  });
  var sourceCount = (classified['source'] || []).length;
  var testCount = (classified['test'] || []).length;
  return {
    total: total,
    sourceFiles: sourceCount,
    testFiles: testCount,
    testRatio: testRatio(testCount, sourceCount),
    mockFiles: (classified['mock'] || []).length,
    e2eFiles: (classified['e2e'] || []).length,
    snapshotFiles: (classified['snapshot'] || []).length,
    ciTestFiles: (classified['ci-test'] || []).length,
    smokeFiles: (classified['smoke'] || []).length,
    fixtureFiles: (classified['fixture'] || []).length,
    benchmarkFiles: (classified['benchmark'] || []).length,
    testRelatedFiles: (classified['test-related'] || []).length
  };
}

function classifyFile(filepath) {
  if (isBenchmarkFile(filepath)) return 'benchmark';
  if (isSmokeFile(filepath)) return 'smoke';
  if (isCITestFile(filepath)) return 'ci-test';
  if (isFixtureFile(filepath)) return 'fixture';
  if (isE2EFile(filepath)) return 'e2e';
  if (isMockFile(filepath)) return 'mock';
  if (isSnapshotFile(filepath)) return 'snapshot';
  if (isTestFile(filepath)) return 'test';
  if (isTestRelatedFile(filepath)) return 'test-related';
  if (isSourceFile(filepath)) return 'source';
  return 'other';
}

function collectFilePaths(files, prefix, result) {
  for (var i = 0; i < files.length; i++) {
    var entry = files[i];
    var path = prefix + entry.name;
    if (entry.type === 'file') {
      result.push(path);
    } else if (entry.type === 'directory') {
      collectFilePaths(entry.files, path + '/', result);
    }
  }
}

function parseEcosystemFromPurl(pkg) {
  if (!pkg.externalRefs) {
    return null;
  }
  for (var i = 0; i < pkg.externalRefs.length; i++) {
    var ref = pkg.externalRefs[i];
    if (ref.referenceType === 'purl') {
      var match = ref.referenceLocator.match(/^pkg:([^/]+)\//);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}

function isTestFile(filepath) {
  if (!isSourceFile(filepath)) return false;
  var filename = filepath.split('/').pop();
  return containsTest(filename) || filename.toLowerCase().includes('spec.');
}

function isTestRelatedFile(filepath) {
  var parts = filepath.split('/');
  parts.pop();
  return parts.some(function (dir) {
    return containsTest(dir) || dir.toLowerCase() === 'spec';
  });
}

function isMockFile(filepath) {
  var parts = filepath.split('/');
  var filename = parts.pop();
  var inTestFolder = parts.some(function (dir) {
    return containsTest(dir) || dir.toLowerCase() === 'spec';
  });
  if (!inTestFolder) {
    return false;
  }
  var mockPatterns = ['mock', 'stub', 'spy', 'dummy', 'fake', 'spies', 'dummies'];
  return mockPatterns.some(function (pattern) {
    return filename.toLowerCase().includes(pattern);
  });
}

function isE2EFile(filepath) {
  return filepath.toLowerCase().includes('e2e');
}

function isSnapshotFile(filepath) {
  var parts = filepath.split('/');
  var filename = parts.pop();
  var inSnapshotFolder = parts.some(function (dir) {
    return dir.toLowerCase().includes('snapshot');
  });
  return inSnapshotFolder || filename.toLowerCase().endsWith('.snap');
}

function isSmokeFile(filepath) {
  return filepath.toLowerCase().includes('smoke');
}

function isFixtureFile(filepath) {
  return filepath.toLowerCase().includes('fixture');
}

function isBenchmarkFile(filepath) {
  return filepath.toLowerCase().includes('benchmark');
}

function isCITestFile(filepath) {
  var parts = filepath.split('/');
  var filename = parts.pop();
  var ciPatterns = ['.github', '.travis', '.circleci'];
  var inCIFolder = parts.some(function (dir) {
    return ciPatterns.some(function (pattern) {
      return dir.toLowerCase() === pattern;
    });
  });
  if (!inCIFolder) {
    return false;
  }
  return containsTest(filename);
}

function isSourceFile(filepath) {
  var filename = filepath.split('/').pop();
  var dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return false;
  var ext = filename.substring(dotIndex).toLowerCase();
  return extensionSet ? extensionSet.has(ext) : false;
}

function containsTest(str) {
  var lower = str.toLowerCase();
  var excludePatterns = ['latest', 'contest', 'attestation'];
  if (excludePatterns.some(function (pattern) { return lower.includes(pattern); })) return false;
  return lower.includes('test');
}

function testRatio(testFiles, sourceFiles) {
  if (sourceFiles === 0) return 0;
  return Math.round((testFiles / sourceFiles) * 100);
}

function loadAnalyzeRepoCache() {
  try {
    return JSON.parse(localStorage.getItem('testminer_analyze_cache') || '{}');
  } catch (e) { return {}; }
}

var classificationColors = {
  'test': '#22c55e',
  'test-related': '#86efac',
  'mock': '#94a3b8',
  'e2e': '#8b5cf6',
  'snapshot': '#ec4899',
  'ci-test': '#06b6d4',
  'smoke': '#ef4444',
  'fixture': '#f97316',
  'benchmark': '#facc15',
  'source': '#1e293b',
  'other': '#1e293b'
};

var classificationLabels = {
  'source': 'source/other',
  'other': 'source/other'
};

function groupFilesByDir(classifiedFiles) {
  var dirs = {};
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      var parts = filepath.split('/');
      var dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
      if (!dirs[dir]) dirs[dir] = [];
      dirs[dir].push({ name: parts[parts.length - 1], path: filepath, category: category });
    });
  });
  return dirs;
}

function groupFilesByDepth(classifiedFiles, depth) {
  var groups = {};
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      var parts = filepath.split('/');
      var dirParts = parts.slice(0, -1);
      var groupKey;
      if (depth === 0 || dirParts.length === 0) {
        groupKey = '.';
      } else {
        groupKey = dirParts.slice(0, Math.min(depth, dirParts.length)).join('/');
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({ name: parts[parts.length - 1], path: filepath, category: category });
    });
  });
  return groups;
}

function getMaxDepth(classifiedFiles) {
  var max = 0;
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      var parts = filepath.split('/');
      // depth = number of directory segments (parts.length - 1 for the file)
      var d = parts.length - 1;
      if (d > max) max = d;
    });
  });
  return max;
}

function renderFileTree(ownerRepo) {
  var chartEl = document.getElementById('tree-chart');
  if (!chartEl) return;

  var cached = analyzeRepoCache[ownerRepo];
  if (!cached || !cached.files) {
    chartEl.style.display = 'none';
    return;
  }

  // Clean up old tooltip if present
  var oldTooltip = document.querySelector('.block-tooltip');
  if (oldTooltip) oldTooltip.remove();

  var maxDepth = getMaxDepth(cached.files);
  var currentDepth = Math.min(1, maxDepth);

  // Legend
  var legendHTML = '<div class="tree-legend">';
  var legendShown = {};
  Object.keys(classificationColors).forEach(function (key) {
    if (cached.files[key] && cached.files[key].length > 0) {
      var label = classificationLabels[key] || key;
      if (legendShown[label]) return;
      legendShown[label] = true;
      legendHTML += '<span class="tree-legend-item"><span class="tree-dot" style="background:' + classificationColors[key] + '"></span>' + label + '</span>';
    }
  });
  legendHTML += '</div>';

  var currentSort = 'files-desc';

  function buildBlockMapHTML(activeFilters) {
    var dirs = groupFilesByDepth(cached.files, currentDepth);
    var dirKeys = Object.keys(dirs);
    var html = '';
    var sortedDirs = dirKeys.slice().sort();
    if (currentSort === 'alpha-desc') {
      sortedDirs.reverse();
    } else if (currentSort === 'files-asc' || currentSort === 'files-desc') {
      sortedDirs.sort(function (a, b) {
        var countA = dirs[a].filter(function (f) { return activeFilters.indexOf(f.category) >= 0; }).length;
        var countB = dirs[b].filter(function (f) { return activeFilters.indexOf(f.category) >= 0; }).length;
        return currentSort === 'files-asc' ? countA - countB : countB - countA;
      });
    }
    for (var i = 0; i < sortedDirs.length; i++) {
      var dir = sortedDirs[i];
      var files = dirs[dir].filter(function (f) {
        return activeFilters.indexOf(f.category) >= 0;
      });
      if (files.length === 0) continue;
      var catCounts = {};
      files.forEach(function (f) { catCounts[f.category] = (catCounts[f.category] || 0) + 1; });
      files.sort(function (a, b) {
        if (a.category !== b.category) return (catCounts[b.category] || 0) - (catCounts[a.category] || 0);
        return a.name.localeCompare(b.name);
      });
      html += '<div class="block-dir">';
      html += '<div class="block-dir-label" title="' + dir + '">' + dir + '</div>';
      html += '<div class="block-cells">';
      for (var j = 0; j < files.length; j++) {
        var f = files[j];
        var color = classificationColors[f.category] || '#94a3b8';
        html += '<div class="block-cell" style="background:' + color + '" data-tip="' + f.path + '"></div>';
      }
      html += '</div></div>';
    }
    return html;
  }

  // Sort bar
  var sortOptions = [];
  Object.keys(classificationColors).forEach(function (cat) {
    if (cached.files[cat] && cached.files[cat].length > 0) {
      var label = classificationLabels[cat] || cat;
      if (!sortOptions.some(function (s) { return s.label === label; })) {
        sortOptions.push({ key: cat, label: label });
      }
    }
  });

  // Build filter buttons - each option may map to multiple categories (e.g. source/other)
  var filterLabelToKeys = {};
  sortOptions.forEach(function (opt) {
    if (!filterLabelToKeys[opt.label]) filterLabelToKeys[opt.label] = [];
    filterLabelToKeys[opt.label].push(opt.key);
  });

  var allCategoryKeys = [];
  Object.keys(filterLabelToKeys).forEach(function (label) {
    allCategoryKeys = allCategoryKeys.concat(filterLabelToKeys[label]);
  });

  var testCategoryKeys = allCategoryKeys.filter(function (k) { return k !== 'source' && k !== 'other'; });

  var showHTML = 'Show: ';
  showHTML += '<button class="block-sort-btn active" data-show-preset="tests">tests</button>';
  showHTML += '<button class="block-sort-btn" data-show-preset="all">all files</button>';

  var showOnlyHTML = '<div class="block-sort">Filter: ';
  Object.keys(filterLabelToKeys).forEach(function (label) {
    var keys = filterLabelToKeys[label];
    showOnlyHTML += '<button class="block-sort-btn" data-showonly="' + keys.join(',') + '">' + label + '</button>';
  });
  showOnlyHTML += '</div>';

  var defaultCategories = testCategoryKeys;
  var sortHTML = '<div class="block-sort">';
  sortHTML += showHTML;
  sortHTML += '<span class="block-sort-sep">|</span>';
  sortHTML += 'Sort by: ';
  sortHTML += '<button class="block-sort-btn active" data-sort="files" id="sort-files">files \u2193</button>';
  sortHTML += '<button class="block-sort-btn" data-sort="alpha" id="sort-alpha">name \u2191</button>';
  sortHTML += '</div>';

  // Depth navigation
  var depthNavHTML = '<div class="depth-nav">';
  depthNavHTML += 'Depth: ';
  depthNavHTML += '<button class="block-sort-btn" id="depth-left"' + (currentDepth <= 0 ? ' disabled' : '') + '>\u25C0</button>';
  depthNavHTML += '<span class="depth-nav-label" id="depth-label">' + currentDepth + ' / ' + maxDepth + '</span>';
  depthNavHTML += '<button class="block-sort-btn" id="depth-right"' + (currentDepth >= maxDepth ? ' disabled' : '') + '>\u25B6</button>';
  depthNavHTML += '<button class="shape-toggle" id="shape-toggle" title="Toggle circles/squares"><span class="shape-toggle-icon"></span></button>';
  depthNavHTML += '<span class="export-btns"><button class="export-png-btn" id="export-png-btn">PNG</button><button class="export-png-btn" id="export-pdf-btn">PDF</button></span>';
  depthNavHTML += '</div>';

  var blockMapEl = document.createElement('div');
  blockMapEl.className = 'block-map';
  blockMapEl.innerHTML = buildBlockMapHTML(defaultCategories);

  chartEl.innerHTML = legendHTML + sortHTML + showOnlyHTML + depthNavHTML + '<div class="block-separator"></div>';
  chartEl.appendChild(blockMapEl);
  chartEl.style.display = 'block';

  // Tooltip element
  var tooltipEl = document.createElement('div');
  tooltipEl.className = 'block-tooltip';
  document.body.appendChild(tooltipEl);

  blockMapEl.addEventListener('mouseover', function (e) {
    var cell = e.target.closest('.block-cell');
    if (!cell) return;
    var tip = cell.getAttribute('data-tip');
    if (!tip) return;
    tooltipEl.textContent = tip;
    tooltipEl.classList.add('visible');
    var rect = cell.getBoundingClientRect();
    var tipRect = tooltipEl.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - tipRect.width / 2;
    if (left < 4) left = 4;
    if (left + tipRect.width > window.innerWidth - 4) left = window.innerWidth - 4 - tipRect.width;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = (rect.top - tipRect.height - 6) + 'px';
  });

  blockMapEl.addEventListener('mouseout', function (e) {
    var cell = e.target.closest('.block-cell');
    if (cell) tooltipEl.classList.remove('visible');
  });

  function getActiveFilters() {
    var filterBtns = chartEl.querySelectorAll('.block-sort-btn.active[data-showonly]');
    if (filterBtns.length > 0) {
      var filters = [];
      filterBtns.forEach(function (btn) {
        btn.getAttribute('data-showonly').split(',').forEach(function (k) { filters.push(k); });
      });
      return filters;
    }
    var presetBtn = chartEl.querySelector('.block-sort-btn.active[data-show-preset]');
    if (presetBtn) {
      var preset = presetBtn.getAttribute('data-show-preset');
      if (preset === 'tests') return testCategoryKeys;
    }
    return allCategoryKeys;
  }

  function updateDepthUI() {
    var label = document.getElementById('depth-label');
    var leftBtn = document.getElementById('depth-left');
    var rightBtn = document.getElementById('depth-right');
    if (label) label.textContent = currentDepth + ' / ' + maxDepth;
    if (leftBtn) leftBtn.disabled = currentDepth <= 0;
    if (rightBtn) rightBtn.disabled = currentDepth >= maxDepth;
  }

  // Depth navigation events
  var depthNavEl = document.querySelector('.depth-nav');
  depthNavEl.addEventListener('click', function (e) {
    var depthBtn = e.target.closest('#depth-left, #depth-right');
    if (depthBtn && !depthBtn.disabled) {
      if (depthBtn.id === 'depth-left' && currentDepth > 0) {
        currentDepth--;
      } else if (depthBtn.id === 'depth-right' && currentDepth < maxDepth) {
        currentDepth++;
      }
      updateDepthUI();
      blockMapEl.innerHTML = buildBlockMapHTML(getActiveFilters());
    }
  });

  // Shared capture logic
  function captureChart(btn, originalLabel, callback) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    tooltipEl.classList.remove('visible');

    var hideEls = chartEl.querySelectorAll('.block-sort, .depth-nav, .block-separator');
    hideEls.forEach(function (el) { el.style.display = 'none'; });

    var origMaxHeight = chartEl.style.maxHeight;
    var origOverflow = chartEl.style.overflowY;
    chartEl.style.maxHeight = 'none';
    chartEl.style.overflowY = 'visible';

    var titleEl = document.createElement('div');
    titleEl.className = 'export-title';
    var titleIcon = document.querySelector('#results-title-text i');
    if (titleIcon) {
      titleEl.appendChild(titleIcon.cloneNode(true));
    }
    var titleText = document.createElement('span');
    titleText.textContent = ownerRepo;
    titleEl.appendChild(titleText);
    chartEl.insertBefore(titleEl, chartEl.firstChild);

    html2canvas(chartEl, { backgroundColor: '#ffffff', scale: 2 }).then(function (canvas) {
      callback(canvas);
    }).finally(function () {
      chartEl.removeChild(titleEl);
      chartEl.style.maxHeight = origMaxHeight;
      chartEl.style.overflowY = origOverflow;
      hideEls.forEach(function (el) { el.style.display = ''; });
      btn.disabled = false;
      btn.textContent = originalLabel;
    });
  }

  // Save as PNG
  var exportPngBtn = document.getElementById('export-png-btn');
  exportPngBtn.addEventListener('click', function () {
    captureChart(exportPngBtn, 'PNG', function (canvas) {
      var link = document.createElement('a');
      link.download = ownerRepo.replace('/', '-') + '-testminer.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });

  // Save as PDF
  var exportPdfBtn = document.getElementById('export-pdf-btn');
  exportPdfBtn.addEventListener('click', function () {
    captureChart(exportPdfBtn, 'PDF', function (canvas) {
      var imgData = canvas.toDataURL('image/png');
      var imgWidth = canvas.width;
      var imgHeight = canvas.height;
      var pdfWidth = imgWidth * 0.264583; // px to mm at 96dpi
      var pdfHeight = imgHeight * 0.264583;
      var orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
      var pdf = new jspdf.jsPDF({ orientation: orientation, unit: 'mm', format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(ownerRepo.replace('/', '-') + '-testminer.pdf');
    });
  });

  // Shape toggle (squares <-> circles)
  document.getElementById('shape-toggle').addEventListener('click', function () {
    this.classList.toggle('active');
    blockMapEl.classList.toggle('circles');
  });

  var sortBars = chartEl.querySelectorAll('.block-sort');
  sortBars.forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.block-sort-btn');
      if (!btn) return;
      if (btn.hasAttribute('data-sort')) {
        var sort = btn.getAttribute('data-sort');
        chartEl.querySelectorAll('[data-sort]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (sort === 'alpha') {
          if (currentSort === 'alpha-asc') {
            currentSort = 'alpha-desc';
            btn.textContent = 'name \u2193';
          } else {
            currentSort = 'alpha-asc';
            btn.textContent = 'name \u2191';
          }
          document.getElementById('sort-files').textContent = 'files \u2191';
        } else if (sort === 'files') {
          if (currentSort === 'files-desc') {
            currentSort = 'files-asc';
            btn.textContent = 'files \u2191';
          } else {
            currentSort = 'files-desc';
            btn.textContent = 'files \u2193';
          }
          document.getElementById('sort-alpha').textContent = 'name \u2191';
        }
      } else if (btn.hasAttribute('data-show-preset')) {
        chartEl.querySelectorAll('[data-show-preset]').forEach(function (b) { b.classList.remove('active'); });
        chartEl.querySelectorAll('[data-showonly]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      } else if (btn.hasAttribute('data-showonly')) {
        btn.classList.toggle('active');
        var anyFilter = chartEl.querySelector('.block-sort-btn.active[data-showonly]');
        chartEl.querySelectorAll('[data-show-preset]').forEach(function (b) { b.classList.remove('active'); });
        if (!anyFilter) {
          chartEl.querySelector('[data-show-preset="tests"]').classList.add('active');
        }
      }
      blockMapEl.innerHTML = buildBlockMapHTML(getActiveFilters());
    });
  });
}

function saveAnalyzeRepoCache() {
  try {
    var keys = Object.keys(analyzeRepoCache);
    if (keys.length > 100) {
      var excess = keys.length - 100;
      for (var i = 0; i < excess; i++) {
        delete analyzeRepoCache[keys[i]];
      }
    }
    localStorage.setItem('testminer_analyze_cache', JSON.stringify(analyzeRepoCache));
  } catch (e) {}
}
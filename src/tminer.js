var ownerReposCache = {};
var analyzeRepoCache = loadAnalyzeRepoCache();
var extensionSet = null;
var testLibsSet = null;

var tminerConfig = {
  max_repos_per_page: 30,
  max_search_cache: 5,
  max_analyze_cache: 100,
  top_n_test_terms: 5,
  top_n_test_terms_mobile: 3,
  dep_keywords: ['test', 'mock', 'stub', 'spy', 'dummy', 'fake', 'spies', 'dummies'],
  search_suggestions: []
};

var tminerConfigReady = fetch('data/config.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      tminerConfig[keys[i]] = data[keys[i]];
    }
  })
  .catch(function() {});

function getGitHubToken() {
  try { return localStorage.getItem('testminer_gh_token') || ''; } catch (e) { return ''; }
}

function saveGitHubToken(token) {
  try { localStorage.setItem('testminer_gh_token', token); } catch (e) {}
}

function removeGitHubToken() {
  try { localStorage.removeItem('testminer_gh_token'); } catch (e) {}
}

function githubFetch(url, options) {
  options = options || {};
  var token = getGitHubToken();
  if (token) {
    options.headers = Object.assign({ 'Authorization': 'Bearer ' + token }, options.headers || {});
  }
  return fetch(url, options);
}

var rateLimitExhausted = false;

function updateRateLimit(response) {
  var remaining = response.headers.get('X-RateLimit-Remaining');
  var limit = response.headers.get('X-RateLimit-Limit');
  if (remaining === null || limit === null) return;
  rateLimitExhausted = (parseInt(remaining, 10) === 0);
  var el = document.getElementById('github-rate-limit-text');
  if (el) el.textContent = 'GitHub API requests: ' + remaining + ' / ' + limit + ' remaining.';
}

function fetchRateLimit() {
  githubFetch('https://api.github.com/rate_limit')
    .then(function (response) {
      updateRateLimit(response);
    })
    .catch(function () {});
}

function ensureAnalyzeRepo(repoKey, version) {
  var cacheKey = version ? repoKey + '@' + version : repoKey;
  if (analyzeRepoCache[cacheKey]) {
    return Promise.resolve({ result: analyzeRepoCache[cacheKey] });
  }
  return fetchJsDelivrFiles(repoKey, version).then(function (data) {
    if (!data) {
      return { error: 'not_found' };
    }
    if (data.error) {
      return { error: data.error };
    }
    var files = parseJsDelivrFiles(data);
    return { result: analyzeRepo(cacheKey, files) };
  });
}

function fetchJsDelivrVersions(ownerRepo) {
  var url = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo;
  return fetch(url)
    .then(function (response) {
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      if (!data || !data.versions) return [];
      return data.versions.map(function (v) { return v.version; });
    })
    .catch(function () {
      return [];
    });
}

function fetchOwnerRepos(owner) {
  var key = owner.toLowerCase();
  if (ownerReposCache[key]) {
    return Promise.resolve(ownerReposCache[key]);
  }
  var url = 'https://api.github.com/users/' + owner + '/repos?sort=pushed&per_page=' + tminerConfig.max_repos_per_page;
  return githubFetch(url, {
    headers: { 'Accept': 'application/vnd.github.mercy-preview+json' }
  })
    .then(function (response) {
      updateRateLimit(response);
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

function fetchJsDelivrFilesByRef(ownerRepo, ref) {
  var filesUrl = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo + '@' + ref;
  return fetch(filesUrl)
    .then(function (response) {
      if (!response) {
        return null;
      }
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

function fetchJsDelivrFiles(ownerRepo, version) {
  if (version) {
    return fetchJsDelivrFilesByRef(ownerRepo, version);
  }
  return fetchJsDelivrFilesByRef(ownerRepo, 'master').then(function (data) {
    if (data && !data.error) {
      return data;
    }
    return fetchJsDelivrFilesByRef(ownerRepo, 'main');
  });
}

function fetchDefaultBranch(ownerRepo) {
  var url = 'https://api.github.com/repos/' + ownerRepo;
  return githubFetch(url)
    .then(function (response) {
      updateRateLimit(response);
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      return data ? data.default_branch : null;
    })
    .catch(function () {
      return null;
    });
}

function fetchSBOM(ownerRepo) {
  const url = 'https://api.github.com/repos/' + ownerRepo + '/dependency-graph/sbom';
  return githubFetch(url)
    .then(function (response) {
      updateRateLimit(response);
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

function loadTestLibs() {
  if (testLibsSet) return Promise.resolve(testLibsSet);
  return fetch('data/test_libs.csv')
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var lines = text.trim().split('\n')
        .map(function (l) { return l.trim().toLowerCase(); })
        .filter(function (l) { return l; })
        .sort();
      testLibsSet = new Set(lines);
      return testLibsSet;
    });
}

function filterTestDependencies(sbomPackages, testLibs, keywords) {
  keywords = keywords || tminerConfig.dep_keywords;
  var results = new Set();
  for (var i = 0; i < sbomPackages.length; i++) {
    var pkg = sbomPackages[i];
    var nameLower = pkg.name.toLowerCase();
    var shortName = nameLower.split('/').pop().split(':').pop();
    var matched = false;
    for (var k = 0; k < keywords.length; k++) {
      if (shortName.indexOf(keywords[k]) !== -1) { matched = true; break; }
    }
    if (matched) {
      results.add(pkg);
      continue;
    }
    for (var it = testLibs.values(), val = it.next(); !val.done; val = it.next()) {
      if (shortName === val.value || nameLower === val.value ||
          shortName.indexOf(val.value + '-') === 0 || shortName.indexOf(val.value + '_') === 0) {
        results.add(pkg);
        break;
      }
    }
  }
  return [...results];
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
    if (ecosystem && ecosystem !== 'github' && ecosystem !== 'githubactions') {
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
  var testCount = (classified['test'] || []).length;
  var sourceCount = (classified['source'] || []).length;
  return {
    total: total,
    sourceFiles: sourceCount,
    testFiles: testCount,
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

function filterSemverVersions(versions) {
  var semverRe = /^v?\d+\.\d+\.\d+$/;
  return versions.filter(function (v) { return semverRe.test(v); });
}

function containsTest(str) {
  var lower = str.toLowerCase();
  var excludePatterns = ['latest', 'contest', 'attestation'];
  if (excludePatterns.some(function (pattern) { return lower.includes(pattern); })) return false;
  return lower.includes('test');
}


function loadAnalyzeRepoCache() {
  try {
    return JSON.parse(localStorage.getItem('testminer_analyze_cache') || '{}');
  } catch (e) { return {}; }
}


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

function saveAnalyzeRepoCache() {
  try {
    var keys = Object.keys(analyzeRepoCache);
    if (keys.length > tminerConfig.max_analyze_cache) {
      var excess = keys.length - tminerConfig.max_analyze_cache;
      for (var i = 0; i < excess; i++) {
        delete analyzeRepoCache[keys[i]];
      }
    }
    localStorage.setItem('testminer_analyze_cache', JSON.stringify(analyzeRepoCache));
  } catch (e) {}
}

function parseTerms(str) {
  var omitPatterns = ['test', 'tests', 'testing', 'tester', 'spec'];
  return str
    .replace(/([a-z])([A-Z])/g, '$1\x00$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\x00$2')
    .replace(/[-_]/g, '\x00')
    .split('\x00')
    .filter(function(t) { return t.length >= 3 && !omitPatterns.includes(t.toLowerCase()); })
    .map(function(t) {
      if (t.length > 1 && t[0] === t[0].toUpperCase() && t[1] === t[1].toLowerCase()) {
        return t[0].toLowerCase() + t.slice(1);
      }
      return t;
    });
}

function groupFilesByTerms(filepaths) {
  var termMap = Object.create(null);
  filepaths.forEach(function(filepath) {
    var filename = filepath.split('/').pop();
    var stem = filename.replace(/(\.[^/.]+)+$/, '');
    var terms = parseTerms(stem);
    terms.forEach(function(term) {
      if (!termMap[term]) termMap[term] = [];
      termMap[term].push(filepath);
    });
  });
  return termMap;
}

if (typeof module !== 'undefined') {
  module.exports = {
    parseTerms: parseTerms,
    groupFilesByTerms: groupFilesByTerms,
    parseGitHubOwnerRepo: parseGitHubOwnerRepo,
    parseGitHubOwner: parseGitHubOwner,
    parseEcosystemFromPurl: parseEcosystemFromPurl,
    parseSBOM: parseSBOM,
    parseJsDelivrFiles: parseJsDelivrFiles,
    classifyFiles: classifyFiles,
    classifyFile: classifyFile,
    computeTestStats: computeTestStats,
    analyzeRepo: analyzeRepo,
    containsTest: containsTest,
    isTestRelatedFile: isTestRelatedFile,
    isTestFile: isTestFile,
    isMockFile: isMockFile,
    isE2EFile: isE2EFile,
    isSnapshotFile: isSnapshotFile,
    isSmokeFile: isSmokeFile,
    isFixtureFile: isFixtureFile,
    isBenchmarkFile: isBenchmarkFile,
    isCITestFile: isCITestFile,
    isSourceFile: isSourceFile,
    filterTestDependencies: filterTestDependencies,
    filterSemverVersions: filterSemverVersions,
    setExtensionSet: function(s) { extensionSet = s; },
    setTestLibsSet: function(s) { testLibsSet = s; },
    resetAnalyzeRepoCache: function() { analyzeRepoCache = {}; }
  };
}
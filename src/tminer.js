const ownerReposCache = {};
let analyzeRepoCache = loadAnalyzeRepoCache();
const tagPrefixCache = {};
let extensionSet = null;
let testLibsSet = null;

const tminerConfig = {
  max_repos_per_page: 30,
  max_analyze_cache: 100,
  top_n_test_terms: 5,
  top_n_test_terms_mobile: 3,
  dep_keywords: ['test', 'mock', 'stub', 'spy', 'dummy', 'fake', 'spies', 'dummies'],
  search_suggestions: ['google', 'microsoft', 'apple', 'facebook', 'netflix', 'github', 'apache', 'huggingface', 'fastapi/fastapi', 'prisma/prisma', 'github/linguist']
};

function getGitHubToken() {
  try { return localStorage.getItem('testminer_gh_token') || ''; } catch (e) { return ''; }
}

function saveGitHubToken(token) {
  try { localStorage.setItem('testminer_gh_token', token); } catch (e) { }
}

function removeGitHubToken() {
  try { localStorage.removeItem('testminer_gh_token'); } catch (e) { }
}

function githubFetch(url, options) {
  options = options || {};
  const token = getGitHubToken();
  if (token) {
    options.headers = Object.assign({ 'Authorization': 'Bearer ' + token }, options.headers || {});
  }
  return fetch(url, options);
}

let rateLimitExhausted = false;

function updateRateLimit(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  if (remaining === null || limit === null) return;
  rateLimitExhausted = (parseInt(remaining, 10) === 0);
  const el = document.getElementById('github-rate-limit-text');
  if (el) el.textContent = 'GitHub API requests: ' + remaining + ' / ' + limit + ' remaining.';
}

function fetchRateLimit() {
  githubFetch('https://api.github.com/rate_limit')
    .then(function (response) {
      updateRateLimit(response);
    })
    .catch(function () { });
}

function ensureAnalyzeRepo(repoKey, version) {
  const cacheKey = version ? repoKey + '@' + version : repoKey;
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
    const files = parseJsDelivrFiles(data);
    return { result: analyzeRepo(cacheKey, files) };
  });
}

function fetchJsDelivrVersions(ownerRepo) {
  const url = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo;
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
  const key = owner.toLowerCase();
  if (ownerReposCache[key]) {
    return Promise.resolve(ownerReposCache[key]);
  }
  const url = 'https://api.github.com/users/' + owner + '/repos?sort=pushed&per_page=' + tminerConfig.max_repos_per_page;
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

function fetchTopicRepos(topic) {
  const key = topic.toLowerCase();
  if (ownerReposCache['topic:' + key]) {
    return Promise.resolve(ownerReposCache['topic:' + key]);
  }
  const url = 'https://api.github.com/search/repositories?q=topic:' + encodeURIComponent(topic) + '&sort=stars&order=desc&per_page=' + tminerConfig.max_repos_per_page;
  return githubFetch(url)
    .then(function (response) {
      updateRateLimit(response);
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      if (data && data.items) {
        ownerReposCache['topic:' + key] = data.items;
        return data.items;
      }
      return null;
    })
    .catch(function () {
      return null;
    });
}

function fetchTagPrefix(ownerRepo) {
  if (tagPrefixCache.hasOwnProperty(ownerRepo)) {
    return Promise.resolve(tagPrefixCache[ownerRepo]);
  }
  return fetchJsDelivrVersions(ownerRepo).then(function (versions) {
    var latestVersion = versions && versions.length ? versions[0] : null;
    if (!latestVersion) {
      tagPrefixCache[ownerRepo] = '';
      return '';
    }
    var url = 'https://api.github.com/repos/' + ownerRepo + '/tags';
    return githubFetch(url)
      .then(function (response) {
        if (!response || !response.ok) return null;
        return response.json();
      })
      .then(function (tags) {
        var prefix = '';
        if (tags && tags.length) {
          for (var i = 0; i < tags.length; i++) {
            var tagName = tags[i].name;
            var stripped = tagName.replace(/^[^0-9]*/, '');
            if (stripped === latestVersion) {
              prefix = tagName.substring(0, tagName.length - latestVersion.length);
              break;
            }
          }
        }
        tagPrefixCache[ownerRepo] = prefix;
        return prefix;
      })
      .catch(function () {
        tagPrefixCache[ownerRepo] = '';
        return '';
      });
  });
}

function getGitHubTagRef(ownerRepo, version) {
  var prefix = tagPrefixCache.hasOwnProperty(ownerRepo) ? tagPrefixCache[ownerRepo] : '';
  return prefix + version;
}

function fetchJsDelivrFilesByRef(ownerRepo, ref) {
  const filesUrl = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo + '@' + ref;
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

function fetchRepoInfo(ownerRepo) {
  const url = 'https://api.github.com/repos/' + ownerRepo;
  return githubFetch(url)
    .then(function (response) {
      updateRateLimit(response);
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      if (!data) return null;
      return {
        default_branch: data.default_branch,
        description: data.description || '',
        stargazers_count: data.stargazers_count || 0,
        language: data.language || '',
        topics: data.topics || []
      };
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
      const lines = text.trim().split('\n');
      for (let i = 1; i < lines.length; i++) {
        const ext = lines[i].trim();
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
      const lines = text.trim().split('\n').slice(1)
        .map(function (l) { return l.trim().toLowerCase(); })
        .filter(function (l) { return l; })
        .sort();
      testLibsSet = new Set(lines);
      return testLibsSet;
    });
}

function filterTestDependencies(sbomPackages, testLibs, keywords) {
  keywords = keywords || tminerConfig.dep_keywords;
  const results = new Set();
  for (let i = 0; i < sbomPackages.length; i++) {
    const pkg = sbomPackages[i];
    const nameLower = pkg.name.toLowerCase();
    const shortName = nameLower.split('/').pop().split(':').pop();
    let matched = false;
    for (let k = 0; k < keywords.length; k++) {
      if (shortName.indexOf(keywords[k]) !== -1) { matched = true; break; }
    }
    if (matched) {
      results.add(pkg);
      continue;
    }
    for (let it = testLibs.values(), val = it.next(); !val.done; val = it.next()) {
      if (shortName === val.value || nameLower === val.value ||
        shortName.indexOf(val.value + '-') === 0 || shortName.indexOf(val.value + '_') === 0) {
        results.add(pkg);
        break;
      }
    }
  }
  return [...results];
}

function parseOwnerRepo(ownerRepo) {
  const atIdx = ownerRepo.indexOf('@');
  const baseRepo = atIdx !== -1 ? ownerRepo.substring(0, atIdx) : ownerRepo;
  const versionTag = atIdx !== -1 ? ownerRepo.substring(atIdx + 1) : '';
  return { baseRepo: baseRepo, versionTag: versionTag };
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
  const classified = classifyFiles(filepaths);
  const stats = computeTestStats(classified);
  const result = { repo: repoKey, stats: stats, files: classified };
  analyzeRepoCache[repoKey] = result;
  saveAnalyzeRepoCache();
  return result;
}

function parseJsDelivrFiles(data) {
  const filepaths = [];
  collectFilePaths(data.files, '', filepaths);
  return filepaths;
}

function parseSBOM(data) {
  const packages = [];
  const sbomPackages = data.sbom.packages;
  for (let i = 0; i < sbomPackages.length; i++) {
    const pkg = sbomPackages[i];
    const ecosystem = parseEcosystemFromPurl(pkg);
    if (ecosystem && ecosystem !== 'github' && ecosystem !== 'githubactions') {
      packages.push({ name: pkg.name, ecosystem: ecosystem });
    }
  }
  return packages;
}

function classifyFiles(filepaths) {
  const result = {};
  filepaths.forEach(function (filepath) {
    const filename = filepath.split('/').pop();
    const dotIndex = filename.lastIndexOf('.');
    const ext = dotIndex === -1 ? '' : filename.substring(dotIndex).toLowerCase();
    if (extensionSet && (dotIndex === -1 || !extensionSet.has(ext))) return;
    const classification = classifyFile(filepath);
    if (!result[classification]) {
      result[classification] = [];
    }
    result[classification].push(filepath);
  });
  return result;
}

function computeTestStats(classified) {
  let total = 0;
  Object.keys(classified).forEach(function (key) {
    total += classified[key].length;
  });
  return {
    total: total,
    sourceFiles: (classified['source'] || []).length,
    testFiles: (classified['tests'] || []).length,
    mockFiles: (classified['mocks'] || []).length,
    e2eFiles: (classified['e2e'] || []).length,
    snapshotFiles: (classified['snapshots'] || []).length,
    ciTestFiles: (classified['ci-tests'] || []).length,
    smokeFiles: (classified['smoke'] || []).length,
    fixtureFiles: (classified['fixtures'] || []).length,
    benchmarkFiles: (classified['benchmarks'] || []).length,
    testHelperFiles: (classified['test-helpers'] || []).length
  };
}

function classifyFile(filepath) {
  if (isBenchmarkFile(filepath)) return 'benchmarks';
  if (isSmokeFile(filepath)) return 'smoke';
  if (isCITestFile(filepath)) return 'ci-tests';
  if (isFixtureFile(filepath)) return 'fixtures';
  if (isE2EFile(filepath)) return 'e2e';
  if (isMockFile(filepath)) return 'mocks';
  if (isSnapshotFile(filepath)) return 'snapshots';
  if (isTestFile(filepath)) return 'tests';
  if (isTestHelperFile(filepath)) return 'test-helpers';
  return 'source';
}

function collectFilePaths(files, prefix, result) {
  for (let i = 0; i < files.length; i++) {
    const entry = files[i];
    const path = prefix + entry.name;
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
  for (let i = 0; i < pkg.externalRefs.length; i++) {
    const ref = pkg.externalRefs[i];
    if (ref.referenceType === 'purl') {
      const match = ref.referenceLocator.match(/^pkg:([^/]+)\//);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}

function isTestFile(filepath) {
  const filename = filepath.split('/').pop();
  return containsTest(filename) || filename.toLowerCase().includes('spec.');
}

function isTestHelperFile(filepath) {
  const parts = filepath.split('/');
  parts.pop();
  return parts.some(function (dir) {
    return containsTest(dir) || dir.toLowerCase() === 'spec';
  });
}

function inTestFolder(parts) {
  return parts.some(function (dir) {
    return containsTest(dir) || dir.toLowerCase() === 'spec';
  });
}

function isMockFile(filepath) {
  const parts = filepath.split('/');
  const filename = parts.pop();
  if (!inTestFolder(parts)) {
    return false;
  }
  const mockPatterns = ['mock', 'stub', 'spy', 'dummy', 'fake', 'spies', 'dummies'];
  return mockPatterns.some(function (pattern) {
    return filename.toLowerCase().includes(pattern);
  });
}

function isE2EFile(filepath) {
  return filepath.toLowerCase().includes('e2e');
}

function isSnapshotFile(filepath) {
  const parts = filepath.split('/');
  const filename = parts.pop();
  if (!inTestFolder(parts)) {
    return false;
  }
  const inSnapshotFolder = parts.some(function (dir) {
    return dir.toLowerCase().includes('snapshot');
  });
  return inSnapshotFolder || filename.toLowerCase().endsWith('.snap');
}

function isSmokeFile(filepath) {
  return filepath.toLowerCase().includes('smoke');
}

function isFixtureFile(filepath) {
  const parts = filepath.split('/');
  parts.pop();
  if (!inTestFolder(parts)) {
    return false;
  }
  return filepath.toLowerCase().includes('fixture');
}

function isBenchmarkFile(filepath) {
  return filepath.toLowerCase().includes('benchmark');
}

function isCITestFile(filepath) {
  const parts = filepath.split('/');
  const filename = parts.pop();
  const ciPatterns = ['.github', '.travis', '.circleci'];
  const inCIFolder = parts.some(function (dir) {
    return ciPatterns.some(function (pattern) {
      return dir.toLowerCase() === pattern;
    });
  });
  if (!inCIFolder) {
    return false;
  }
  return containsTest(filename);
}


function filterSemverVersions(versions) {
  const semverRe = /^v?\d+\.\d+\.\d+$/;
  return versions.filter(function (v) { return semverRe.test(v); });
}

function containsTest(str) {
  const lower = str.toLowerCase();
  const excludePatterns = ['latest', 'contest', 'attestation'];
  if (excludePatterns.some(function (pattern) { return lower.includes(pattern); })) return false;
  return lower.includes('test');
}


function loadAnalyzeRepoCache() {
  try {
    return JSON.parse(localStorage.getItem('testminer_analyze_cache') || '{}');
  } catch (e) { return {}; }
}


function groupFilesByDir(classifiedFiles) {
  const dirs = {};
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      const parts = filepath.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
      if (!dirs[dir]) dirs[dir] = [];
      dirs[dir].push({ name: parts[parts.length - 1], path: filepath, category: category });
    });
  });
  return dirs;
}

function groupFilesByDepth(classifiedFiles, depth) {
  const groups = {};
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      const parts = filepath.split('/');
      const dirParts = parts.slice(0, -1);
      let groupKey;
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
  let max = 0;
  Object.keys(classifiedFiles).forEach(function (category) {
    classifiedFiles[category].forEach(function (filepath) {
      const parts = filepath.split('/');
      // depth = number of directory segments (parts.length - 1 for the file)
      const d = parts.length - 1;
      if (d > max) max = d;
    });
  });
  return max;
}

function saveAnalyzeRepoCache() {
  try {
    const keys = Object.keys(analyzeRepoCache);
    if (keys.length > tminerConfig.max_analyze_cache) {
      const excess = keys.length - tminerConfig.max_analyze_cache;
      for (let i = 0; i < excess; i++) {
        delete analyzeRepoCache[keys[i]];
      }
    }
    localStorage.setItem('testminer_analyze_cache', JSON.stringify(analyzeRepoCache));
  } catch (e) { }
}

function parseTerms(str) {
  const omitPatterns = ['test', 'tests', 'testing', 'tester', 'spec'];
  return str
    .replace(/([a-z])([A-Z])/g, '$1\x00$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\x00$2')
    .replace(/[-_]/g, '\x00')
    .split('\x00')
    .filter(function (t) { return t.length >= 3 && !omitPatterns.includes(t.toLowerCase()); })
    .map(function (t) {
      if (t.length > 1 && t[0] === t[0].toUpperCase() && t[1] === t[1].toLowerCase()) {
        return t[0].toLowerCase() + t.slice(1);
      }
      return t;
    });
}

function groupFilesByTerms(filepaths) {
  const termMap = Object.create(null);
  filepaths.forEach(function (filepath) {
    const filename = filepath.split('/').pop();
    const stem = filename.replace(/(\.[^/.]+)+$/, '');
    const terms = parseTerms(stem);
    terms.forEach(function (term) {
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
    parseOwnerRepo: parseOwnerRepo,
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
    isTestHelperFile: isTestHelperFile,
    isTestFile: isTestFile,
    isMockFile: isMockFile,
    isE2EFile: isE2EFile,
    isSnapshotFile: isSnapshotFile,
    isSmokeFile: isSmokeFile,
    isFixtureFile: isFixtureFile,
    isBenchmarkFile: isBenchmarkFile,
    isCITestFile: isCITestFile,
    filterTestDependencies: filterTestDependencies,
    filterSemverVersions: filterSemverVersions,
    fetchTagPrefix: fetchTagPrefix,
    getGitHubTagRef: getGitHubTagRef,
    setExtensionSet: function (s) { extensionSet = s; },
    setTestLibsSet: function (s) { testLibsSet = s; },
    resetAnalyzeRepoCache: function () { analyzeRepoCache = {}; }
  };
}

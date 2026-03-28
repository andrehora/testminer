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
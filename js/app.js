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

function fetchJsDelivrFiles(ownerRepo) {
  const url = 'https://data.jsdelivr.com/v1/packages/gh/' + ownerRepo + '@master';
  return fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.status === 403) {
        return { error: 'too_large' };
      }
      if (data.status && data.status !== 200 && !data.files) {
        return null;
      }
      return data;
    })
    .catch(function () {
      return null;
    });
}

function parseJsDelivrFiles(data) {
  var filepaths = [];
  collectFilePaths(data.files, '', filepaths);
  return filepaths;
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

function computeTestStats(filepaths) {
  var total = filepaths.length;
  var testCount = filepaths.filter(isTestFile).length;
  var mockCount = filepaths.filter(isMockFile).length;
  var e2eCount = filepaths.filter(isE2EFile).length;
  var snapshotCount = filepaths.filter(isSnapshotFile).length;
  var ciTestCount = filepaths.filter(isCITestFile).length;
  var smokeCount = filepaths.filter(isSmokeFile).length;
  var fixtureCount = filepaths.filter(isFixtureFile).length;
  var benchmarkCount = filepaths.filter(isBenchmarkFile).length;
  var testRelatedCount = filepaths.filter(isTestRelatedFile).length;
  return { total: total, testFiles: testCount, mockFiles: mockCount, e2eFiles: e2eCount, snapshotFiles: snapshotCount, ciTestFiles: ciTestCount, smokeFiles: smokeCount, fixtureFiles: fixtureCount, benchmarkFiles: benchmarkCount, testRelatedFiles: testRelatedCount };
}

function containsTest(str) {
  var lower = str.toLowerCase();
  var excludePatterns = ['latest', 'contest', 'attestation'];
  if (excludePatterns.some(function (pattern) { return lower.includes(pattern); })) return false;
  return lower.includes('test');
}

function isTestRelatedFile(filepath) {
  var parts = filepath.split('/');
  parts.pop();
  return parts.some(function (dir) {
    return containsTest(dir) || dir.toLowerCase() === 'spec';
  });
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

function isTestFile(filepath) {
  var filename = filepath.split('/').pop();
  // var nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return containsTest(filename) || filename.toLowerCase().includes('spec.');
}

var ownerReposCache = {};

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
describe('parseJsDelivrFiles', function () {

  it('should return all root-level files', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result).toContain('.gitignore');
    expect(result).toContain('README.md');
    expect(result).toContain('pyproject.toml');
  });

  it('should return files inside a directory with full path', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result).toContain('gitevo/__init__.py');
    expect(result).toContain('gitevo/main.py');
  });

  it('should return files inside a nested directory with full path', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result).toContain('gitevo/reports/base.py');
    expect(result).toContain('gitevo/reports/commit.py');
  });

  it('should return files from multiple top-level directories', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result).toContain('tests/test_main.py');
  });

  it('should not include directory names as entries', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result).not.toContain('gitevo');
    expect(result).not.toContain('gitevo/reports');
    expect(result).not.toContain('tests');
  });

  it('should return correct total number of files', function () {
    const result = parseJsDelivrFiles(jsdelivrGitevoData);
    expect(result.length).toEqual(8);
  });

  it('should return empty array for empty files list', function () {
    const result = parseJsDelivrFiles({ files: [] });
    expect(result).toEqual([]);
  });

});

describe('computeTestStats', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.sh', '.snap']);
  });

  it('should return zeros for an empty classified object', function () {
    const result = computeTestStats({});
    expect(result.total).toEqual(0);
    expect(result.sourceFiles).toEqual(0);
    expect(result.testFiles).toEqual(0);
    expect(result.testRatio).toEqual(0);
    expect(result.mockFiles).toEqual(0);
    expect(result.e2eFiles).toEqual(0);
    expect(result.snapshotFiles).toEqual(0);
    expect(result.ciTestFiles).toEqual(0);
    expect(result.smokeFiles).toEqual(0);
    expect(result.fixtureFiles).toEqual(0);
    expect(result.benchmarkFiles).toEqual(0);
    expect(result.testRelatedFiles).toEqual(0);
  });

  it('should return correct total count', function () {
    const result = computeTestStats({ source: ['src/app.js', 'src/utils.js'], test: ['tests/test_app.js'] });
    expect(result.total).toEqual(3);
  });

  it('should return correct test file count', function () {
    const result = computeTestStats({ source: ['src/app.js', 'src/utils.js'], test: ['tests/test_app.js'] });
    expect(result.testFiles).toEqual(1);
  });

  it('should return correct test ratio', function () {
    const result = computeTestStats({ source: ['src/app.js', 'src/utils.js'], test: ['tests/test_app.js'] });
    expect(result.testRatio).toEqual(33);
  });

  it('should return correct mock file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], mock: ['tests/mock_db.js', 'tests/fake_api.js'] });
    expect(result.mockFiles).toEqual(2);
  });

  it('should return correct e2e file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], e2e: ['e2e/login.js', 'tests/app.e2e.js'] });
    expect(result.e2eFiles).toEqual(2);
  });

  it('should return correct snapshot file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], snapshot: ['tests/__snapshots__/app.snap', 'tests/output.snap'] });
    expect(result.snapshotFiles).toEqual(2);
  });

  it('should return correct ci test file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], 'ci-test': ['.github/workflows/test.yml', '.circleci/test_config.yml'] });
    expect(result.ciTestFiles).toEqual(2);
  });

  it('should return correct smoke file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], smoke: ['smoke/login.js', 'tests/smoke_test.js'] });
    expect(result.smokeFiles).toEqual(2);
  });

  it('should return correct fixture file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], fixture: ['tests/fixtures/user.json', 'fixture_data.js'] });
    expect(result.fixtureFiles).toEqual(2);
  });

  it('should return correct benchmark file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], benchmark: ['benchmarks/sort.js', 'benchmark_sort.js'] });
    expect(result.benchmarkFiles).toEqual(2);
  });

  it('should return correct test related file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], 'test-related': ['tests/utils.js', 'spec/helpers.js'] });
    expect(result.testRelatedFiles).toEqual(2);
  });

  it('should return correct stats from real jsdelivr data', function () {
    const files = parseJsDelivrFiles(jsdelivrGitevoData);
    const classified = classifyFiles(files);
    const result = computeTestStats(classified);
    expect(result.total).toEqual(8);
    expect(result.testFiles).toEqual(1);
    expect(result.mockFiles).toEqual(0);
    expect(result.e2eFiles).toEqual(0);
    expect(result.snapshotFiles).toEqual(0);
    expect(result.ciTestFiles).toEqual(0);
    expect(result.smokeFiles).toEqual(0);
    expect(result.fixtureFiles).toEqual(0);
    expect(result.benchmarkFiles).toEqual(0);
    expect(result.testRelatedFiles).toEqual(0);
  });

});

describe('analyzeRepo', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']);
  });

  beforeEach(function () {
    analyzeRepoCache = {};
  });

  it('should return an object with repo, stats and files', function () {
    var result = analyzeRepo('owner/repo', ['src/app.js', 'tests/test_app.js']);
    expect(result.repo).toEqual('owner/repo');
    expect(result.stats).toBeDefined();
    expect(result.files).toBeDefined();
  });

  it('should have correct stats', function () {
    var result = analyzeRepo('owner/repo', ['src/app.js', 'tests/test_app.js']);
    expect(result.stats.total).toEqual(2);
    expect(result.stats.sourceFiles).toEqual(2);
    expect(result.stats.testFiles).toEqual(1);
  });

  it('should have correct classified files', function () {
    var result = analyzeRepo('owner/repo', ['src/app.js', 'tests/test_app.js']);
    expect(result.files.source).toEqual(['src/app.js']);
    expect(result.files.test).toEqual(['tests/test_app.js']);
  });

  it('should handle empty input', function () {
    var result = analyzeRepo('owner/empty', []);
    expect(result.stats.total).toEqual(0);
    expect(result.files).toEqual({});
  });

  it('should return cached result on second call', function () {
    var first = analyzeRepo('owner/repo', ['src/app.js', 'tests/test_app.js']);
    var second = analyzeRepo('owner/repo', []);
    expect(second).toBe(first);
  });

});

describe('testRatio', function () {

  it('should return 0 when there are no source files', function () {
    expect(testRatio(0, 0)).toEqual(0);
    expect(testRatio(5, 0)).toEqual(0);
  });

  it('should return 100 when test files equal source files', function () {
    expect(testRatio(10, 10)).toEqual(100);
  });

  it('should return correct percentage', function () {
    expect(testRatio(1, 3)).toEqual(33);
    expect(testRatio(1, 4)).toEqual(25);
    expect(testRatio(3, 10)).toEqual(30);
  });

  it('should round to nearest integer', function () {
    expect(testRatio(1, 3)).toEqual(33);
    expect(testRatio(2, 3)).toEqual(67);
  });

  it('should handle ratio greater than 100', function () {
    expect(testRatio(20, 10)).toEqual(200);
  });

});

describe('containsTest', function () {

  it('should return true when string contains "test"', function () {
    expect(containsTest('test_app.js')).toBe(true);
    expect(containsTest('app_test.js')).toBe(true);
    expect(containsTest('tests')).toBe(true);
  });

  it('should return false when string contains an exclude pattern', function () {
    expect(containsTest('latest')).toBe(false);
    expect(containsTest('latest.js')).toBe(false);
    expect(containsTest('LATEST')).toBe(false);
    expect(containsTest('contest.py')).toBe(false);
    expect(containsTest('attestation.yml')).toBe(false);
  });

  it('should return false when string does not contain "test"', function () {
    expect(containsTest('src/app.js')).toBe(false);
    expect(containsTest('utils.py')).toBe(false);
  });

});

describe('isTestRelatedFile', function () {

  it('should return true for a file inside a folder containing "test"', function () {
    expect(isTestRelatedFile('tests/app.js')).toBe(true);
    expect(isTestRelatedFile('test/app.js')).toBe(true);
    expect(isTestRelatedFile('src/test_helpers/utils.js')).toBe(true);
  });

  it('should return true for a file inside a folder exactly named "spec"', function () {
    expect(isTestRelatedFile('spec/app.js')).toBe(true);
    expect(isTestRelatedFile('src/spec/utils.js')).toBe(true);
  });

  it('should return false for a file inside a folder named "specs" (not exact match)', function () {
    expect(isTestRelatedFile('specs/app.js')).toBe(false);
    expect(isTestRelatedFile('myspec/app.js')).toBe(false);
  });

  it('should return false for a file not inside any test or spec folder', function () {
    expect(isTestRelatedFile('src/app.js')).toBe(false);
    expect(isTestRelatedFile('app.js')).toBe(false);
  });

  it('should return false for a file inside a folder with an exclude pattern', function () {
    expect(isTestRelatedFile('latest/app.js')).toBe(false);
    expect(isTestRelatedFile('attestation/app.js')).toBe(false);
    expect(isTestRelatedFile('contest/app.js')).toBe(false);
  });

});

describe('isBenchmarkFile', function () {

  it('should return true when "benchmark" is in the filename', function () {
    expect(isBenchmarkFile('benchmark_sort.js')).toBe(true);
    expect(isBenchmarkFile('sort_benchmark.py')).toBe(true);
    expect(isBenchmarkFile('app.benchmark.js')).toBe(true);
  });

  it('should return true when "benchmark" is in a directory name', function () {
    expect(isBenchmarkFile('benchmarks/sort.js')).toBe(true);
    expect(isBenchmarkFile('tests/benchmark/sort.js')).toBe(true);
  });

  it('should return true for mixed-case "benchmark" in path', function () {
    expect(isBenchmarkFile('BENCHMARKS/sort.js')).toBe(true);
    expect(isBenchmarkFile('tests/Benchmark_sort.js')).toBe(true);
  });

  it('should return false for files with no "benchmark" in name or path', function () {
    expect(isBenchmarkFile('src/app.js')).toBe(false);
    expect(isBenchmarkFile('tests/login.js')).toBe(false);
  });

});

describe('isFixtureFile', function () {

  it('should return true when "fixture" is in the filename', function () {
    expect(isFixtureFile('fixture_data.js')).toBe(true);
    expect(isFixtureFile('user_fixture.json')).toBe(true);
    expect(isFixtureFile('app.fixture.js')).toBe(true);
  });

  it('should return true when "fixture" is in a directory name', function () {
    expect(isFixtureFile('fixtures/data.json')).toBe(true);
    expect(isFixtureFile('tests/fixtures/user.json')).toBe(true);
    expect(isFixtureFile('src/fixture-data/app.js')).toBe(true);
  });

  it('should return true for mixed-case "fixture" in path', function () {
    expect(isFixtureFile('FIXTURES/data.json')).toBe(true);
    expect(isFixtureFile('tests/Fixture_data.js')).toBe(true);
  });

  it('should return false for files with no "fixture" in name or path', function () {
    expect(isFixtureFile('src/app.js')).toBe(false);
    expect(isFixtureFile('tests/login.js')).toBe(false);
    expect(isFixtureFile('e2e/app.test.js')).toBe(false);
  });

});

describe('isSmokeFile', function () {

  it('should return true when "smoke" is in the filename', function () {
    expect(isSmokeFile('smoke_test.js')).toBe(true);
    expect(isSmokeFile('test_smoke.py')).toBe(true);
    expect(isSmokeFile('app.smoke.js')).toBe(true);
  });

  it('should return true when "smoke" is in a directory name', function () {
    expect(isSmokeFile('smoke/login.js')).toBe(true);
    expect(isSmokeFile('tests/smoke/login.js')).toBe(true);
    expect(isSmokeFile('src/smoke-tests/app.js')).toBe(true);
  });

  it('should return true for mixed-case "smoke" in path', function () {
    expect(isSmokeFile('SMOKE/login.js')).toBe(true);
    expect(isSmokeFile('tests/Smoke_test.js')).toBe(true);
  });

  it('should return false for files with no "smoke" in name or path', function () {
    expect(isSmokeFile('src/app.js')).toBe(false);
    expect(isSmokeFile('tests/login.js')).toBe(false);
    expect(isSmokeFile('e2e/app.test.js')).toBe(false);
  });

});

describe('isCITestFile', function () {

  it('should return true for test files inside GitHub Actions folder', function () {
    expect(isCITestFile('.github/workflows/test.yml')).toBe(true);
    expect(isCITestFile('.github/test_pipeline.yml')).toBe(true);
  });

  it('should return true for test files inside Travis CI folder', function () {
    expect(isCITestFile('.travis/test.sh')).toBe(true);
    expect(isCITestFile('.travis/run_tests.sh')).toBe(true);
  });

  it('should return true for test files inside Circle CI folder', function () {
    expect(isCITestFile('.circleci/test.yml')).toBe(true);
    expect(isCITestFile('.circleci/test_config.yml')).toBe(true);
  });

  it('should return true for mixed-case ci folder or filename', function () {
    expect(isCITestFile('.github/workflows/TEST.yml')).toBe(true);
    expect(isCITestFile('.CIRCLECI/test.yml')).toBe(true);
  });

  it('should return false for non-test files inside a CI folder', function () {
    expect(isCITestFile('.github/workflows/deploy.yml')).toBe(false);
    expect(isCITestFile('.circleci/config.yml')).toBe(false);
    expect(isCITestFile('.travis/build.sh')).toBe(false);
  });

  it('should return false for test files outside a CI folder', function () {
    expect(isCITestFile('src/test_app.js')).toBe(false);
    expect(isCITestFile('tests/test_main.py')).toBe(false);
  });

  it('should return false for CI files with "latest" in the filename', function () {
    expect(isCITestFile('.github/workflows/latest.yml')).toBe(false);
    expect(isCITestFile('.circleci/latest.yml')).toBe(false);
  });

  it('should return false for test files inside an unrelated folder that partially matches', function () {
    expect(isCITestFile('mygithub/test.yml')).toBe(false);
    expect(isCITestFile('my-circleci/test.yml')).toBe(false);
  });

});

describe('isMockFile', function () {

  it('should return true for each mock pattern in a test folder', function () {
    expect(isMockFile('test/http_mock.py')).toBe(true);
    expect(isMockFile('test/http_stub.py')).toBe(true);
    expect(isMockFile('test/http_spy.py')).toBe(true);
    expect(isMockFile('test/http_dummy.py')).toBe(true);
    expect(isMockFile('test/http_fake.py')).toBe(true);
    expect(isMockFile('test/http_spies.py')).toBe(true);
    expect(isMockFile('test/http_dummies.py')).toBe(true);

    expect(isMockFile('__tests__/http_mock.py')).toBe(true);
    expect(isMockFile('__tests__/http_stub.py')).toBe(true);
    expect(isMockFile('__tests__/http_spy.py')).toBe(true);
    expect(isMockFile('__tests__/http_dummy.py')).toBe(true);
    expect(isMockFile('__tests__/http_fake.py')).toBe(true);
    expect(isMockFile('__tests__/http_spies.py')).toBe(true);
    expect(isMockFile('__tests__/http_dummies.py')).toBe(true);
  });

  it('should return true when pattern is a prefix or suffix in filename', function () {
    expect(isMockFile('tests/mock_server.js')).toBe(true);
    expect(isMockFile('tests/server_mock.js')).toBe(true);
    expect(isMockFile('tests/fake_data.py')).toBe(true);
  });

  it('should return true for nested test folder paths', function () {
    expect(isMockFile('src/tests/utils/mock_db.py')).toBe(true);
    expect(isMockFile('project/test/helpers/fake_client.rb')).toBe(true);
  });

  it('should return true for mixed case pattern or folder', function () {
    expect(isMockFile('Test/HTTP_MOCK.py')).toBe(true);
    expect(isMockFile('TESTS/FakeSender.java')).toBe(true);
  });

  it('should return true for mock files inside a "spec" folder', function () {
    expect(isMockFile('spec/mock_server.js')).toBe(true);
    expect(isMockFile('spec/fake_client.py')).toBe(true);
    expect(isMockFile('src/spec/stub_helper.js')).toBe(true);
  });

  it('should return false for mock files inside a folder that contains but is not exactly "spec"', function () {
    expect(isMockFile('myspec/mock_server.js')).toBe(false);
    expect(isMockFile('specs/fake_client.py')).toBe(false);
  });

  it('should return false when mock file is not inside a test folder', function () {
    expect(isMockFile('src/mock_server.js')).toBe(false);
    expect(isMockFile('lib/fake_client.py')).toBe(false);
    expect(isMockFile('mock_helper.py')).toBe(false);
  });

  it('should return false for a test file without a mock pattern', function () {
    expect(isMockFile('tests/app.js')).toBe(false);
    expect(isMockFile('test/test_main.py')).toBe(false);
  });

  it('should return false when only a directory (not filename) contains the mock pattern', function () {
    expect(isMockFile('test/mocks/server.js')).toBe(false);
    expect(isMockFile('tests/fakes/client.py')).toBe(false);
  });

  it('should return false when mock file is inside a "latest" folder', function () {
    expect(isMockFile('latest/mock_server.js')).toBe(false);
  });

});

describe('isE2EFile', function () {

  it('should return true when "e2e" is in the filename', function () {
    expect(isE2EFile('e2e_login.js')).toBe(true);
    expect(isE2EFile('login_e2e.js')).toBe(true);
    expect(isE2EFile('app.e2e.js')).toBe(true);
  });

  it('should return true when "e2e" is in a directory name', function () {
    expect(isE2EFile('e2e/login.js')).toBe(true);
    expect(isE2EFile('tests/e2e/login.js')).toBe(true);
    expect(isE2EFile('src/e2e-tests/app.js')).toBe(true);
  });

  it('should return true for mixed-case "e2e" in path', function () {
    expect(isE2EFile('E2E/login.js')).toBe(true);
    expect(isE2EFile('tests/E2E_login.js')).toBe(true);
  });

  it('should return false for files with no "e2e" in name or path', function () {
    expect(isE2EFile('src/app.js')).toBe(false);
    expect(isE2EFile('tests/login.js')).toBe(false);
    expect(isE2EFile('unit/app.test.js')).toBe(false);
  });

});

describe('isSnapshotFile', function () {

  it('should return true for a file inside a "snapshot" folder', function () {
    expect(isSnapshotFile('tests/__snapshots__/app.snap')).toBe(true);
    expect(isSnapshotFile('snapshots/output.snap')).toBe(true);
    expect(isSnapshotFile('test/snapshot/result.snap')).toBe(true);
  });

  it('should return true for a nested path with a snapshot folder', function () {
    expect(isSnapshotFile('src/tests/__snapshots__/utils.snap')).toBe(true);
  });

  it('should return true for mixed-case snapshot folder name', function () {
    expect(isSnapshotFile('tests/Snapshots/app.snap')).toBe(true);
    expect(isSnapshotFile('tests/SNAPSHOTS/app.snap')).toBe(true);
  });

  it('should return true for a file ending with ".snap"', function () {
    expect(isSnapshotFile('tests/app.snap')).toBe(true);
    expect(isSnapshotFile('app.snap')).toBe(true);
    expect(isSnapshotFile('src/utils.snap')).toBe(true);
  });

  it('should return false for a file not inside a snapshot folder and not ending with ".snap"', function () {
    expect(isSnapshotFile('src/app.js')).toBe(false);
    expect(isSnapshotFile('tests/app.js')).toBe(false);
  });

  it('should return false when only the filename contains "snapshot" without .snap extension', function () {
    expect(isSnapshotFile('src/snapshot_helper.js')).toBe(false);
  });

});

describe('isTestFile', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml']);
  });

  it('should return true for a file with "test" in the name', function () {
    expect(isTestFile('test_main.py')).toBe(true);
    expect(isTestFile('main_test.py')).toBe(true);
    expect(isTestFile('TEST_helper.py')).toBe(true);   
    expect(isTestFile('my_test_file.js')).toBe(true);
    expect(isTestFile('myTESTfile.java')).toBe(true);
  });

  it('should return true for a file ending with "test" before extension', function () {
    expect(isTestFile('app.test.js')).toBe(true);
  });

  it('should return true for a file with "test" in a path (matching filename only)', function () {
    expect(isTestFile('src/utils/test_helper.py')).toBe(true);
  });

  it('should return true for a file with "test" in a directory name but also in filename', function () {
    expect(isTestFile('tests/test_main.py')).toBe(true);
  });

  it('should return false for a file in a test directory but without "test" or "spec" in filename', function () {
    expect(isTestFile('tests/main.py')).toBe(false);
  });

  it('should return false for a regular source file', function () {
    expect(isTestFile('src/app.js')).toBe(false);
  });

  it('should return false for a file with "latest" in the name', function () {
    expect(isTestFile('latest.js')).toBe(false);
    expect(isTestFile('src/latest.js')).toBe(false);
  });

  it('should return true for a file named only "spec" with extension', function () {
    expect(isTestFile('spec.rb')).toBe(true);
    expect(isTestFile('app.spec.js')).toBe(true);
    expect(isTestFile('main.spec.js')).toBe(true);
    expect(isTestFile('main-spec.js')).toBe(true);
    expect(isTestFile('main_spec.js')).toBe(true);
    expect(isTestFile('main.spec.js.snap')).toBe(false);
    expect(isTestFile('myspec.js')).toBe(true);
    expect(isTestFile('foo_spec.rb')).toBe(true);
    expect(isTestFile('SPEC.rb')).toBe(true);
    expect(isTestFile('app.SPEC.js')).toBe(true);
    
  });

  it('should return false for a file where only the directory contains "spec"', function () {
    expect(isTestFile('specs/app.js')).toBe(false);
    expect(isTestFile('spec/main.py')).toBe(false);
  });

  it('should return true for a file with "spec" in a path (matching filename only)', function () {
    expect(isTestFile('src/spec/main_spec.py')).toBe(true);
  });

  it('should return false for a file ending with "specification" (not exact "spec")', function () {
    expect(isTestFile('specification.md')).toBe(false);
  });
});

describe('classifyFile', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']);
  });

  it('should return "benchmark" for benchmark files', function () {
    expect(classifyFile('benchmarks/sort.js')).toEqual('benchmark');
    expect(classifyFile('benchmark_sort.js')).toEqual('benchmark');
  });

  it('should return "fixture" for fixture files', function () {
    expect(classifyFile('tests/fixtures/user.json')).toEqual('fixture');
    expect(classifyFile('fixture_data.js')).toEqual('fixture');
  });

  it('should return "smoke" for smoke files', function () {
    expect(classifyFile('smoke/login.js')).toEqual('smoke');
    expect(classifyFile('tests/smoke_test.js')).toEqual('smoke');
  });

  it('should return "ci-test" for CI test files', function () {
    expect(classifyFile('.github/workflows/test.yml')).toEqual('ci-test');
    expect(classifyFile('.circleci/test_config.yml')).toEqual('ci-test');
  });

  it('should return "snapshot" for snapshot files', function () {
    expect(classifyFile('tests/__snapshots__/app.snap')).toEqual('snapshot');
    expect(classifyFile('tests/output.snap')).toEqual('snapshot');
  });

  it('should return "e2e" for e2e files', function () {
    expect(classifyFile('e2e/login.js')).toEqual('e2e');
    expect(classifyFile('tests/app.e2e.js')).toEqual('e2e');
  });

  it('should return "mock" for mock files', function () {
    expect(classifyFile('tests/mock_db.js')).toEqual('mock');
    expect(classifyFile('tests/fake_api.js')).toEqual('mock');
  });

  it('should return "test" for test files', function () {
    expect(classifyFile('tests/test_app.js')).toEqual('test');
    expect(classifyFile('src/app.test.js')).toEqual('test');
    expect(classifyFile('app.spec.js')).toEqual('test');
  });

  it('should return "test-related" for test-related files', function () {
    expect(classifyFile('tests/utils.js')).toEqual('test-related');
    expect(classifyFile('spec/helpers.js')).toEqual('test-related');
  });

  it('should return "source" for regular source files', function () {
    expect(classifyFile('src/app.js')).toEqual('source');
    expect(classifyFile('lib/utils.py')).toEqual('source');
  });

  it('should return "other" for files without extensions', function () {
    expect(classifyFile('Makefile')).toEqual('other');
    expect(classifyFile('LICENSE')).toEqual('other');
  });

  it('should prioritize benchmark over test', function () {
    expect(classifyFile('tests/benchmark_test.js')).toEqual('benchmark');
  });

  it('should prioritize fixture over test', function () {
    expect(classifyFile('tests/fixture_test.js')).toEqual('fixture');
  });

  it('should prioritize smoke over test', function () {
    expect(classifyFile('tests/smoke_test.js')).toEqual('smoke');
  });

  it('should prioritize e2e over test', function () {
    expect(classifyFile('tests/app.e2e.test.js')).toEqual('e2e');
  });

});

describe('classifyFiles', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']);
  });

  it('should return an empty object for empty input', function () {
    expect(classifyFiles([])).toEqual({});
  });

  it('should group filepaths by classification', function () {
    var result = classifyFiles(['src/app.js', 'tests/test_app.js']);
    expect(result.source).toEqual(['src/app.js']);
    expect(result.test).toEqual(['tests/test_app.js']);
  });

  it('should classify multiple file types correctly', function () {
    var filepaths = [
      'src/app.js',
      'tests/test_app.js',
      'tests/mock_db.js',
      'e2e/login.js',
      'benchmarks/sort.js',
      'tests/fixtures/user.json',
      'smoke/login.js',
      '.github/workflows/test.yml',
      'tests/__snapshots__/app.snap',
      'tests/utils.js'
    ];
    var result = classifyFiles(filepaths);
    expect(result.source).toEqual(['src/app.js']);
    expect(result.test).toEqual(['tests/test_app.js']);
    expect(result.mock).toEqual(['tests/mock_db.js']);
    expect(result.e2e).toEqual(['e2e/login.js']);
    expect(result.benchmark).toEqual(['benchmarks/sort.js']);
    expect(result.fixture).toEqual(['tests/fixtures/user.json']);
    expect(result.smoke).toEqual(['smoke/login.js']);
    expect(result['ci-test']).toEqual(['.github/workflows/test.yml']);
    expect(result.snapshot).toEqual(['tests/__snapshots__/app.snap']);
    expect(result['test-related']).toEqual(['tests/utils.js']);
  });

  it('should group multiple files under the same classification', function () {
    var result = classifyFiles(['src/app.js', 'src/utils.js']);
    expect(result.source).toEqual(['src/app.js', 'src/utils.js']);
  });

  it('should classify real jsdelivr data', function () {
    var filepaths = parseJsDelivrFiles(jsdelivrGitevoData);
    var result = classifyFiles(filepaths);
    expect(result.test).toContain('tests/test_main.py');
    expect(result.source).toContain('gitevo/main.py');
  });

});

describe('isSourceFile', function () {

  beforeAll(function () {
    extensionSet = new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml']);
  });

  it('should return true for files with known source extensions', function () {
    expect(isSourceFile('src/app.js')).toBe(true);
    expect(isSourceFile('main.py')).toBe(true);
    expect(isSourceFile('App.java')).toBe(true);
    expect(isSourceFile('index.ts')).toBe(true);
    expect(isSourceFile('server.rb')).toBe(true);
    expect(isSourceFile('main.go')).toBe(true);
  });

  it('should return true regardless of directory path', function () {
    expect(isSourceFile('src/utils/helper.js')).toBe(true);
    expect(isSourceFile('tests/test_main.py')).toBe(true);
    expect(isSourceFile('deep/nested/path/file.rs')).toBe(true);
  });

  it('should return false for files without an extension', function () {
    expect(isSourceFile('Makefile')).toBe(false);
    expect(isSourceFile('src/Dockerfile')).toBe(false);
    expect(isSourceFile('LICENSE')).toBe(false);
  });

  it('should return false for files with unknown extensions', function () {
    expect(isSourceFile('image.png')).toBe(false);
    expect(isSourceFile('data.bin')).toBe(false);
    expect(isSourceFile('archive.zip')).toBe(false);
  });

  it('should be case-insensitive for extensions', function () {
    expect(isSourceFile('App.JS')).toBe(true);
    expect(isSourceFile('Main.PY')).toBe(true);
    expect(isSourceFile('index.Ts')).toBe(true);
  });

  it('should match on the filename extension, not directory dots', function () {
    expect(isSourceFile('my.project/app.js')).toBe(true);
    expect(isSourceFile('my.project/Makefile')).toBe(false);
  });

  it('should return false when extensionSet is null', function () {
    var saved = extensionSet;
    extensionSet = null;
    expect(isSourceFile('app.js')).toBe(false);
    extensionSet = saved;
  });

});
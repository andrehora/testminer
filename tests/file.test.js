var tm = require('../src/tminer');
var computeTestStats = tm.computeTestStats;
var classifyFiles = tm.classifyFiles;
var classifyFile = tm.classifyFile;
var analyzeRepo = tm.analyzeRepo;
var containsTest = tm.containsTest;
var isTestHelperFile = tm.isTestHelperFile;
var isBenchmarkFile = tm.isBenchmarkFile;
var isFixtureFile = tm.isFixtureFile;
var isSmokeFile = tm.isSmokeFile;
var isCITestFile = tm.isCITestFile;
var isMockFile = tm.isMockFile;
var isE2EFile = tm.isE2EFile;
var isSnapshotFile = tm.isSnapshotFile;
var isTestFile = tm.isTestFile;
var parseTerms = tm.parseTerms;
var groupFilesByTerms = tm.groupFilesByTerms;

describe('computeTestStats', function () {

  beforeAll(function () {
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.sh', '.snap']));
  });

  it('should return zeros for an empty classified object', function () {
    const result = computeTestStats({});
    expect(result.total).toEqual(0);
    expect(result.sourceFiles).toEqual(0);
    expect(result.testFiles).toEqual(0);
    expect(result.mockFiles).toEqual(0);
    expect(result.e2eFiles).toEqual(0);
    expect(result.snapshotFiles).toEqual(0);
    expect(result.ciTestFiles).toEqual(0);
    expect(result.smokeFiles).toEqual(0);
    expect(result.fixtureFiles).toEqual(0);
    expect(result.benchmarkFiles).toEqual(0);
    expect(result.testHelperFiles).toEqual(0);
  });

  it('should return correct total count', function () {
    const result = computeTestStats({ source: ['src/app.js', 'src/utils.js'], tests: ['tests/test_app.js'] });
    expect(result.total).toEqual(3);
  });

  it('should return correct test file count', function () {
    const result = computeTestStats({ source: ['src/app.js', 'src/utils.js'], tests: ['tests/test_app.js'] });
    expect(result.testFiles).toEqual(1);
  });

  it('should return correct mock file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], mocks: ['tests/mock_db.js', 'tests/fake_api.js'] });
    expect(result.mockFiles).toEqual(2);
  });

  it('should return correct e2e file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], e2e: ['e2e/login.js', 'tests/app.e2e.js'] });
    expect(result.e2eFiles).toEqual(2);
  });

  it('should return correct snapshot file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], snapshots: ['tests/__snapshots__/app.snap', 'tests/output.snap'] });
    expect(result.snapshotFiles).toEqual(2);
  });

  it('should return correct ci test file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], 'ci-tests': ['.github/workflows/test.yml', '.circleci/test_config.yml'] });
    expect(result.ciTestFiles).toEqual(2);
  });

  it('should return correct smoke file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], smoke: ['smoke/login.js', 'tests/smoke_test.js'] });
    expect(result.smokeFiles).toEqual(2);
  });

  it('should return correct fixture file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], fixtures: ['tests/fixtures/user.json', 'tests/fixture_data.js'] });
    expect(result.fixtureFiles).toEqual(2);
  });

  it('should return correct benchmark file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], benchmarks: ['benchmarks/sort.js', 'benchmark_sort.js'] });
    expect(result.benchmarkFiles).toEqual(2);
  });

  it('should return correct test helper file count', function () {
    const result = computeTestStats({ source: ['src/app.js'], 'test-helpers': ['tests/utils.js', 'spec/helpers.js'] });
    expect(result.testHelperFiles).toEqual(2);
  });
});

describe('analyzeRepo', function () {

  beforeAll(function () {
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']));
  });

  beforeEach(function () {
    tm.resetAnalyzeRepoCache();
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
    expect(result.stats.sourceFiles).toEqual(1);
    expect(result.stats.testFiles).toEqual(1);
  });

  it('should have correct classified files', function () {
    var result = analyzeRepo('owner/repo', ['src/app.js', 'tests/test_app.js']);
    expect(result.files.source).toEqual(['src/app.js']);
    expect(result.files.tests).toEqual(['tests/test_app.js']);
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

describe('isTestHelperFile', function () {

  it('should return true for a file inside a folder containing "test"', function () {
    expect(isTestHelperFile('tests/app.js')).toBe(true);
    expect(isTestHelperFile('test/app.js')).toBe(true);
    expect(isTestHelperFile('src/test_helpers/utils.js')).toBe(true);
  });

  it('should return true for a file inside a folder exactly named "spec"', function () {
    expect(isTestHelperFile('spec/app.js')).toBe(true);
    expect(isTestHelperFile('src/spec/utils.js')).toBe(true);
  });

  it('should return false for a file inside a folder named "specs" (not exact match)', function () {
    expect(isTestHelperFile('specs/app.js')).toBe(false);
    expect(isTestHelperFile('myspec/app.js')).toBe(false);
  });

  it('should return false for a file not inside any test or spec folder', function () {
    expect(isTestHelperFile('src/app.js')).toBe(false);
    expect(isTestHelperFile('app.js')).toBe(false);
  });

  it('should return false for a file inside a folder with an exclude pattern', function () {
    expect(isTestHelperFile('latest/app.js')).toBe(false);
    expect(isTestHelperFile('attestation/app.js')).toBe(false);
    expect(isTestHelperFile('contest/app.js')).toBe(false);
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

  it('should return true when "fixture" is in a test folder', function () {
    expect(isFixtureFile('tests/fixtures/user.json')).toBe(true);
    expect(isFixtureFile('tests/Fixture_data.js')).toBe(true);
    expect(isFixtureFile('test/fixture-data/app.js')).toBe(true);
    expect(isFixtureFile('spec/fixtures/data.json')).toBe(true);
  });

  it('should return false when "fixture" is not in a test folder', function () {
    expect(isFixtureFile('fixture_data.js')).toBe(false);
    expect(isFixtureFile('user_fixture.json')).toBe(false);
    expect(isFixtureFile('fixtures/data.json')).toBe(false);
    expect(isFixtureFile('src/fixture-data/app.js')).toBe(false);
    expect(isFixtureFile('FIXTURES/data.json')).toBe(false);
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

  it('should return true for a file inside a "snapshot" folder within a test folder', function () {
    expect(isSnapshotFile('tests/__snapshots__/app.snap')).toBe(true);
    expect(isSnapshotFile('test/snapshot/result.snap')).toBe(true);
  });

  it('should return true for a nested path with a snapshot folder', function () {
    expect(isSnapshotFile('src/tests/__snapshots__/utils.snap')).toBe(true);
  });

  it('should return true for mixed-case snapshot folder name', function () {
    expect(isSnapshotFile('tests/Snapshots/app.snap')).toBe(true);
    expect(isSnapshotFile('tests/SNAPSHOTS/app.snap')).toBe(true);
  });

  it('should return true for a file ending with ".snap" within a test folder', function () {
    expect(isSnapshotFile('tests/app.snap')).toBe(true);
  });

  it('should return false for a ".snap" file not within a test folder', function () {
    expect(isSnapshotFile('app.snap')).toBe(false);
    expect(isSnapshotFile('src/utils.snap')).toBe(false);
    expect(isSnapshotFile('snapshots/output.snap')).toBe(false);
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
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml']));
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
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']));
  });

  it('should return "benchmark" for benchmark files', function () {
    expect(classifyFile('benchmarks/sort.js')).toEqual('benchmarks');
    expect(classifyFile('benchmark_sort.js')).toEqual('benchmarks');
  });

  it('should return "fixture" for fixture files', function () {
    expect(classifyFile('tests/fixtures/user.json')).toEqual('fixtures');
    expect(classifyFile('tests/fixture_data.js')).toEqual('fixtures');
  });

  it('should return "smoke" for smoke files', function () {
    expect(classifyFile('smoke/login.js')).toEqual('smoke');
    expect(classifyFile('tests/smoke_test.js')).toEqual('smoke');
  });

  it('should return "ci-test" for CI test files', function () {
    expect(classifyFile('.github/workflows/test.yml')).toEqual('ci-tests');
    expect(classifyFile('.circleci/test_config.yml')).toEqual('ci-tests');
  });

  it('should return "snapshot" for snapshot files', function () {
    expect(classifyFile('tests/__snapshots__/app.snap')).toEqual('snapshots');
    expect(classifyFile('tests/output.snap')).toEqual('snapshots');
  });

  it('should return "e2e" for e2e files', function () {
    expect(classifyFile('e2e/login.js')).toEqual('e2e');
    expect(classifyFile('tests/app.e2e.js')).toEqual('e2e');
  });

  it('should return "mock" for mock files', function () {
    expect(classifyFile('tests/mock_db.js')).toEqual('mocks');
    expect(classifyFile('tests/fake_api.js')).toEqual('mocks');
  });

  it('should return "test" for test files', function () {
    expect(classifyFile('tests/test_app.js')).toEqual('tests');
    expect(classifyFile('src/app.test.js')).toEqual('tests');
    expect(classifyFile('app.spec.js')).toEqual('tests');
  });

  it('should return "test-helper" for test helper files', function () {
    expect(classifyFile('tests/utils.js')).toEqual('test-helpers');
    expect(classifyFile('spec/helpers.js')).toEqual('test-helpers');
  });

  it('should return "source" for regular source files', function () {
    expect(classifyFile('src/app.js')).toEqual('source');
    expect(classifyFile('lib/utils.py')).toEqual('source');
  });

  it('should return "source" for files without extensions', function () {
    expect(classifyFile('Makefile')).toEqual('source');
    expect(classifyFile('LICENSE')).toEqual('source');
  });

  it('should prioritize benchmark over test', function () {
    expect(classifyFile('tests/benchmark_test.js')).toEqual('benchmarks');
  });

  it('should prioritize fixture over test', function () {
    expect(classifyFile('tests/fixture_test.js')).toEqual('fixtures');
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
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.snap']));
  });

  it('should return an empty object for empty input', function () {
    expect(classifyFiles([])).toEqual({});
  });

  it('should group filepaths by classification', function () {
    var result = classifyFiles(['src/app.js', 'tests/test_app.js']);
    expect(result.source).toEqual(['src/app.js']);
    expect(result.tests).toEqual(['tests/test_app.js']);
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
    expect(result.tests).toEqual(['tests/test_app.js']);
    expect(result.mocks).toEqual(['tests/mock_db.js']);
    expect(result.e2e).toEqual(['e2e/login.js']);
    expect(result.benchmarks).toEqual(['benchmarks/sort.js']);
    expect(result.fixtures).toEqual(['tests/fixtures/user.json']);
    expect(result.smoke).toEqual(['smoke/login.js']);
    expect(result['ci-tests']).toEqual(['.github/workflows/test.yml']);
    expect(result.snapshots).toEqual(['tests/__snapshots__/app.snap']);
    expect(result['test-helpers']).toEqual(['tests/utils.js']);
  });

  it('should group multiple files under the same classification', function () {
    var result = classifyFiles(['src/app.js', 'src/utils.js']);
    expect(result.source).toEqual(['src/app.js', 'src/utils.js']);
  });

  it('should skip files with unknown extensions', function () {
    var result = classifyFiles(['src/app.js', 'Makefile', 'LICENSE', 'src/image.png']);
    expect(result.source).toEqual(['src/app.js']);
    expect(result.other).toBeUndefined();
  });
});


describe('parseTerms', function () {

  it('should split on underscores', function () {
    expect(parseTerms('test_foo')).toEqual(['foo']);
    expect(parseTerms('test_foo_bar')).toEqual(['foo', 'bar']);
  });

  it('should split on hyphens', function () {
    expect(parseTerms('test-foo')).toEqual(['foo']);
    expect(parseTerms('test-foo-bar')).toEqual(['foo', 'bar']);
  });

  it('should split on camelCase boundaries', function () {
    expect(parseTerms('testFoo')).toEqual(['foo']);
    expect(parseTerms('testFooBar')).toEqual(['foo', 'bar']);
  });

  it('should preserve uppercase acronyms', function () {
    expect(parseTerms('testABC')).toEqual(['ABC']);
    expect(parseTerms('httpTestAAA')).toEqual(['http', 'AAA']);
  });

  it('should omit the test term', function () {
    expect(parseTerms('test')).toEqual([]);
    expect(parseTerms('Test')).toEqual([]);
    expect(parseTerms('TEST')).toEqual([]);
  });

  it('should omit terms with less than 3 characters', function () {
    expect(parseTerms('testFooA')).toEqual(['foo']);
    expect(parseTerms('test_a_bar')).toEqual(['bar']);
    expect(parseTerms('testAbCD')).toEqual([]);
  });

  it('should handle a single non-test term', function () {
    expect(parseTerms('FOO')).toEqual(['FOO']);
    expect(parseTerms('foo')).toEqual(['foo']);
  });

  it('should handle empty string', function () {
    expect(parseTerms('')).toEqual([]);
  });

  it('should handle mixed separators and camelCase', function () {
    expect(parseTerms('test_fooBar')).toEqual(['foo', 'bar']);
    expect(parseTerms('test-fooBar')).toEqual(['foo', 'bar']);
  });

});

describe('groupFilesByTerms', function () {

  it('should return an empty object for empty input', function () {
    expect(groupFilesByTerms([])).toEqual({});
  });

  it('should map a single term to its filepath', function () {
    var result = groupFilesByTerms(['src/userService.js']);
    expect(result['user']).toEqual(['src/userService.js']);
    expect(result['service']).toEqual(['src/userService.js']);
  });

  it('should map a term to multiple filepaths', function () {
    var result = groupFilesByTerms(['src/userService.js', 'tests/userController.js']);
    expect(result['user']).toEqual(['src/userService.js', 'tests/userController.js']);
    expect(result['service']).toEqual(['src/userService.js']);
    expect(result['controller']).toEqual(['tests/userController.js']);
  });

  it('should use only the filename, not the directory path, for terms', function () {
    var result = groupFilesByTerms(['order/userService.js']);
    expect(result['user']).toEqual(['order/userService.js']);
    expect(result['service']).toEqual(['order/userService.js']);
    expect(result['order']).toBeUndefined();
  });

  it('should strip the file extension before parsing terms', function () {
    var result = groupFilesByTerms(['src/orderService.test.js']);
    expect(result['order']).toEqual(['src/orderService.test.js']);
    expect(result['service']).toEqual(['src/orderService.test.js']);
    expect(result['test']).toBeUndefined();

    var result = groupFilesByTerms(['src/orderService.js.snap']);
    expect(result['order']).toEqual(['src/orderService.js.snap']);
    expect(result['service']).toEqual(['src/orderService.js.snap']);
    expect(result['snap']).toBeUndefined();
  });

  it('should store the full filepath as value', function () {
    var result = groupFilesByTerms(['src/utils/paymentService.js']);
    expect(result['payment']).toEqual(['src/utils/paymentService.js']);
    expect(result['service']).toEqual(['src/utils/paymentService.js']);
  });

  it('should omit terms shorter than 3 characters', function () {
    var result = groupFilesByTerms(['src/dbUtil.js']);
    expect(result['db']).toBeUndefined();
    expect(result['util']).toEqual(['src/dbUtil.js']);
  });

  it('should omit the term "test"', function () {
    var result = groupFilesByTerms(['src/userTest.js']);
    expect(result['test']).toBeUndefined();
    expect(result['user']).toEqual(['src/userTest.js']);
  });

  it('should handle filenames with underscores and hyphens', function () {
    var result = groupFilesByTerms(['src/order-service_helper.js']);
    expect(result['order']).toEqual(['src/order-service_helper.js']);
    expect(result['service']).toEqual(['src/order-service_helper.js']);
    expect(result['helper']).toEqual(['src/order-service_helper.js']);
  });

});
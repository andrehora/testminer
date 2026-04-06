var tm = require('../src/tminer');
var parseJsDelivrFiles = tm.parseJsDelivrFiles;
var classifyFiles = tm.classifyFiles;
var computeTestStats = tm.computeTestStats;

var jsdelivrGitevoData = require('./fixtures/jsdelivr-gitevo');

describe('parseJsDelivrFiles', function () {

  beforeAll(function () {
    tm.setExtensionSet(new Set(['.js', '.py', '.java', '.ts', '.rb', '.go', '.rs', '.c', '.cpp', '.html', '.css', '.json', '.md', '.yml', '.toml', '.sh', '.snap', '.gitignore']));
  });

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

  it('should classify real jsdelivr data', function () {
    var filepaths = parseJsDelivrFiles(jsdelivrGitevoData);
    var result = classifyFiles(filepaths);
    expect(result.test).toContain('tests/test_main.py');
    expect(result.source).toContain('gitevo/main.py');
  });

});
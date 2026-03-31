var tm = require('../src/tminer');
var parseSBOM = tm.parseSBOM;
var filterTestDependencies = tm.filterTestDependencies;

var npmData = require('./fixtures/sbom-npm');
var golangData = require('./fixtures/sbom-golang');
var pypiData = require('./fixtures/sbom-pypi');
var composerData = require('./fixtures/sbom-composer');
var cargoData = require('./fixtures/sbom-cargo');
var gemData = require('./fixtures/sbom-gem');
var nugetData = require('./fixtures/sbom-nuget');
var emptyData = require('./fixtures/sbom-empty');

describe('parseSBOM', function () {

  it('should parse npm packages (expressjs/express)', function () {
    const result = parseSBOM(npmData);
    expect(result).toEqual([
      { name: 'supertest', ecosystem: 'npm' },
      { name: 'pbkdf2-password', ecosystem: 'npm' },
      { name: 'eslint', ecosystem: 'npm' }
    ]);
  });

  it('should parse golang packages (gin-gonic/gin)', function () {
    const result = parseSBOM(golangData);
    expect(result).toEqual([
      { name: 'github.com/twitchyliquid64/golang-asm', ecosystem: 'golang' },
      { name: 'github.com/quic-go/quic-go', ecosystem: 'golang' },
      { name: 'github.com/klauspost/cpuid/v2', ecosystem: 'golang' }
    ]);
  });

  it('should parse pypi packages (pallets/flask)', function () {
    const result = parseSBOM(pypiData);
    expect(result).toEqual([
      { name: 'roman-numerals', ecosystem: 'pypi' },
      { name: 'jinja2', ecosystem: 'pypi' },
      { name: 'sphinxcontrib-htmlhelp', ecosystem: 'pypi' }
    ]);
  });

  it('should parse composer packages (laravel/laravel)', function () {
    const result = parseSBOM(composerData);
    expect(result).toEqual([
      { name: 'fakerphp/faker', ecosystem: 'composer' },
      { name: 'mockery/mockery', ecosystem: 'composer' },
      { name: 'php', ecosystem: 'composer' }
    ]);
  });

  it('should parse cargo packages (tokio-rs/tokio)', function () {
    const result = parseSBOM(cargoData);
    expect(result).toEqual([
      { name: 'libfuzzer-sys', ecosystem: 'cargo' },
      { name: 'futures-util', ecosystem: 'cargo' },
      { name: 'tokio', ecosystem: 'cargo' }
    ]);
  });

  it('should parse gem packages (rails/rails)', function () {
    const result = parseSBOM(gemData);
    expect(result).toEqual([
      { name: 'builder', ecosystem: 'gem' },
      { name: 'erubi', ecosystem: 'gem' },
      { name: 'spring', ecosystem: 'gem' }
    ]);
  });

  it('should parse nuget packages (dotnet/aspnetcore)', function () {
    const result = parseSBOM(nugetData);
    expect(result).toEqual([
      { name: 'Microsoft.ManifestTool.CrossPlatform', ecosystem: 'nuget' },
      { name: 'Microsoft.VisualStudioEng.MicroBuild.Core', ecosystem: 'nuget' },
      { name: 'Microsoft.VisualStudioEng.MicroBuild.Plugins.SwixBuild', ecosystem: 'nuget' }
    ]);
  });

  it('should return empty array when repo has no dependencies', function () {
    const result = parseSBOM(emptyData);
    expect(result).toEqual([]);
  });

});

describe('filterTestDependencies', function () {

  it('should match exact name in testLibs', function () {
    const pkgs = [{ name: 'jest', ecosystem: 'npm' }, { name: 'express', ecosystem: 'npm' }];
    const libs = new Set(['jest']);
    expect(filterTestDependencies(pkgs, libs)).toEqual([{ name: 'jest', ecosystem: 'npm' }]);
  });

  it('should match full scoped name in testLibs', function () {
    const pkgs = [{ name: '@jest/core', ecosystem: 'npm' }];
    const libs = new Set(['core']);
    expect(filterTestDependencies(pkgs, libs)).toEqual([{ name: '@jest/core', ecosystem: 'npm' }]);
  });

  it('should match package with "test" substring', function () {
    const pkgs = [{ name: 'unittest2', ecosystem: 'pypi' }, { name: 'requests', ecosystem: 'pypi' }];
    expect(filterTestDependencies(pkgs, new Set())).toEqual([{ name: 'unittest2', ecosystem: 'pypi' }]);
  });

  it('should match package with "mock" substring', function () {
    const pkgs = [{ name: 'mock-server', ecosystem: 'npm' }, { name: 'lodash', ecosystem: 'npm' }];
    expect(filterTestDependencies(pkgs, new Set())).toEqual([{ name: 'mock-server', ecosystem: 'npm' }]);
  });

  it('should match package prefixed with testLib name and hyphen', function () {
    const pkgs = [{ name: 'pytest-foo', ecosystem: 'pypi' }, { name: 'requests', ecosystem: 'pypi' }];
    const libs = new Set(['pytest']);
    expect(filterTestDependencies(pkgs, libs)).toEqual([{ name: 'pytest-foo', ecosystem: 'pypi' }]);
  });

  it('should match package prefixed with testLib name and underscore', function () {
    const pkgs = [{ name: 'jest_extended', ecosystem: 'npm' }];
    const libs = new Set(['jest']);
    expect(filterTestDependencies(pkgs, libs)).toEqual([{ name: 'jest_extended', ecosystem: 'npm' }]);
  });

  it('should not match unrelated packages', function () {
    const pkgs = [{ name: 'lodash', ecosystem: 'npm' }, { name: 'express', ecosystem: 'npm' }];
    const libs = new Set(['jest', 'mocha']);
    expect(filterTestDependencies(pkgs, libs)).toEqual([]);
  });

  it('should return empty array for empty input', function () {
    expect(filterTestDependencies([], new Set(['jest']))).toEqual([]);
  });

});

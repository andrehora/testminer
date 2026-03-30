var tm = require('../src/tminer');
var parseSBOM = tm.parseSBOM;

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

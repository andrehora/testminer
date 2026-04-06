var tm = require('../src/tminer');
var parseOwnerRepo = tm.parseOwnerRepo;
var parseGitHubOwnerRepo = tm.parseGitHubOwnerRepo;
var parseGitHubOwner = tm.parseGitHubOwner;
var parseEcosystemFromPurl = tm.parseEcosystemFromPurl;

describe('parseOwnerRepo', function () {

  it('should return baseRepo and empty versionTag when no @', function () {
    const result = parseOwnerRepo('octocat/hello-world');
    expect(result.baseRepo).toEqual('octocat/hello-world');
    expect(result.versionTag).toEqual('');
  });

  it('should split baseRepo and versionTag at @', function () {
    const result = parseOwnerRepo('octocat/hello-world@v1.0.0');
    expect(result.baseRepo).toEqual('octocat/hello-world');
    expect(result.versionTag).toEqual('v1.0.0');
  });

  it('should handle version tag without v prefix', function () {
    const result = parseOwnerRepo('octocat/hello-world@1.2.3');
    expect(result.baseRepo).toEqual('octocat/hello-world');
    expect(result.versionTag).toEqual('1.2.3');
  });

});

describe('parseGitHubOwnerRepo', function () {

  it('should parse an https GitHub URL', function () {
    const result = parseGitHubOwnerRepo('https://github.com/octocat/hello-world');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse an http GitHub URL', function () {
    const result = parseGitHubOwnerRepo('http://github.com/octocat/hello-world');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse a URL with trailing slash', function () {
    const result = parseGitHubOwnerRepo('https://github.com/octocat/hello-world/');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse a URL with subpaths', function () {
    const result = parseGitHubOwnerRepo('https://github.com/octocat/hello-world/tree/main');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse a .git URL', function () {
    const result = parseGitHubOwnerRepo('https://github.com/octocat/hello-world.git');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse a URL without protocol', function () {
    const result = parseGitHubOwnerRepo('github.com/octocat/hello-world');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should parse owner/repo shorthand', function () {
    const result = parseGitHubOwnerRepo('octocat/hello-world');
    expect(result).toEqual('octocat/hello-world');
  });

  it('should return null for an invalid URL', function () {
    const result = parseGitHubOwnerRepo('https://example.com/foo');
    expect(result).toBeNull();
  });

  it('should return null for an empty string', function () {
    const result = parseGitHubOwnerRepo('');
    expect(result).toBeNull();
  });

});

describe('parseGitHubOwner', function () {

  it('should parse owner from https GitHub URL', function () {
    const result = parseGitHubOwner('https://github.com/octocat');
    expect(result).toEqual('octocat');
  });

  it('should parse owner from http GitHub URL', function () {
    const result = parseGitHubOwner('http://github.com/octocat');
    expect(result).toEqual('octocat');
  });

  it('should parse owner from URL without protocol', function () {
    const result = parseGitHubOwner('github.com/octocat');
    expect(result).toEqual('octocat');
  });

  it('should parse owner shorthand', function () {
    const result = parseGitHubOwner('octocat');
    expect(result).toEqual('octocat');
  });

  it('should return null for an empty string', function () {
    const result = parseGitHubOwner('');
    expect(result).toBeNull();
  });

});

describe('parseEcosystemFromPurl', function () {

  it('should extract npm ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:npm/lodash@4.17.21' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('npm');
  });

  it('should extract pypi ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:pypi/flask@3.0.0' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('pypi');
  });

  it('should extract maven ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:maven/com.google.guava/guava@31.1' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('maven');
  });

  it('should extract golang ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:golang/golang.org/x/sys@v0.42.0' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('golang');
  });

  it('should extract composer ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:composer/mockery/mockery' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('composer');
  });

  it('should extract cargo ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:cargo/serde_derive' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('cargo');
  });

  it('should extract gem ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:gem/nokogiri' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('gem');
  });

  it('should extract nuget ecosystem', function () {
    const pkg = { externalRefs: [{ referenceType: 'purl', referenceLocator: 'pkg:nuget/Microsoft.EntityFrameworkCore' }] };
    expect(parseEcosystemFromPurl(pkg)).toEqual('nuget');
  });

  it('should return null when no externalRefs', function () {
    const pkg = {};
    expect(parseEcosystemFromPurl(pkg)).toBeNull();
  });

  it('should return null when no purl ref exists', function () {
    const pkg = { externalRefs: [{ referenceType: 'other', referenceLocator: 'something' }] };
    expect(parseEcosystemFromPurl(pkg)).toBeNull();
  });

});

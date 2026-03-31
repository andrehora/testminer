var tm = require('../src/tminer');
var filterSemverVersions = tm.filterSemverVersions;

describe('filterSemverVersions', function () {

  it('should keep standard semver versions', function () {
    expect(filterSemverVersions(['1.0.0', '2.3.4', '0.0.1'])).toEqual(['1.0.0', '2.3.4', '0.0.1']);
  });

  it('should keep versions with v prefix', function () {
    expect(filterSemverVersions(['v1.0.0', 'v2.3.4'])).toEqual(['v1.0.0', 'v2.3.4']);
  });

  it('should filter out non-semver tags', function () {
    expect(filterSemverVersions(['latest', 'main', 'release'])).toEqual([]);
  });

  it('should filter out partial versions', function () {
    expect(filterSemverVersions(['1.0', '2'])).toEqual([]);
  });

  it('should filter out versions with extra segments', function () {
    expect(filterSemverVersions(['1.0.0.0', '1.0.0-beta'])).toEqual([]);
  });

  it('should handle a mixed list', function () {
    expect(filterSemverVersions(['v1.0.0', 'latest', '2.3.4', 'main', 'v0.1.0'])).toEqual(['v1.0.0', '2.3.4', 'v0.1.0']);
  });

  it('should return empty array for empty input', function () {
    expect(filterSemverVersions([])).toEqual([]);
  });

});

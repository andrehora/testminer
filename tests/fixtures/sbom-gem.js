var gemData = {
  "sbom": {
    "spdxVersion": "SPDX-2.3",
    "name": "com.github.rails/rails",
    "packages": [
      {
        "name": "com.github.rails/rails",
        "SPDXID": "SPDXRef-github-rails-rails-main-761819",
        "versionInfo": "main",
        "downloadLocation": "git+https://github.com/rails/rails",
        "filesAnalyzed": false,
        "licenseDeclared": "MIT",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:github/rails/rails@main"
          }
        ]
      },
      {
        "name": "builder",
        "SPDXID": "SPDXRef-gem-builder-75c946",
        "versionInfo": "~> 3.1",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:gem/builder"
          }
        ]
      },
      {
        "name": "erubi",
        "SPDXID": "SPDXRef-gem-erubi-75c946",
        "versionInfo": "~> 1.11",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:gem/erubi"
          }
        ]
      },
      {
        "name": "spring",
        "SPDXID": "SPDXRef-gem-spring-75c946",
        "versionInfo": ">= 0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:gem/spring"
          }
        ]
      }
    ]
  }
};
if (typeof module !== 'undefined') module.exports = gemData;

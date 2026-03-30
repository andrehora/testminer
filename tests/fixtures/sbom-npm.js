var npmData = {
  "sbom": {
    "spdxVersion": "SPDX-2.3",
    "name": "com.github.expressjs/express",
    "packages": [
      {
        "name": "com.github.expressjs/express",
        "SPDXID": "SPDXRef-github-expressjs-express-master-f2d78f",
        "versionInfo": "master",
        "downloadLocation": "git+https://github.com/expressjs/express",
        "filesAnalyzed": false,
        "licenseDeclared": "MIT",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:github/expressjs/express@master"
          }
        ]
      },
      {
        "name": "supertest",
        "SPDXID": "SPDXRef-npm-supertest-6.3.0-0d9594",
        "versionInfo": "^6.3.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:npm/supertest@%5E6.3.0"
          }
        ]
      },
      {
        "name": "pbkdf2-password",
        "SPDXID": "SPDXRef-npm-pbkdf2-password-1.2.1-33d185",
        "versionInfo": "1.2.1",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "licenseConcluded": "MIT",
        "copyrightText": "Copyright (c) 2013-2016 Matteo Collina, http://matteocollina.com, Copyright (c) 2015 Matteo Collina",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:npm/pbkdf2-password@1.2.1"
          }
        ]
      },
      {
        "name": "eslint",
        "SPDXID": "SPDXRef-npm-eslint-8.47.0-f2645b",
        "versionInfo": "8.47.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "licenseConcluded": "MIT",
        "copyrightText": "Copyright 2013-2016 Dulin Marat and other contributors, Copyright OpenJS Foundation and other contributors, <www.openjsf.org>",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:npm/eslint@8.47.0"
          }
        ]
      }
    ]
  }
};
if (typeof module !== 'undefined') module.exports = npmData;

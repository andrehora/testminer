var pypiData = {
  "sbom": {
    "spdxVersion": "SPDX-2.3",
    "name": "com.github.pallets/flask",
    "packages": [
      {
        "name": "com.github.pallets/flask",
        "SPDXID": "SPDXRef-github-pallets-flask-main-376ed7",
        "versionInfo": "main",
        "downloadLocation": "git+https://github.com/pallets/flask",
        "filesAnalyzed": false,
        "licenseDeclared": "BSD-3-Clause",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:github/pallets/flask@main"
          }
        ]
      },
      {
        "name": "roman-numerals",
        "SPDXID": "SPDXRef-pypi-roman-numerals-4.1.0-75c946",
        "versionInfo": "4.1.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "licenseConcluded": "BSD-3-Clause AND 0BSD AND CC0-1.0 AND LicenseRef-scancode-unknown-license-reference",
        "copyrightText": "Copyright (c) 2024, Adam Turner",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:pypi/roman-numerals@4.1.0"
          }
        ]
      },
      {
        "name": "jinja2",
        "SPDXID": "SPDXRef-pypi-jinja2-3.1.6-75c946",
        "versionInfo": "3.1.6",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "licenseConcluded": "BSD-2-Clause AND BSD-3-Clause",
        "copyrightText": "(c) Copyright 2008 by http://domain.invalid/>, copyright 2007 Pallets, Copyright 2007 Pallets",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:pypi/jinja2@3.1.6"
          }
        ]
      },
      {
        "name": "sphinxcontrib-htmlhelp",
        "SPDXID": "SPDXRef-pypi-sphinxcontrib-htmlhelp-2.1.0-75c946",
        "versionInfo": "2.1.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "licenseConcluded": "BSD-2-Clause",
        "copyrightText": "Copyright (c) 2007-2019 by the Sphinx team (see https://github.com/sphinx-doc/sphinx/blob/master/AUTHORS), Copyright (c) 2019 ORGANIZATION",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:pypi/sphinxcontrib-htmlhelp@2.1.0"
          }
        ]
      }
    ]
  }
};
if (typeof module !== 'undefined') module.exports = pypiData;

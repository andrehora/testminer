var cargoData = {
  "sbom": {
    "spdxVersion": "SPDX-2.3",
    "name": "com.github.tokio-rs/tokio",
    "packages": [
      {
        "name": "com.github.tokio-rs/tokio",
        "SPDXID": "SPDXRef-github-tokio-rs-tokio-master-86a5d1",
        "versionInfo": "master",
        "downloadLocation": "git+https://github.com/tokio-rs/tokio",
        "filesAnalyzed": false,
        "licenseDeclared": "MIT",
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:github/tokio-rs/tokio@master"
          }
        ]
      },
      {
        "name": "libfuzzer-sys",
        "SPDXID": "SPDXRef-cargo-libfuzzer-sys-75c946",
        "versionInfo": ">= 0.4.0,< 0.5.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:cargo/libfuzzer-sys"
          }
        ]
      },
      {
        "name": "futures-util",
        "SPDXID": "SPDXRef-cargo-futures-util-75c946",
        "versionInfo": ">= 0.3.0,< 0.4.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:cargo/futures-util"
          }
        ]
      },
      {
        "name": "tokio",
        "SPDXID": "SPDXRef-cargo-tokio-75c946",
        "versionInfo": ">= 1.2.0,< 2.0.0",
        "downloadLocation": "NOASSERTION",
        "filesAnalyzed": false,
        "externalRefs": [
          {
            "referenceCategory": "PACKAGE-MANAGER",
            "referenceType": "purl",
            "referenceLocator": "pkg:cargo/tokio"
          }
        ]
      }
    ]
  }
};
if (typeof module !== 'undefined') module.exports = cargoData;

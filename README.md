[![Tests](https://github.com/andrehora/testminer/actions/workflows/tests.yml/badge.svg)](https://github.com/andrehora/testminer/actions/workflows/tests.yml)

# TestMiner

Webapp: https://andrehora.github.io/testminer/

A webapp for exploring and visualizing *software testing* across GitHub repositories. Analyze: how projects organize tests, how tests evolve across versions, and which testing libraries are used.

Examples: 
- Organizations: [Google](https://andrehora.github.io/testminer/#google), [Microsoft](https://andrehora.github.io/testminer/#microsoft), [Apple](https://andrehora.github.io/testminer/#apple), [Facebook](https://andrehora.github.io/testminer/#facebook), [Netflix](https://andrehora.github.io/testminer/#netflix), 
[GitHub](https://andrehora.github.io/testminer/#github), [Apache](https://andrehora.github.io/testminer/#apache), [HuggingFace](https://andrehora.github.io/testminer/#huggingface)
- Topics: [ai](https://andrehora.github.io/testminer/#ai), [llm](https://andrehora.github.io/testminer/#llm), [api](https://andrehora.github.io/testminer/#api), [nodejs](https://andrehora.github.io/testminer/#nodejs), [android](https://andrehora.github.io/testminer/#android), [python](https://andrehora.github.io/testminer/#python), [typescript](https://andrehora.github.io/testminer/#typescript), [rust](https://andrehora.github.io/testminer/#rust)
- Repositories: [fastapi/fastapi](https://andrehora.github.io/testminer/#fastapi/fastapi), [prisma/prisma](https://andrehora.github.io/testminer/#prisma/prisma), [github/linguist](https://andrehora.github.io/testminer/#github/linguist)


## Features

**Org view**: browse repositories for a GitHub organization.

**Topic view**: browse repositories for a GitHub topic.

**Repo view**: dive into a single repository:

- **Overview**: test statistics, including test files, test helpers, and CI tests.
- **Test Location**: file tree chart showing where tests are located.
- **Test History**: test metrics across releases.
- **Test Dependencies**: dependencies related to testing (extracted from [GitHub SBOM](https://docs.github.com/en/rest/dependency-graph/sboms))

Files are automatically classified into categories: `test`, `test-helper`, `e2e`, `mock`, `snapshot`, `fixture`, `benchmark`, `smoke`, `ci-test`, and `source`.

## Usage

Just open [testminer](https://andrehora.github.io/testminer) and search by:

- repository (e.g. `https://github.com/fastapi/fastapi`, or simply `fastapi/fastapi`)
- organization/user (e.g. `google`, `microsoft`)
- topic (e.g. `ai`, `llm`, `api`)

### GitHub Token

Without a token, the GitHub API allows 60 requests/hour. Adding a read-only personal access token increases this to 5,000/hour. The token is stored only in your browser's `localStorage`.

## Development

```bash
npm test        # Run unit tests (Jest)
npm run e2e     # Run end-to-end tests (Cypress, headless)
npm run serve   # Start static server on port 8081
```

## Stack

- Vanilla JavaScript (ES5), HTML5, CSS3
- [Chart.js](https://www.chartjs.org/), [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/) via CDN
- GitHub API, jsDelivr API
- Jest + Cypress for testing

## Configuration

[config.json](data/config.json) sets app behavior, including pagination limits, cache sizes, and search suggestions.

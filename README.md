# TestMiner

A webapp for exploring and visualizing *software testing* across GitHub repositories. Analyze:
- How projects organize tests.
- How tests evolve across versions.
- Which testing libraries are used.

## Features

**Owner view**: browse all repositories for a GitHub owner/organization

**Repo view**: dive into a single repository:

- **Overview**: test statistics.
- **Test Location**: file tree chart showing where tests are located.
- **Test History**: test metrics across releases.
- **Test Dependencies**: dependencies related to testing (extracted from [GitHub SBOM](https://docs.github.com/en/rest/dependency-graph/sboms))

Files are automatically classified into categories: `test`, `e2e`, `mock`, `snapshot`, `fixture`, `benchmark`, `smoke`, and `ci-test`.

## Usage

Just open `index.html` in a browser:

Search by:
- GitHub URL (e.g. `https://github.com/fastapi/fastapi`)
- `owner/repo` (e.g. `fastapi/fastapi`)
- Owner name (e.g. `google`)

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

[tminer.yml](tminer.yml) sets app behavior, including pagination limits, cache sizes, and search suggestions.

# TestMiner

A web app for exploring and visualizing test practices across GitHub repositories. Analyze how projects organize tests, which testing libraries they use, and how testing evolves across versions.

## Features

- **Owner view** — browse all repositories for a GitHub owner/organization
- **Repo view** — deep-dive into a single repository with four sections:
  - **Overview** — key test statistics
  - **Test Dependencies** — detected testing libraries
  - **Test Location** — file tree chart showing where tests live
  - **Test History** — test metrics across versions/releases

Files are automatically classified into categories: `test`, `e2e`, `mock`, `snapshot`, `fixture`, `benchmark`, `smoke`, and `ci-test`.

## Usage

Just open `index.html` in a browser — no build step required.

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
npm run serve   # Start static server on port 8080
```

## Stack

- Vanilla JavaScript (ES5), HTML5, CSS3 — no framework, no bundler
- [Chart.js](https://www.chartjs.org/), [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/) via CDN
- GitHub API, jsDelivr API
- Jest + Cypress for testing

## Configuration

[tminer.yml](tminer.yml) controls pagination limits, cache sizes, and search suggestions shown below the search box.

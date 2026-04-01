const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/**/*.cy.js',
    supportFile: 'tests/cypress-support.js',
    env: {
      gh_token: process.env.CYPRESS_GH_TOKEN || '',
    },
  },
})
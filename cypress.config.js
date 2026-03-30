const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/**/*.cy.js',
    supportFile: false,
  },
})
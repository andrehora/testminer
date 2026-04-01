describe('Search input update', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('index.html')
  });

  it('clicking a owner button populates the search input', () => {
    cy.contains('apache').click();
    cy.get('#repo-input').should('have.value', 'apache')
  });

  it('clicking the repo button populates the search input', () => {
    cy.contains('electron/electron').click();
    cy.get('#repo-input').should('have.value', 'electron/electron')
  });

  it('clicking a owner and repo button populates the search input', () => {
    cy.contains('apache').click();
    cy.get('#repo-input').should('have.value', 'apache');
    cy.contains('electron/electron').click();
    cy.get('#repo-input').should('have.value', 'electron/electron');
  });
});

describe('URL update', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('clicking a owner button updates the URL hash', () => {
    cy.visit('index.html')
    cy.contains('apache').click();
    cy.url().should('include', '#apache')
  });

  it('clicking the repo button updates the URL hash', () => {
    cy.visit('index.html')
    cy.contains('electron/electron').click();
    cy.url().should('include', '#electron/electron')
  });

  it('clicking a owner and repo button updates the URL hash', () => {
    cy.visit('index.html')
    cy.contains('apache').click();
    cy.url().should('include', '#apache');
    cy.contains('electron/electron').click();
    cy.url().should('include', '#electron/electron');
  });

  it('page with a hash loads the corresponding repo', () => {
    cy.visit('index.html#andrehora/gitevo');
    cy.contains('Overview').should('be.visible');
    cy.contains('andrehora/gitevo').should('be.visible');
  });

  it('page with version tag in URL hash loads the corresponding repo version', () => {
    cy.visit('index.html#andrehora/gitevo@v0.1.1');
    cy.contains('Overview').should('be.visible');
    cy.contains('andrehora/gitevo').should('be.visible');
    cy.contains('@v0.1.1').should('be.visible');
  });

  it('page with non-existent owner in URL hash shows error message', () => {
    cy.visit('index.html#_nonexistent_');
    cy.contains('Could not find GitHub user').should('be.visible');
  });

  it('page with non-existent repo in URL hash shows error message', () => {
    cy.visit('index.html#nonexistent/repo');
    cy.contains('Could not fetch repository').should('be.visible');
  });
});


describe('Cache management', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('index.html')
  });

  it('clear cache is not visible on page load', () => {
    cy.contains('Clear all').should('not.be.visible');
  });

  it('clear cache is visible on click', () => {
    cy.contains('Clear all').should('not.be.visible');
    cy.contains('Recently viewed').should('not.be.visible');
    cy.contains('apache').click();
    cy.contains('Recently viewed', { timeout: 10000 }).should('be.visible');
  });

  it('clear cache is visible and then hidden', () => {
    cy.contains('Clear all').should('not.be.visible');
    cy.contains('Recently viewed').should('not.be.visible');
    cy.contains('apache').click();
    cy.contains('Recently viewed', { timeout: 10000 }).should('be.visible');
    cy.contains('Clear all').click();
    cy.contains('Recently viewed').should('not.be.visible');
  });
});
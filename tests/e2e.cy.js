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
    cy.contains('prisma/prisma').click();
    cy.get('#repo-input').should('have.value', 'prisma/prisma')
  });

  it('clicking a owner and repo button populates the search input', () => {
    cy.contains('apache').click();
    cy.get('#repo-input').should('have.value', 'apache');
    cy.contains('prisma/prisma').click();
    cy.get('#repo-input').should('have.value', 'prisma/prisma');
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
    cy.contains('prisma/prisma').click();
    cy.url().should('include', '#prisma/prisma')
  });

  // it('clicking a owner and repo button updates the URL hash', () => {
  //   cy.visit('index.html')
  //   cy.contains('apache').click();
  //   cy.url().should('include', '#apache');
  //   cy.contains('prisma/prisma').click();
  //   cy.url().should('include', '#prisma/prisma');
  // });

  it('page with a hash loads the corresponding repo', () => {
    cy.visit('index.html#andrehora/gitevo');
    cy.contains('Overview').should('be.visible');
    cy.contains('andrehora / gitevo').should('be.visible');
  });

  it('page with version tag in URL hash loads the corresponding repo version', () => {
    cy.visit('index.html#andrehora/gitevo@0.1.1');
    cy.contains('Overview').should('be.visible');
    cy.contains('andrehora / gitevo').should('be.visible');
    cy.contains('@0.1.1').should('be.visible');
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

describe('Owner page', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('shows repos for a valid owner', () => {
    cy.visit('index.html#andrehora');
    cy.get('#owner-table', { timeout: 10000 }).should('be.visible');
    cy.get('#owner-table tbody tr').should('have.length.greaterThan', 0);
  });

  it('shows repo names in the table', () => {
    cy.visit('index.html#andrehora');
    cy.get('#owner-table', { timeout: 10000 }).should('be.visible');
    cy.get('.repo-name-cell').first().should('not.be.empty');
  });

  it('clicking a repo row navigates to the repo page', () => {
    cy.visit('index.html#andrehora');
    cy.get('#owner-table', { timeout: 10000 }).should('be.visible');
    cy.get('.owner-table-row').first().click();
    cy.url().should('match', /#andrehora\/.+/);
    cy.contains('Overview').should('be.visible');
  });
});

describe('Repo page', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('index.html#andrehora/gitevo');
  });

  it('shows the overview section', () => {
    cy.get('#section-title-overview', { timeout: 10000 }).should('be.visible');
    cy.get('#section-title-overview').should('contain', 'Overview');
    cy.get('#stats-grid').should('be.visible');
  });

  it('shows the test location section', () => {
    cy.get('#section-title-state', { timeout: 10000 }).should('be.visible');
    cy.get('#section-title-state').should('contain', 'Test Location');
    cy.get('#tree-chart').should('be.visible');
  });

  it('shows the test dependencies section', () => {
    cy.get('#section-title-deps', { timeout: 10000 }).should('be.visible');
    cy.get('#section-title-deps').should('contain', 'Test Dependencies');
    cy.get('#deps-container').should('be.visible');
  });

  it('shows the test history section', () => {
    cy.get('#section-title-history', { timeout: 10000 }).should('be.visible');
    cy.get('#section-title-history').should('contain', 'Test History');
    cy.get('#version-chart-container').should('be.visible');
  });
});

describe('File list modal', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('index.html#andrehora/gitevo');
    cy.get('#stats-grid', { timeout: 10000 }).should('be.visible');
  });

  it('clicking a box opens the modal', () => {
    cy.get('.dash-card.clickable').first().click();
    cy.get('#file-list-modal').should('be.visible');
    cy.get('#file-list-modal-title').should('not.be.empty');
    cy.get('#file-list-modal-items li').should('have.length.greaterThan', 0);
  });

  it('clicking a badge opens the modal', () => {
    cy.get('.test-term-badge').first().click();
    cy.get('#file-list-modal').should('be.visible');
    cy.get('#file-list-modal-title').should('not.be.empty');
    cy.get('#file-list-modal-items li').should('have.length.greaterThan', 0);
  });

  it('modal links point to GitHub', () => {
    cy.get('.dash-card.clickable').first().click();
    cy.get('#file-list-modal').should('be.visible');
    cy.get('#file-list-modal-items li a').first()
      .should('have.attr', 'href')
      .and('include', 'https://github.com/andrehora/gitevo/blob/');
    cy.get('#file-list-modal-items li a').first()
      .should('have.attr', 'target', '_blank');
  });
});